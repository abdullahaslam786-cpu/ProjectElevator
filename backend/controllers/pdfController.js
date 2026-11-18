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
    if (fs.existsSync(filePath)) {
      return fs.promises.readFile(filePath);
    }

    // Not on this server's disk (e.g. the API runs on a different machine than the
    // frontend) — try to download it from the URL the browser used instead.
    console.warn(`[PDF] Skeleton file not on disk (PUBLIC_DIR = ${PUBLIC_DIR}): ${relativePath} — trying HTTP`);
    const httpUrl = encodeURI(decodeURI(urlOrPath));
    const fallback = await axios.get(httpUrl, {
      responseType: "arraybuffer",
      maxRedirects: 5,
      timeout: 15000,
    });
    return Buffer.from(fallback.data, "binary");
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
  if (buffers.length === 1) return sharp(buffers[0]).png().toBuffer();

  const { width, height } = await sharp(buffers[0]).metadata();

  // Fast path: put every layer on in ONE pass (no PNG re-encode between layers)
  try {
    const layers = await Promise.all(
      buffers.slice(1).map(async (buf, idx) => {
        try {
          const meta = await sharp(buf).metadata();
          if (meta.width === width && meta.height === height) return { input: buf, blend: "over" };
          const resized = await sharp(buf)
            .resize(width, height, { fit: "fill", kernel: "lanczos3" })
            .png()
            .toBuffer();
          return { input: resized, blend: "over" };
        } catch (err) {
          console.warn(`[PDF] Skipping unreadable layer ${idx + 1}:`, err.message);
          return null;
        }
      })
    );
    return await sharp(buffers[0]).composite(layers.filter(Boolean)).png().toBuffer();
  } catch (err) {
    console.warn("[PDF] One-pass composite failed, using layer-by-layer fallback:", err.message);
  }

  // Safety net: the original slower, layer-by-layer way
  let base = await sharp(buffers[0]).png().toBuffer();
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
// Logo + tagline + top rule (shared by every page)
function drawBrandHeader(doc) {
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
}

