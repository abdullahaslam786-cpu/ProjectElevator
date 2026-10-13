import PDFDocument from "pdfkit";
import sharp from "sharp";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Adjust this to point at your frontend public/ folder ──────────────────
const PUBLIC_DIR = path.resolve(__dirname, "../../client/public");

// Put meds-logo.png (provided alongside this file) in the same folder as this
// controller, or change this path to wherever you keep it.
const LOGO_PATH = path.resolve(__dirname, "meds-logo.png");

// Dimension images, kept in the SAME folder as this controller:
//   page 1 → front.png, page 2 → straight.png, page 3 → back.png (optional).
// Each one is a transparent PNG of the dimension frame (H1 / H2 lines, D1 / W1 lines
// and their boxes). The frame is the CANVAS: the model is scaled to sit inside the
// lines (see fitModelIntoDimensionFrame), so the lines always surround the model.
// If a file is missing, that page is printed with the model only.
const DIMENSION_OVERLAYS = ["front.png", "straight.png", "back.png"];

// ─── Brand / layout constants ─────────────────────────────────────────────
const TAGLINE = "ELEVATE IDEAS.   BUILD REALITY.";
const WEBSITE = "MyElevatorDesignStudio.com";
const TITLE = "ELEVATOR DESIGN SUMMARY";

const PAGE = { width: 612, height: 792 }; // US Letter
const MARGIN = 40;
const CONTENT_W = PAGE.width - MARGIN * 2;

const COLORS = {
  ink: "#1c1c1c",
  label: "#5f5f5f",
  rule: "#bdbdbd",
  dim: "#4a4a4a",
};

const OPENING_LABELS = { 1: "Front", 2: "Straight", 3: "Back" };

// Box (right column) the model + its dimension frame is fitted into.
const CAB = {
  x: 185,
  y: 214,
  maxW: 387,
  maxH: 482,
};

// How the model is placed inside the dimension frame. The H1 / H2 lines are found
// automatically from the overlay image; these numbers only control the spacing.
// Lower number = bigger model, closer to the lines.
const DIMENSION_FIT = {
  // gap between each vertical H line and the model, as a fraction of the H1↔H2 distance
  sideGap: 0.02,
  // gap between the model's lowest point and the lowest D1 / W1 line point (same unit)
  bottomGap: 0.035,
  // a column is treated as an H1 / H2 line if it is opaque over this fraction of the image height
  lineCoverage: 0.25,
  // pixels with alpha above this count as "drawn"
  alphaThreshold: 40,
  // used only if the H1 / H2 lines can't be detected (fractions of the overlay size)
  fallback: { left: 0.07, right: 0.07, top: 0.03, bottom: 0.1 },
};

// ─── Fetch a buffer — disk for skeleton files, HTTP for S3 ───────────────
async function fetchBuffer(urlOrPath) {
  const staticProxyPattern = /^https?:\/\/[^/]+\/static-proxy(\/.*)/;
  const proxyMatch = urlOrPath.match(staticProxyPattern);

  if (proxyMatch) {
    const relativePath = decodeURIComponent(proxyMatch[1]);
    const filePath = path.join(PUBLIC_DIR, relativePath);

    if (!filePath.startsWith(PUBLIC_DIR)) {
      throw new Error(`Forbidden path: ${filePath}`);
    }
    if (!fs.existsSync(filePath)) {
      throw new Error(`Skeleton file not found: ${filePath}`);
    }
    return fs.promises.readFile(filePath);
  }

  const response = await axios.get(urlOrPath, {
    responseType: "arraybuffer",
    maxRedirects: 5,
    timeout: 15000,
  });
  return Buffer.from(response.data, "binary");
}

// ─── Load the dimension image for a page (front / straight / back) ────────
const overlayCache = new Map();

async function loadDimensionOverlay(pageIndex) {
  const file = DIMENSION_OVERLAYS[pageIndex];
  if (!file) return null;

  const filePath = path.resolve(__dirname, file);
  if (overlayCache.has(filePath)) return overlayCache.get(filePath);

  if (!fs.existsSync(filePath)) {
    console.warn(`[PDF] Dimension image not found, skipping: ${filePath}`);
    return null; // not cached, so adding the file later works without a restart
  }

  const buffer = await fs.promises.readFile(filePath);
  overlayCache.set(filePath, buffer);
  return buffer;
}

