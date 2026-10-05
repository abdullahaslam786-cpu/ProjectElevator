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

// Where the cab render sits (right column) and where the floor corners sit
// *inside the render* as fractions of its width/height. Tweak these if your
// 3D renders have different padding around the cab.
const CAB = {
  x: 215,
  y: 224,
  maxW: 327,
  maxH: 392,
  // vertical extent of the wall edges (H1 / H2 lines)
  wallTop: 0.1,
  wallBottom: 0.835,
  // floor corners: left, bottom (front), right
  floorLeft: { x: 0.02, y: 0.835 },
  floorFront: { x: 0.5, y: 1.0 },
  floorRight: { x: 0.98, y: 0.835 },
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
function drawHeader(doc, { jobName, location, designName, designId }) {
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
    ["LOCATION", location],
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
// Dimension annotations (vector, drawn around the cab render)
// ══════════════════════════════════════════════════════════════════════════
function arrowHead(doc, tipX, tipY, dirX, dirY, size = 4.5) {
  // dir = unit vector pointing from the line toward the tip
  const bx = tipX - dirX * size;
  const by = tipY - dirY * size;
  const px = -dirY * (size * 0.38);
  const py = dirX * (size * 0.38);
  doc
    .moveTo(tipX, tipY)
    .lineTo(bx + px, by + py)
    .lineTo(bx - px, by - py)
    .closePath()
    .fillColor(COLORS.dim)
    .fill();
}

function dimLine(doc, x1, y1, x2, y2) {
  doc.moveTo(x1, y1).lineTo(x2, y2).lineWidth(0.6).strokeColor(COLORS.dim).stroke();
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  arrowHead(doc, x1, y1, -ux, -uy);
  arrowHead(doc, x2, y2, ux, uy);
}

function dimLabel(doc, cx, cy, tag, value) {
  const boxW = 22;
  const boxH = 14;
  doc.rect(cx - boxW / 2, cy - boxH / 2, boxW, boxH).fillColor("#ffffff").fill();
  doc
    .rect(cx - boxW / 2, cy - boxH / 2, boxW, boxH)
    .lineWidth(0.6)
    .strokeColor(COLORS.dim)
    .stroke();
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.ink)
    .text(tag, cx - boxW / 2, cy - boxH / 2 + 3.5, { width: boxW, align: "center", lineBreak: false });
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.ink)
    .text(value || "", cx - 30, cy + boxH / 2 + 3, { width: 60, align: "center", lineBreak: false });
}

function drawDimensions(doc, rect, dims) {
  const { x, y, w, h } = rect;
  const top = y + h * CAB.wallTop;
  const bottom = y + h * CAB.wallBottom;
  const midY = (top + bottom) / 2 - 20;

  // H1 — left of the cab
  const h1x = x - 16;
  dimLine(doc, h1x, top, h1x, bottom);
  dimLabel(doc, h1x, midY, "H1", dims.H1);

  // H2 — right of the cab
  const h2x = x + w + 16;
  dimLine(doc, h2x, top, h2x, bottom);
  dimLabel(doc, h2x, midY, "H2", dims.H2);

  // Floor edges
  const L = { x: x + w * CAB.floorLeft.x, y: y + h * CAB.floorLeft.y };
  const F = { x: x + w * CAB.floorFront.x, y: y + h * CAB.floorFront.y };
  const R = { x: x + w * CAB.floorRight.x, y: y + h * CAB.floorRight.y };
  const OFFSET = 14;

  const offsetLine = (a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len; // outward normal (down-left for left edge, down-right for right edge)
    const ny = dx / len;
    return {
      a: { x: a.x + nx * OFFSET, y: a.y + ny * OFFSET },
      b: { x: b.x + nx * OFFSET, y: b.y + ny * OFFSET },
      n: { x: nx, y: ny },
    };
  };

  // D1 — front-left floor edge (L → F)
  const d1 = offsetLine(L, F);
  dimLine(doc, d1.a.x, d1.a.y, d1.b.x, d1.b.y);
  dimLabel(
    doc,
    (d1.a.x + d1.b.x) / 2 + d1.n.x * 22,
    (d1.a.y + d1.b.y) / 2 + d1.n.y * 12,
    "D1",
    dims.D1
  );

  // W1 — front-right floor edge (F → R)
  const w1 = offsetLine(F, R);
  dimLine(doc, w1.a.x, w1.a.y, w1.b.x, w1.b.y);
  dimLabel(
    doc,
    (w1.a.x + w1.b.x) / 2 + w1.n.x * 22,
    (w1.a.y + w1.b.y) / 2 + w1.n.y * 12,
    "W1",
    dims.W1
  );
}

// ══════════════════════════════════════════════════════════════════════════
// One full page (one per view)
// ══════════════════════════════════════════════════════════════════════════
async function drawSummaryPage(doc, { header, left, imageBuffer, dimensions, designId }) {
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
    drawDimensions(doc, { x, y, w, h }, dimensions);
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
      location,
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

    // Composite the layered renders for each view
    const compositeImages = [];
    for (let i = 0; i < viewGroups.length; i++) {
      const results = await Promise.allSettled(viewGroups[i].map((url) => fetchBuffer(url)));
      const buffers = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
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
          location: location || "",
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
        dimensions,
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