function drawHeader(doc, { jobName, designName, designId }) {
  drawBrandHeader(doc);

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
// CONFIGURATION PAGES (after the 3 view pages)
//   • Configuration Overview  – lettered swatches + the model
//   • One section per element – wall panels, handrails, ceiling, flooring,
//     lighting, door – each material with its details and a large image
// ══════════════════════════════════════════════════════════════════════════

const IMAGE_BG = "#efece4";
const CONTENT_TOP = 176;
const CONTENT_BOTTOM = 696;

// Handrail folders / preview photos (same naming the Handrail configurator uses)
const FRONT_SPLIT_FOLDER = "FrontHandrails";
const SIDE_SPLIT_FOLDER = "SideHandrials";
const PREVIEW_HANDRAIL_NUMS = { round: [1, 2, 3], flat: [13, 14, 15], oval: [7, 8, 9] }; // silver, golden, black
const FINISH_INDEX = { silver: 0, golden: 1, gold: 1, black: 2 };
const FINISH_LABELS = { silver: "Silver", golden: "Gold", gold: "Gold", black: "Black" };
const LIGHT_LOCAL_ICONS = ["lights/yellow.png", "lights/white.png"];

const pad2 = (n) => String(n).padStart(2, "0");

const prettify = (value) =>
  String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

function letterFor(n) {
  if (n < 26) return String.fromCharCode(65 + n);
  return String.fromCharCode(64 + Math.floor(n / 26)) + String.fromCharCode(65 + (n % 26));
}

// ─── Readable label from a stored material keyPrefix ──────────────────────
function parseMaterialLabel(keyPrefix = "") {
  const gaf = keyPrefix.match(/GAF-\d{3}/i);
  if (gaf) return gaf[0].toUpperCase();
  if (keyPrefix.includes("goldenLayers")) return "Golden Accent Panel";
  if (keyPrefix.includes("blackLayers")) return "Black Base Panel";
  if (keyPrefix.includes("silverReveals")) return "Silver Reveal";
  if (keyPrefix.includes("blackReveals")) return "Black Reveal";
  return "Custom Finish";
}

// ─── Path ("S3 key") of a URL, decoded ─────────────────────────────────────
function urlPathKey(u) {
  try {
    return decodeURIComponent(new URL(u).pathname).replace(/^\//, "");
  } catch {
    return "";
  }
}

// The frontend already sends the exact (presigned) layer URLs of view 1. For a
// material, pick one of those — that is a file we know exists.
function findLayerUrl(layerUrls, keyPrefix) {
  const needle = `${keyPrefix}/V1/`;
  return (layerUrls || []).find((u) => typeof u === "string" && urlPathKey(u).startsWith(needle)) || null;
}

// ─── S3 key of the swatch image for one applied wall-panel material ───────
function swatchKeyForPanel(applied, panelNum) {
  if (!applied?.keyPrefix) return null;
  if (applied.keyPrefix.includes("Reveals")) return `${applied.keyPrefix}/V1/1.png`;
  return `${applied.keyPrefix}/V1/${panelNum}.png`;
}

// ─── Turn whatever details are stored on an applied material into text lines ──
const SKIP_DETAIL_KEYS = new Set([
  "keyPrefix", "url", "image", "img", "imageUrl", "thumbnail", "thumb", "src", "key", "keys", "presignedUrl",
]);

function describeApplied(applied) {
  const lines = [];
  const walk = (obj, depth) => {
    Object.entries(obj || {}).forEach(([k, v]) => {
      if (SKIP_DETAIL_KEYS.has(k) || v === null || v === undefined || v === "") return;
      if (typeof v === "object") {
        if (!Array.isArray(v) && depth < 1) walk(v, depth + 1);
        return;
      }
      lines.push(`${prettify(k)}: ${v}`);
    });
  };
  walk(applied, 0);
  return lines;
}

// ─── Build the list of sections / items from what the user selected ────────
function buildPanelItems(appliedMaterials = {}, layerUrls = []) {
  const byMaterial = new Map();

  Object.entries(appliedMaterials || {}).forEach(([zone, panels]) => {
    Object.entries(panels || {}).forEach(([panelNum, applied]) => {
      const fallbackKey = swatchKeyForPanel(applied, panelNum);
      if (!fallbackKey) return;

      if (!byMaterial.has(applied.keyPrefix)) {
        // Layer file names are layer numbers (GAF-010 → 7.png … 12.png), not the
        // panel number inside the zone, so also try the file name stored on the material.
        const isReveal = applied.keyPrefix.includes("Reveals");
        const storedFile = applied.url ? urlPathKey(applied.url).split("/").pop() : "";
        const fromStoredFile =
          !isReveal && /\.png$/i.test(storedFile) ? `${applied.keyPrefix}/V1/${storedFile}` : null;

        byMaterial.set(applied.keyPrefix, {
          applied,
          image: {
            url: findLayerUrl(layerUrls, applied.keyPrefix),
            keys: [...new Set([fromStoredFile, fallbackKey].filter(Boolean))],
          },
          refs: [],
        });
      }
      byMaterial.get(applied.keyPrefix).refs.push(`${zone}${panelNum}`);
    });
  });

  return [...byMaterial.values()].map(({ applied, image, refs }) => {
    const sorted = [...refs].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return {
      heading: `Panels ${sorted.join(", ")}`,
      shortRef: sorted.length > 4 ? `${sorted.slice(0, 4).join(", ")}…` : sorted.join(", "),
      lines: [`Material: ${parseMaterialLabel(applied.keyPrefix)}`, ...describeApplied(applied)],
      image,
    };
  });
}

function buildSplitHandrailItem(kind, applied) {
  if (!applied) return null;
  const style = applied.style || "";
  const finish = applied.finish || "";
  const idx = FINISH_INDEX[finish];
  const num = PREVIEW_HANDRAIL_NUMS[style]?.[idx];
  const folder = kind === "Front" ? FRONT_SPLIT_FOLDER : SIDE_SPLIT_FOLDER;
  const key =
    applied.keys?.[1]?.[0] ||
    (style && finish ? `SubMaterial/splithandrails/${folder}/${style}/${finish}/v1/1.png` : null);

  return {
    heading: `${kind} Handrail`,
    shortRef: `${kind} handrail`,
    lines: [
      `Placement: ${kind} Handrail`,
      style ? `Shape: ${prettify(style)}` : null,
      finish ? `Finish: ${FINISH_LABELS[finish] || prettify(finish)}` : null,
    ].filter(Boolean),
    image: { local: num ? `previewHandrails/${num}.png` : null, key },
  };
}

function buildSections(sel, layerUrls = []) {
  const sections = [];

  const panelItems = buildPanelItems(sel.appliedMaterials, layerUrls);
  if (panelItems.length) sections.push({ title: "WALL PANELS", items: panelItems });

  const handrails = [
    buildSplitHandrailItem("Front", sel.appliedFrontHandrail),
    buildSplitHandrailItem("Side", sel.appliedSideHandrail),
  ].filter(Boolean);

  if (sel.appliedSubHandrail) {
    handrails.push({
      heading: "Secondary Perimeter Guard",
      shortRef: "Perimeter guard",
      lines: ["Placement: Secondary Perimeter Guard", "Type: Bumper Rails", "Status: On"],
      image: { key: "SubMaterial/subhandrail/V1/1.png" },
    });
  }
  if (sel.appliedHandrail) {
    handrails.push({
      heading: "Handrail",
      shortRef: "Handrail",
      lines: [`Handrail style: ${pad2(sel.appliedHandrail)}`],
      image: { key: `SubMaterial/handrails/V1/${sel.appliedHandrail}.png` },
    });
  }
  if (handrails.length) sections.push({ title: "HANDRAILS", items: handrails });

  // Ceiling, flooring, lighting and door: each has its own heading, details and image
  const otherElements = [];

  if (sel.appliedCeiling) {
    otherElements.push({
      heading: "Ceiling",
      shortRef: "Ceiling",
      lines: [`Structure: Ceiling ${pad2(sel.appliedCeiling)}`, "Applied in all views"],
      image: { key: `SubMaterial/ceiling/V1/${sel.appliedCeiling}.png` },
    });
  }

  if (sel.appliedFloor) {
    otherElements.push({
      heading: "Flooring",
      shortRef: "Flooring",
      lines: [`Flooring finish: Base ${pad2(sel.appliedFloor)}`, "Applied in all views"],
      image: { local: `floor/${sel.appliedFloor}.png`, key: `SubMaterial/floor/V1/${sel.appliedFloor}.png` },
    });
  }

  if (sel.appliedLight) {
    otherElements.push({
      heading: "Lighting",
      shortRef: "Lighting",
      lines: [`Integrated lighting: Glow ${pad2(sel.appliedLight)}`, "Applied in all views"],
      image: {
        local: LIGHT_LOCAL_ICONS[Number(sel.appliedLight) - 1] || null,
        key: `SubMaterial/lights/V1/${sel.appliedLight}.png`,
      },
    });
  }

  if (sel.appliedDoor) {
    otherElements.push({
      heading: "Door",
      shortRef: "Door",
      lines: [`Door style: Door ${pad2(sel.appliedDoor)}`, "Shown in the back view"],
      image: { local: `doors/${sel.appliedDoor}.png`, key: `SubMaterial/doors/${sel.appliedDoor}.png` },
    });
  }

  if (otherElements.length) sections.push({ title: "OTHER ELEMENTS", items: otherElements });

  // Letters A, B, C… run across every item, panels first
  let n = 0;
  sections.forEach((section) => section.items.forEach((item) => { item.letter = letterFor(n++); }));
  return sections;
}

// ─── Image loading for the configuration pages ────────────────────────────
// Base URL of THIS server. Behind the Vite dev proxy / nginx the Host header is the
// browser's address (e.g. localhost:5173), which this machine cannot call — so use the
// port this server actually received the request on. Override with PDF_INTERNAL_URL.
function selfBaseUrl(req) {
  if (process.env.PDF_INTERNAL_URL) return process.env.PDF_INTERNAL_URL.replace(/\/$/, "");
  const port = req.socket?.localPort;
  if (port) return `http://127.0.0.1:${port}`;
  return `${req.protocol}://${req.get("host")}`;
}

async function presignKey(req, key) {
  try {
    const headers = {};
    if (req.headers?.authorization) headers.Authorization = req.headers.authorization;
    if (req.headers?.cookie) headers.Cookie = req.headers.cookie;

    const url = `${selfBaseUrl(req)}/api/presign-single?key=${encodeURIComponent(key)}`;
    const res = await axios.get(url, { timeout: 15000, headers });
    return res.data?.url || null;
  } catch (err) {
    console.warn(`[PDF] Presign failed for ${key}:`, err.message);
    return null;
  }
}

// Crop transparent margins and put the picture on a light background
async function prepareForPdf(buffer) {
  try {
    const raw = await readRaw(buffer);
    const b = alphaBounds(raw, 10);
    let img = sharp(buffer);
    if (b.maxX >= 0 && (b.maxX - b.minX + 1 < raw.width || b.maxY - b.minY + 1 < raw.height)) {
      img = img.extract({
        left: b.minX,
        top: b.minY,
        width: b.maxX - b.minX + 1,
        height: b.maxY - b.minY + 1,
      });
    }
    return await img.flatten({ background: IMAGE_BG }).png().toBuffer();
  } catch {
    return buffer;
  }
}

async function loadItemImage(req, image) {
  if (!image) return null;

  // 1) local file in the frontend public/ folder
  if (image.local) {
    const filePath = path.join(PUBLIC_DIR, image.local);
    if (filePath.startsWith(PUBLIC_DIR) && fs.existsSync(filePath)) {
      try {
        return await prepareForPdf(await fs.promises.readFile(filePath));
      } catch (err) {
        console.warn(`[PDF] Local image failed (${image.local}):`, err.message);
      }
    }
  }

  // 2) a ready-to-use URL the frontend already sent
  if (image.url) {
    try {
      return await prepareForPdf(await fetchBuffer(image.url));
    } catch (err) {
      console.warn(`[PDF] Layer URL failed (${urlPathKey(image.url)}):`, err.message);
    }
  }

  // 3) S3 via the presign endpoint — try each candidate key in order
  const keys = image.keys || (image.key ? [image.key] : []);
  for (const key of keys) {
    const url = await presignKey(req, key);
    if (!url) continue;
    try {
      return await prepareForPdf(await fetchBuffer(url));
    } catch (err) {
      console.warn(`[PDF] S3 image failed (${key}):`, err.message);
    }
  }

  console.warn(`[PDF] No image found for: ${JSON.stringify(image)}`);
  return null;
}

// ─── Page chrome for the configuration pages ──────────────────────────────
function drawCompactHeader(doc, { kicker, title, jobName, designName }) {
  drawBrandHeader(doc);

  if (kicker) {
    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor(COLORS.label)
      .text(kicker, MARGIN, 108, { characterSpacing: 1.5, lineBreak: false });
  }

  doc
    .font("Helvetica")
    .fontSize(18)
    .fillColor(COLORS.ink)
    .text(title, MARGIN, 120, { characterSpacing: 4.5, lineBreak: false });

  const label = [jobName, designName].filter(Boolean).join(" - ");
  if (label) {
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(COLORS.ink)
      .text(label, MARGIN, 128, { width: CONTENT_W, align: "right", lineBreak: false, ellipsis: true });
  }

  doc
    .moveTo(MARGIN, 152)
    .lineTo(MARGIN + CONTENT_W, 152)
    .lineWidth(0.6)
    .strokeColor(COLORS.rule)
    .stroke();
}

// Cut a single line of text so it fits `width` (font + size must already be set)
function fitLine(doc, text, width) {
  let t = String(text);
  if (doc.widthOfString(t) <= width) return t;
  while (t.length > 1 && doc.widthOfString(`${t}…`) > width) t = t.slice(0, -1);
  return `${t}…`;
}

function drawImageBox(doc, buffer, x, y, w, h, { placeholderText = true } = {}) {
  doc.rect(x, y, w, h).fillColor(IMAGE_BG).fill();
  if (buffer) {
    try {
      doc.image(buffer, x, y, { fit: [w, h], align: "center", valign: "center" });
      doc.rect(x, y, w, h).lineWidth(0.5).strokeColor("#d9d5c9").stroke();
      return;
    } catch (err) {
      console.warn("[PDF] Image render failed:", err.message);
    }
  }
  doc.rect(x, y, w, h).lineWidth(0.5).strokeColor("#d9d5c9").stroke();
  if (placeholderText) {
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(COLORS.label)
      .text("Image not available", x, y + h / 2 - 4, { width: w, align: "center", lineBreak: false });
  }
}

// ─── Configuration Overview: lettered swatches + the model ────────────────
async function drawOverviewPages(doc, { sections, modelBuffer, header, designId }) {
  const COLS = 3;
  const GAP = 12;
  const CELL_W = 72;
  const ROW_H = 126;

  let y = CONTENT_TOP;
  let first = true;

  const finishPage = () => drawFooter(doc, { designId });

  const newPage = async () => {
    doc.addPage({ size: "LETTER", margin: 0 });
    drawCompactHeader(doc, { title: "CONFIGURATION OVERVIEW", ...header });
    y = CONTENT_TOP;

    if (first && modelBuffer) {
      const meta = await sharp(modelBuffer).metadata();
      const boxX = 300;
      const boxW = MARGIN + CONTENT_W - boxX;
      const boxH = CONTENT_BOTTOM - CONTENT_TOP;
      const scale = Math.min(boxW / meta.width, boxH / meta.height);
      doc.image(modelBuffer, boxX, CONTENT_TOP, {
        width: meta.width * scale,
        height: meta.height * scale,
      });
    }
    first = false;
  };

  const drawCell = (item, x, top) => {
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor(COLORS.ink);
    doc.text(fitLine(doc, `${item.letter} : ${item.shortRef}`, CELL_W), x, top, { lineBreak: false });

    const imgY = top + 11;
    drawImageBox(doc, item.buffer, x, imgY, CELL_W, CELL_W, { placeholderText: false });

    // big letter on the swatch
    doc.save();
    doc.fillOpacity(0.55).circle(x + CELL_W / 2, imgY + CELL_W / 2, 16).fill("#000000");
    doc.restore();
    doc
      .font("Helvetica-Bold")
      .fontSize(item.letter.length > 1 ? 15 : 20)
      .fillColor("#ffffff")
      .text(item.letter, x, imgY + CELL_W / 2 - (item.letter.length > 1 ? 8 : 11), {
        width: CELL_W,
        align: "center",
        lineBreak: false,
      });

    let ly = imgY + CELL_W + 4;
    doc.font("Helvetica").fontSize(6.5).fillColor(COLORS.ink);
    item.lines.slice(0, 4).forEach((line) => {
      doc.text(fitLine(doc, line, CELL_W), x, ly, { lineBreak: false });
      ly += 8;
    });
  };

  const drawGroup = async (label, items) => {
    if (!items.length) return;
    if (y + 16 + ROW_H > CONTENT_BOTTOM) {
      finishPage();
      await newPage();
    }
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.ink).text(label, MARGIN, y, { lineBreak: false });
    y += 16;

    for (let r = 0; r * COLS < items.length; r++) {
      if (y + ROW_H > CONTENT_BOTTOM) {
        finishPage();
        await newPage();
      }
      for (let c = 0; c < COLS; c++) {
        const item = items[r * COLS + c];
        if (!item) break;
        drawCell(item, MARGIN + c * (CELL_W + GAP), y);
      }
      y += ROW_H;
    }
    y += 6;
  };

  const panelSection = sections.find((s) => s.title === "WALL PANELS");
  const otherItems = sections.filter((s) => s !== panelSection).flatMap((s) => s.items);

  await newPage();
  await drawGroup("PANELS", panelSection ? panelSection.items : []);
  await drawGroup("OTHER ELEMENTS", otherItems);
  finishPage();
}

// ─── One section: details on the left, big image on the right ─────────────
function drawSectionPages(doc, { section, header, designId }) {
  const ROWS_PER_PAGE = 3;
  const ROW_H = 174;
  const IMG_W = 232;
  const IMG_H = 160;
  const imgX = MARGIN + CONTENT_W - IMG_W;
  const textW = imgX - MARGIN - 20;

  for (let i = 0; i < section.items.length; i += ROWS_PER_PAGE) {
    doc.addPage({ size: "LETTER", margin: 0 });
    drawCompactHeader(doc, { kicker: "CONFIGURATION OVERVIEW", title: section.title, ...header });

    section.items.slice(i, i + ROWS_PER_PAGE).forEach((item, r) => {
      const top = CONTENT_TOP + r * ROW_H;

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(COLORS.ink)
        .text(`${item.letter} : ${item.heading}`, MARGIN, top, { width: textW });

      let ly = doc.y + 4;
      item.lines.forEach((line) => {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor(COLORS.ink)
          .text(line, MARGIN, ly, { width: textW });
        ly = doc.y + 2;
      });

      drawImageBox(doc, item.buffer, imgX, top, IMG_W, IMG_H);
    });

    drawFooter(doc, { designId });
  }
}

async function drawConfigurationPages(doc, { req, selections, layerUrls, modelBuffer, header, designId }) {
  const sections = buildSections(selections, layerUrls);
  if (!sections.length) return;

  // load every picture up front (in parallel)
  const allItems = sections.flatMap((s) => s.items);
  await Promise.all(
    allItems.map(async (item) => {
      item.buffer = await loadItemImage(req, item.image);
    })
  );

  await drawOverviewPages(doc, { sections, modelBuffer, header, designId });
  sections.forEach((section) => drawSectionPages(doc, { section, header, designId }));
}

// ══════════════════════════════════════════════════════════════════════════
// Main handler
// ══════════════════════════════════════════════════════════════════════════
export const generateModelPDF = async (req, res) => {
  const startedAt = Date.now();
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
      // selections used by the configuration pages
      appliedMaterials = {},
      appliedHandrail,
      appliedSubHandrail,
      appliedFrontHandrail,
      appliedSideHandrail,
      appliedCeiling,
      appliedFloor,
      appliedLight,
      appliedDoor,
    } = req.body;

    if (!imageUrlsGroups || imageUrlsGroups.length === 0) {
      return res.status(400).json({ message: "No image groups provided" });
    }

    const viewGroups = imageUrlsGroups.slice(0, 3);

    // Composite the layered renders for each view, then fit the model inside that
    // page's dimension frame (front.png / straight.png / back.png).
    const compositeImages = [];
    const plainModels = []; // model only (no dimension frame) — used on the overview page
    for (let i = 0; i < viewGroups.length; i++) {
      const results = await Promise.allSettled(viewGroups[i].map((url) => fetchBuffer(url)));
      const buffers = results.filter((r) => r.status === "fulfilled").map((r) => r.value);

      const failed = results
        .map((r, idx) => ({ r, idx }))
        .filter(({ r }) => r.status === "rejected");
      if (failed.length) {
        console.warn(`[PDF] View ${i + 1}: ${failed.length} of ${results.length} layers could not be loaded`);
        failed.slice(0, 10).forEach(({ r, idx }) =>
          console.warn(`[PDF]   layer ${idx}: ${String(viewGroups[i][idx]).slice(0, 110)} → ${r.reason?.message}`)
        );
      }

      if (!buffers.length) {
        compositeImages.push(null);
        plainModels.push(null);
        continue;
      }

      const modelImage = await compositeBuffers(buffers);
      plainModels.push(modelImage);
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

    // Collect the PDF in memory and send it only when it is complete. If anything
    // fails, the browser gets a clear error instead of a half-finished download.
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const pdfFinished = new Promise((resolve, reject) => {
      doc.on("end", resolve);
      doc.on("error", reject);
    });

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

    // ── Extra pages: configuration overview + every selected material ──
    try {
      await drawConfigurationPages(doc, {
        req,
        selections: {
          appliedMaterials,
          appliedHandrail,
          appliedSubHandrail,
          appliedFrontHandrail,
          appliedSideHandrail,
          appliedCeiling,
          appliedFloor,
          appliedLight,
          appliedDoor,
        },
        layerUrls: viewGroups[0] || [],
        modelBuffer: plainModels[0] || null,
        header: { jobName: projectName || "", designName: designName || modelName || "" },
        designId: designId || "",
      });
    } catch (err) {
      console.error("[PDF] Configuration pages failed (first pages are unaffected):", err);
    }

    doc.end();
    await pdfFinished;

    const pdfBuffer = Buffer.concat(chunks);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${(modelName || "Elevator-Design").replace(/[^a-z0-9\-_]/gi, "_")}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
    console.log(`[PDF] Sent ${(pdfBuffer.length / 1024).toFixed(0)} KB in ${Date.now() - startedAt} ms`);
  } catch (error) {
    console.error("[PDF] Generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate PDF", error: error.message });
    }
  }
};