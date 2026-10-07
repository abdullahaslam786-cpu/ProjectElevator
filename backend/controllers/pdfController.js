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

// Dimension images (H1 / H2 / D1 / W1 markers), one per page, kept in the SAME
// folder as this controller:  page 1 → front.png, page 2 → straight.png,
// page 3 → back.png (optional — if the file is missing that page just has no overlay).
// They are laid over the model as an extra top layer, so they should be
// transparent PNGs on the same canvas size as the model renders.
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

// Box (right column) the model + its dimension overlay is fitted into.
// The dimension markers are now part of the image, so the whole column is used.
const CAB = {
  x: 185,
  y: 214,
  maxW: 387,
  maxH: 482,
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

// ─── Load the dimension overlay image for a page (front / straight / back) ──
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
    .text(String(value ?? ""), MARGIN, y + 13, { width: LEFT_W, lineBreak: false, ellipsis: true });
  drawRule(doc, y + 33);
  return y + 49;
}

function drawLeftColumn(doc, data) {
  let y = 224;

  y = drawSimpleBlock(doc, y, "OPENING OPTION", data.openingOption);
  y = drawSimpleBlock(doc, y, "ELEVATOR TYPE", data.elevatorType);
  y = drawSimpleBlock(doc, y, "CAB SHELL MATERIAL", data.cabShellMaterial);
  y = drawSimpleBlock(doc, y, "QUANTITY", data.quantity);

  // Dimensions
  drawLabel(doc, "DIMENSIONS", y);
  const rows = [
    ["D1:", data.dimensions.D1],
    ["W1:", data.dimensions.W1],
    ["H1:", data.dimensions.H1],
    ["H2:", data.dimensions.H2],
  ];
  let ry = y + 14;
  rows.forEach(([k, v]) => {
    doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.ink).text(k, MARGIN, ry, { lineBreak: false });
    doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.ink).text(v || "", MARGIN + 38, ry, { lineBreak: false });
    ry += 19;
  });
  drawRule(doc, ry - 2);
  y = ry + 14;

  y = drawSimpleBlock(doc, y, "JOB TYPE", data.jobType);

  // Comments (no rule below)
  drawLabel(doc, "COMMENTS", y);
  if (data.comments) {
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.ink)
      .text(data.comments, MARGIN, y + 13, { width: LEFT_W, height: 70, lineGap: 1.5, ellipsis: true });
  }
}

// ══════════════════════════════════════════════════════════════════════════
// One full page (one per view)
// The model image already has the dimension overlay (front / straight / back
// .png) composited on top of it, so it is simply fitted into the right column.
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
    const x = CAB.x + (CAB.maxW - w) / 2;
    const y = CAB.y + (CAB.maxH - h) / 2;

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

    // Composite the layered renders for each view, then put that page's
    // dimension image (front.png / straight.png / back.png) on top.
    const compositeImages = [];
    for (let i = 0; i < viewGroups.length; i++) {
      const results = await Promise.allSettled(viewGroups[i].map((url) => fetchBuffer(url)));
      const buffers = results.filter((r) => r.status === "fulfilled").map((r) => r.value);

      if (buffers.length) {
        const dimensionOverlay = await loadDimensionOverlay(i);
        if (dimensionOverlay) buffers.push(dimensionOverlay);
      }

      compositeImages.push(buffers.length ? await compositeBuffers(buffers) : null);
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