// ─── Composite ordered PNG buffers into one image ─────────────────────────
async function compositeBuffers(buffers) {
  if (buffers.length === 0) return null;

  let base = await sharp(buffers[0]).png().toBuffer();
  const { width, height } = await sharp(base).metadata();

  for (let i = 1; i < buffers.length; i++) {
    try {
      const overlay = await sharp(buffers[i])
        .resize(width, height, { fit: "fill", kernel: "lanczos3" })
        .png()
        .toBuffer();

      base = await sharp(base)
        .composite([{ input: overlay, blend: "over" }])
        .png()
        .toBuffer();
    } catch (err) {
      console.warn(`[PDF] Composite failed for layer ${i}:`, err.message);
    }
  }

  return base;
}

// ─── Read raw RGBA + alpha bounds ─────────────────────────────────────────
async function readRaw(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

function alphaBounds({ data, width, height, channels }, threshold) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  const columnCount = new Uint32Array(width);

  for (let y = 0; y < height; y++) {
    const rowStart = y * width * channels;
    for (let x = 0; x < width; x++) {
      if (data[rowStart + x * channels + 3] > threshold) {
        columnCount[x]++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY, columnCount };
}

// ─── Put the model INSIDE the dimension frame ─────────────────────────────
// The dimension image is the canvas. We find its H1 / H2 vertical lines and its
// lowest point (where the D1 / W1 lines meet), then scale the model to fit between
// them, so the lines surround the model like the original design.
async function fitModelIntoDimensionFrame(modelBuffer, overlayBuffer) {
  const { sideGap, bottomGap, lineCoverage, alphaThreshold, fallback } = DIMENSION_FIT;

  const overlayRaw = await readRaw(overlayBuffer);
  const OW = overlayRaw.width;
  const OH = overlayRaw.height;
  const ob = alphaBounds(overlayRaw, alphaThreshold);

  // Model: crop away any empty transparent margin so we fit the cab itself
  const modelRaw = await readRaw(modelBuffer);
  const mb = alphaBounds(modelRaw, 10);
  let model = modelBuffer;
  let mW = modelRaw.width;
  let mH = modelRaw.height;
  if (mb.maxX >= 0) {
    const cw = mb.maxX - mb.minX + 1;
    const ch = mb.maxY - mb.minY + 1;
    if (cw < mW || ch < mH) {
      model = await sharp(modelBuffer)
        .extract({ left: mb.minX, top: mb.minY, width: cw, height: ch })
        .png()
        .toBuffer();
      mW = cw;
      mH = ch;
    }
  }

  // H1 = left-most tall vertical line, H2 = right-most tall vertical line
  const tall = OH * lineCoverage;
  let h1 = -1;
  let h2 = -1;
  for (let x = 0; x < OW; x++) {
    if (ob.columnCount[x] >= tall) { h1 = x; break; }
  }
  for (let x = OW - 1; x >= 0; x--) {
    if (ob.columnCount[x] >= tall) { h2 = x; break; }
  }

  let rectLeft;
  let rectRight;
  let rectTop;
  let rectBottom;

  if (h1 >= 0 && h2 - h1 > OW * 0.3) {
    const span = h2 - h1;
    rectLeft = h1 + span * sideGap;
    rectRight = h2 - span * sideGap;
    rectTop = 0;
    rectBottom = ob.maxY - span * bottomGap;
  } else {
    console.warn("[PDF] H1/H2 lines not detected in dimension image, using fallback spacing");
    rectLeft = OW * fallback.left;
    rectRight = OW * (1 - fallback.right);
    rectTop = OH * fallback.top;
    rectBottom = OH * (1 - fallback.bottom);
  }

  const availW = Math.max(1, rectRight - rectLeft);
  const availH = Math.max(1, rectBottom - rectTop);
  const scale = Math.min(availW / mW, availH / mH);
  const w = Math.max(1, Math.round(mW * scale));
  const h = Math.max(1, Math.round(mH * scale));
  const left = Math.max(0, Math.round(rectLeft + (availW - w) / 2));
  const top = Math.max(0, Math.round(rectBottom - h));

  const resizedModel = await sharp(model)
    .resize(w, h, { fit: "fill", kernel: "lanczos3" })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: OW,
      height: OH,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    },
  })
    .composite([
      { input: resizedModel, left, top },
      { input: overlayBuffer, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();
}

// ─── "10.24.2024 01:52 PM" ────────────────────────────────────────────────
function formatRevisionTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  let hours = date.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())}.${date.getFullYear()} ${pad(hours)}:${pad(
    date.getMinutes()
  )} ${ampm}`;
}

// ══════════════════════════════════════════════════════════════════════════
// Header
// ══════════════════════════════════════════════════════════════════════════
function drawHeader(doc, { jobName, designName, designId }) {
  // Logo
  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, MARGIN, 14, { width: 262 });
  } else {
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor(COLORS.ink)
      .text("MyElevatorDesignStudio", MARGIN, 40, { lineBreak: false });
  }

  // Tagline (right)
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(COLORS.ink)
    .text(TAGLINE, MARGIN, 52, {
      width: CONTENT_W,
      align: "right",
      characterSpacing: 2,
      lineBreak: false,
    });

  // Rule under logo
  doc
    .moveTo(MARGIN, 98)
    .lineTo(MARGIN + CONTENT_W, 98)
    .lineWidth(0.6)
    .strokeColor(COLORS.rule)
    .stroke();

  // Title
  doc
    .font("Helvetica")
    .fontSize(18)
    .fillColor(COLORS.ink)
    .text(TITLE, MARGIN, 120, { characterSpacing: 4.5, lineBreak: false });

  // 4-column meta row
  const metaTop = 160;
  const colW = CONTENT_W / 4;
  const cols = [
    ["JOB NAME", jobName],
    ["DESIGN", designName],
    ["DESIGN ID", designId],
  ];

  cols.forEach(([label, value], i) => {
    const x = MARGIN + i * colW + (i === 0 ? 0 : 14);
    const w = colW - (i === 0 ? 14 : 20);

    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor(COLORS.label)
      .text(label, x, metaTop, { width: w, characterSpacing: 1.5, lineBreak: false });

    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(COLORS.ink)
      .text(value || "", x, metaTop + 13, { width: w, lineBreak: false, ellipsis: true });

    if (i > 0) {
      const dx = MARGIN + i * colW;
      doc
        .moveTo(dx, metaTop - 3)
        .lineTo(dx, metaTop + 28)
        .lineWidth(0.6)
        .strokeColor(COLORS.dim)
        .stroke();
    }
  });

  // Rule under meta row
  doc
    .moveTo(MARGIN, 200)
    .lineTo(MARGIN + CONTENT_W, 200)
    .lineWidth(0.6)
    .strokeColor(COLORS.rule)
    .stroke();
}

// ══════════════════════════════════════════════════════════════════════════
// Footer
// ══════════════════════════════════════════════════════════════════════════
function drawFooter(doc, { designId }) {
  const lineY = 706;

  doc
    .moveTo(MARGIN, lineY)
    .lineTo(MARGIN + CONTENT_W, lineY)
    .lineWidth(0.6)
    .strokeColor(COLORS.rule)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor(COLORS.label)
    .text(
      `${designId || "N/A"}    |    Rev. ${formatRevisionTimestamp()}`,
      MARGIN,
      lineY + 14,
      { lineBreak: false }
    );

  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(COLORS.label)
    .text(WEBSITE, MARGIN, lineY + 13, { width: CONTENT_W, align: "right", lineBreak: false });
}

// ══════════════════════════════════════════════════════════════════════════
// Left column: Opening Option … Comments (label / value / thin rule)
// ══════════════════════════════════════════════════════════════════════════
const LEFT_W = 126;

function drawRule(doc, y) {
  doc
    .moveTo(MARGIN, y)
    .lineTo(MARGIN + LEFT_W, y)
    .lineWidth(0.5)
    .strokeColor(COLORS.rule)
    .stroke();
}

function drawLabel(doc, text, y) {
  doc
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor(COLORS.label)
    .text(text, MARGIN, y, { width: LEFT_W, characterSpacing: 1.5, lineBreak: false });
}

function drawSimpleBlock(doc, y, label, value) {
  drawLabel(doc, label, y);
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.ink)
    .text(String(value ?? ""), MARGIN, y + 15, { width: LEFT_W, lineBreak: false, ellipsis: true });
  drawRule(doc, y + 33);
  return y + 49;
}

function drawLeftColumn(doc, data) {
  let y = 224;

  y = drawSimpleBlock(doc, y, "OPENING OPTION", data.openingOption);
  y = drawSimpleBlock(doc, y, "ELEVATOR TYPE", data.elevatorType);
  y = drawSimpleBlock(doc, y, "CAB SHELL MATERIAL", data.cabShellMaterial);
  y = drawSimpleBlock(doc, y, "QUANTITY", data.quantity);

  y = drawSimpleBlock(doc, y, "JOB TYPE", data.jobType);

  // Comments (no rule below)
  drawLabel(doc, "COMMENTS", y);
  if (data.comments) {
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.ink)
      .text(data.comments, MARGIN, y + 14, { width: LEFT_W, height: 70, lineGap: 1.7, ellipsis: true });
  }
}

// ══════════════════════════════════════════════════════════════════════════
// One full page (one per view)
// The model image already sits inside its dimension frame (front / straight / back
// .png), so it is simply fitted into the right column.
// ══════════════════════════════════════════════════════════════════════════
async function drawSummaryPage(doc, { header, left, imageBuffer, designId }) {
  doc.addPage({ size: "LETTER", margin: 0 });

  drawHeader(doc, header);
  drawLeftColumn(doc, left);

  if (imageBuffer) {
    const meta = await sharp(imageBuffer).metadata();
    const scale = Math.min(CAB.maxW / meta.width, CAB.maxH / meta.height);
    const w = meta.width * scale;
    const h = meta.height * scale;
    const x = CAB.x + (CAB.maxW - w) / 3;
    const y = CAB.y + (CAB.maxH - h) / 3;

    doc.image(imageBuffer, x, y, { width: w, height: h });
  }

  drawFooter(doc, { designId });
}

// ══════════════════════════════════════════════════════════════════════════
// Main handler
// ══════════════════════════════════════════════════════════════════════════
export const generateModelPDF = async (req, res) => {
  try {
    const {
      imageUrlsGroups,
      modelName,
      projectName,
      designName,
      selectedView,
      dimensions = {},
      jobType,
      elevatorType,
      cabShellMaterial,
      quantity,
      comments,
      designId,
    } = req.body;

    if (!imageUrlsGroups || imageUrlsGroups.length === 0) {
      return res.status(400).json({ message: "No image groups provided" });
    }

    const viewGroups = imageUrlsGroups.slice(0, 3);

    // Composite the layered renders for each view, then fit the model inside that
    // page's dimension frame (front.png / straight.png / back.png).
    const compositeImages = [];
    for (let i = 0; i < viewGroups.length; i++) {
      const results = await Promise.allSettled(viewGroups[i].map((url) => fetchBuffer(url)));
      const buffers = results.filter((r) => r.status === "fulfilled").map((r) => r.value);

      if (!buffers.length) {
        compositeImages.push(null);
        continue;
      }

      const modelImage = await compositeBuffers(buffers);
      const dimensionOverlay = await loadDimensionOverlay(i);

      if (!dimensionOverlay) {
        compositeImages.push(modelImage);
        continue;
      }

      try {
        compositeImages.push(await fitModelIntoDimensionFrame(modelImage, dimensionOverlay));
      } catch (err) {
        console.warn(`[PDF] Could not fit dimension frame on page ${i + 1}:`, err.message);
        compositeImages.push(modelImage);
      }
    }

    const doc = new PDFDocument({ autoFirstPage: false, size: "LETTER" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${(modelName || "Elevator-Design").replace(/[^a-z0-9\-_]/gi, "_")}.pdf"`
    );
    doc.pipe(res);

    for (let i = 0; i < viewGroups.length; i++) {
      const openingOption = OPENING_LABELS[selectedView] || OPENING_LABELS[i + 1] || "Front";

      await drawSummaryPage(doc, {
        header: {
          jobName: projectName || "",
          designName: designName || modelName || "",
          designId: designId || "",
        },
        left: {
          openingOption,
          elevatorType,
          cabShellMaterial,
          quantity: quantity || 1,
          dimensions,
          jobType,
          comments,
        },
        imageBuffer: compositeImages[i],
        designId,
      });
    }

    doc.end();
  } catch (error) {
    console.error("[PDF] Generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate PDF", error: error.message });
    }
  }
};