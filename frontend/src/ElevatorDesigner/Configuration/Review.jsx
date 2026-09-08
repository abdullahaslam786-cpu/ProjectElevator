import React, { useState, useEffect } from "react";
import { modelConfigs } from "../config/modelConfigs";

// ─── Presign cache (module-level, persists across calls) ──────────────────
const presignCache = {};

async function presign(key) {
  if (presignCache[key]) return presignCache[key];
  try {
    const res = await fetch(`/api/presign-single?key=${encodeURIComponent(key)}`);
    if (!res.ok) {
      console.warn(`[Presign] FAILED (${res.status}) for key: ${key}`);
      return null;
    }
    const data = await res.json();
    if (data.url) {
      presignCache[key] = data.url;
      console.log(`[Presign] OK: ${key}`);
    }
    return data.url || null;
  } catch (err) {
    console.warn(`[Presign] ERROR for key: ${key}`, err.message);
    return null;
  }
}

async function buildViewUrls({
  viewNum,
  config,
  appliedMaterials,
  appliedHandrail,
  appliedSubHandrail,
  appliedCeiling,
  appliedFloor,
  appliedLight,
  appliedDoor,
  origin,
}) {
  const urls = [];
  const layers = config.skeletonViews?.[viewNum] || [];
  const layerMap = config.layerToPanelByView?.[viewNum] || {};

  console.log(`[BuildView] View ${viewNum}: ${layers.length} skeleton layers`);
  console.log(`[BuildView] appliedMaterials zones:`, Object.keys(appliedMaterials || {}));
  console.log(`[BuildView] overlays — handrail:${appliedHandrail} ceiling:${appliedCeiling} floor:${appliedFloor} light:${appliedLight} subhandrail:${appliedSubHandrail} door:${appliedDoor}`);

  // ── 1. Skeleton layers with material substitution ──
  for (const layer of layers) {
    const panelInfo = layerMap[layer.id];

    if (panelInfo) {
      const { zone, panelNum } = panelInfo;
      const applied = appliedMaterials?.[zone]?.[panelNum];

      if (applied?.keyPrefix) {
        let fileName;

        if (
          applied.keyPrefix.includes("blackLayers") ||
          applied.keyPrefix.includes("goldenLayers")
        ) {
          fileName = `${panelNum}.png`;
        } else if (applied.keyPrefix.includes("Reveals")) {
          fileName = `${viewNum}.png`;
        } else {
          fileName = `${layer.id}.png`;
        }

        const materialKey = `${applied.keyPrefix}/V${viewNum}/${fileName}`;
        const matUrl = await presign(materialKey);

        if (matUrl) {
          urls.push(matUrl);
          continue;
        } else {
          console.warn(`[BuildView] Material presign failed, falling back to skeleton. Key: ${materialKey}`);
        }
      }
    }

    // Skeleton fallback
    const skeletonUrl = `${origin}/static-proxy${layer.img}`;
    urls.push(skeletonUrl);
  }

  // ── 2. Overlays ──
  if (appliedFloor) {
    const key = `SubMaterial/floor/V${viewNum}/${appliedFloor}.png`;
    const url = await presign(key);
    if (url) urls.push(url);
    else console.warn(`[BuildView] Floor MISSING: ${key}`);
  }

  if (appliedHandrail) {
    const key = `SubMaterial/handrails/V${viewNum}/${appliedHandrail}.png`;
    const url = await presign(key);
    if (url) urls.push(url);
    else console.warn(`[BuildView] Handrail MISSING: ${key}`);
  }

  if (appliedCeiling) {
    const key = `SubMaterial/ceiling/V${viewNum}/${appliedCeiling}.png`;
    const url = await presign(key);
    if (url) urls.push(url);
    else console.warn(`[BuildView] Ceiling MISSING: ${key}`);
  }

  if (appliedLight) {
    const key = `SubMaterial/lights/V${viewNum}/${appliedLight}.png`;
    const url = await presign(key);
    if (url) urls.push(url);
    else console.warn(`[BuildView] Light MISSING: ${key}`);
  }

  if (appliedSubHandrail) {
    const key = `SubMaterial/subhandrail/V${viewNum}/${viewNum}.png`;
    const url = await presign(key);
    if (url) urls.push(url);
    else console.warn(`[BuildView] SubHandrail MISSING: ${key}`);
  }

  // Door — only view 3, no view number in key
  if (appliedDoor && viewNum === 3) {
    const key = `SubMaterial/doors/${appliedDoor}.png`;
    const url = await presign(key);
    if (url) urls.push(url);
    else console.warn(`[BuildView] Door MISSING: ${key}`);
  }

  console.log(`[BuildView] View ${viewNum} total URLs: ${urls.length}`);
  return urls;
}

// ───────────────────────────────────────────────────────────────────────────
const Review = ({
  presignedCache: _externalCache,
  selectedModelId,
  selectedView,
  subprojectId,
  appliedMaterials,
  appliedHandrail,
  appliedSubHandrail,
  appliedCeiling,
  appliedFloor,
  appliedLight,
  appliedDoor,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // ── New: real, controlled fields for the PDF's info panel ──────────────
  const [projectName, setProjectName] = useState("");
  const [dimensions, setDimensions] = useState({ D1: "", W1: "", H1: "", H2: "" });
  const [showDimensions, setShowDimensions] = useState(false);
  const [jobType, setJobType] = useState("");
  const [elevatorType, setElevatorType] = useState("");
  const [cabShellMaterial, setCabShellMaterial] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [comments, setComments] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    if (paymentStatus === "success") {
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === "cancel") {
      alert("Payment was cancelled.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleDimensionChange = (key, value) => {
    setDimensions((prev) => ({ ...prev, [key]: value }));
  };

  const handleDownloadPDF = async () => {
    const config = modelConfigs[selectedModelId];
    if (!config) {
      alert("Please select a model first.");
      return;
    }

    console.log("=== PDF DOWNLOAD INITIATED ===");
    console.log("selectedModelId:", selectedModelId);
    console.log("appliedHandrail:", appliedHandrail);
    console.log("appliedSubHandrail:", appliedSubHandrail);
    console.log("appliedCeiling:", appliedCeiling);
    console.log("appliedFloor:", appliedFloor);
    console.log("appliedLight:", appliedLight);
    console.log("appliedDoor:", appliedDoor);
    console.log("appliedMaterials:", JSON.stringify(appliedMaterials, null, 2));

    try {
      setIsLoading(true);
      const origin = window.location.origin;
      const imageUrlsGroups = [];

      for (const viewNum of [1, 2, 3]) {
        const urls = await buildViewUrls({
          viewNum,
          config,
          appliedMaterials: appliedMaterials || {},
          appliedHandrail,
          appliedSubHandrail,
          appliedCeiling,
          appliedFloor,
          appliedLight,
          appliedDoor,
          origin,
        });

        console.log(`[Review] View ${viewNum} final URL count: ${urls.length}`);
        urls.forEach((u, i) => console.log(`  [${i}] ${u.substring(0, 80)}...`));

        imageUrlsGroups.push(urls);
      }

      if (imageUrlsGroups.length === 0) {
        alert("No layers could be resolved. Please check your selections.");
        return;
      }

      // Pull the fabricator/customer's email from local storage, if present,
      // purely to show it in the footer the way the reference PDF does.
      let userEmail = "";
      try {
        const storedUser = JSON.parse(localStorage.getItem("userInfo"));
        userEmail = storedUser?.email || "";
      } catch {
        userEmail = "";
      }

      const response = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrlsGroups,
          modelName: `${selectedModelId || "Custom"}`,
          projectName,
          selectedView,
          dimensions,
          jobType,
          elevatorType,
          cabShellMaterial,
          manufacturer,
          quantity,
          comments,
          designId: subprojectId,
          userEmail,
          appliedMaterials,
          appliedHandrail,
          appliedSubHandrail,
          appliedCeiling,
          appliedFloor,
          appliedLight,
          appliedDoor,
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Elevator-Design-${selectedModelId || "Custom"}-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF Error:", err);
      alert(`Failed to generate PDF: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
   <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Jost:wght=200;300;400;500&display=swap');

        .review-root {
          font-family: 'Jost', sans-serif;
          background: linear-gradient(180deg, #FFFDF6, #F7EFCF); /* Soft Cream to Light Golden Veil */
          color: #5C4A26; /* Deep Bronze-Gold text */
          min-height: 100%;
        }

        .review-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 12px;
          background: linear-gradient(180deg, #423516 0%, #29200B 100%); /* Deep Satin Gold-Onyx */
          border-bottom: 1px solid #C9A245; /* Polished Golden Hairline Separator */
        }
        .review-header-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 12px;
          font-weight: 300;
          letter-spacing: 0.15em;
          color: #FFF3CD; /* Radiant White-Gold Tint */
        }

        .review-content {
          height: 540px;
          overflow-y: auto;
          padding: 12px;
          background: linear-gradient(180deg, #FFFDF6, #F7EFCF);
          scrollbar-width: thin;
          scrollbar-color: #D4AF37 #F7EFCF;
        }

        .review-section {
          background: #FFFBF0; /* Warm Alabaster Gold Base */
          border: 1px solid #D6C394; /* Soft Brushed Gold Border */
          border-radius: 4px;
          margin-bottom: 12px;
          box-shadow: 0 10px 30px rgba(184, 142, 47, 0.1);
        }

        .review-section-label {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 20px;
          background: #FAEDC8; /* Soft Amber-Cream Matte Surface */
          border-bottom: 1px solid #D6C394;
        }

        .review-section-label span {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #AA9154; /* Muted Ochre-Gold Label Text */
        }

        .review-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #E8D8A7; /* Light Gold Wireframe Separator */
        }

        .review-input {
          width: 100%;
          padding: 4px 18px;
          background: #FFFFFF; /* Pure Bright Chalk White for contrast and readability */
          border: 1px solid #D6C394;
          border-radius: 4px;
          color: #3D3012; /* Rich Dark Bronze for text input entry */
          font-size: 13px;
          outline: none;
          transition: all 0.3s cubic-bezier(0.25, 1, 0.33, 1);
        }

        .review-input::placeholder {
          color: #BAAB82;
        }

        .review-input:focus {
          border-color: #B88E2F;
          box-shadow: 0 0 12px rgba(184, 142, 47, 0.2);
          background: #FFFDF9;
        }

        .review-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .review-field-label {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #937A3E;
          margin-bottom: 6px;
          display: block;
        }

        /* ── Plus-prefixed labels (matches the reference spec sheet) ── */
        .review-plus-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #7A6535;
          display: block;
        }

        /* ── Label + dropdown row (Job Type / Elevator Type / etc.) ── */
        .review-select-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          padding: 0px 0;
        }

        .review-select-row .review-plus-label {
          flex: 0 0 44%;
          margin-bottom: 0;
        }

        .review-select {
          flex: 1;
          min-width: 160px;
          padding: 4px 14px;
          background: #FFFFFF;
          border: 1px solid #D6C394;
          border-radius: 4px;
          color: #3D3012;
          font-size: 13px;
          outline: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 1, 0.33, 1);
        }

        .review-select:focus {
          border-color: #B88E2F;
          box-shadow: 0 0 12px rgba(184, 142, 47, 0.2);
        }

        /* ── Collapse / expand toggle ("+LESS DETAILS (click to collapse)") ── */
        .review-collapse-toggle {
          background: none;
          border: none;
          padding: 0;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #937A3E;
          cursor: pointer;
          transition: color 0.3s;
        }

        .review-collapse-toggle:hover {
          color: #B88E2F;
        }

        /* ── Dimensions preview box (D1 / W1 / H1 / H2 rows) ── */
        .review-dim-box {
          border: 1px solid #D6C394;
          border-radius: 4px;
          background: #FFFBF0;
          padding: 6px 16px;
        }

        .review-dim-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 2px 0;
          border-bottom: 1px solid #E8D8A7;
        }

        .review-dim-row:last-child {
          border-bottom: none;
        }

        .review-dim-badge {
          flex: 0 0 30px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: #7A6535;
          background: #FAEDC8;
          border: 1px solid #D6C394;
          border-radius: 3px;
        }

        .review-dim-label {
          flex: 1;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.05em;
          color: #937A3E;
          text-transform: uppercase;
        }

        .review-dim-input {
          flex: 0 0 130px;
          padding: 8px 10px;
          background: #FFFFFF;
          border: 1px solid #D6C394;
          border-radius: 4px;
          color: #3D3012;
          font-size: 12px;
          outline: none;
          transition: all 0.3s cubic-bezier(0.25, 1, 0.33, 1);
        }

        .review-dim-input:focus {
          border-color: #B88E2F;
          box-shadow: 0 0 12px rgba(184, 142, 47, 0.2);
        }

        .review-dim-input:disabled {
          background: #F5F0DE;
          color: #BAAB82;
          cursor: not-allowed;
        }

        /* ── Luxury Action Buttons (Glaze Effect Matching Controllers) ── */
        .review-luxury-btn {
          position: relative;
          width: 100%;
          height: 30px;
          background: #FAEDC8;
          border: 1px solid #D6C394;
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.3s;
        }

        .review-btn-glaze {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #E6C262 0%, #FFF2CC 50%, #B88E2F 100%); /* Shimmering Luxury Gold Sweep */
          transform: translateX(-100%);
          transition: transform 0.5s cubic-bezier(0.25, 1, 0.33, 1);
        }

        .review-btn-text {
          position: relative;
          z-index: 2;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #7A6535; /* Crisp Medium Bronze-Gold text */
          transition: color 0.3s;
        }

        .review-luxury-btn:hover .review-btn-glaze {
          transform: translateX(0);
        }

        .review-luxury-btn:hover .review-btn-text {
          color: #241A03;
        }

        .review-luxury-btn:disabled {
          opacity: 0.5;
          background: #E8E5DA;
          border-color: #D1CDBC;
          cursor: not-allowed;
        }
        
        .review-luxury-btn:disabled .review-btn-text {
          color: #A39F8E;
        }

        /* Wrap-up Special Large CTA Button */
        .review-cta-btn {
          position: relative;
          width: 100%;
          padding: 12px 0;
          background: linear-gradient(135deg, #E6C262 0%, #B88E2F 100%); /* Bold Golden Base */
          color: #FFFFFF; /* High Bright Contrast white text for luxury impact */
          border: none;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 1, 0.33, 1);
          box-shadow: 0 4px 15px rgba(184, 142, 47, 0.25);
          text-shadow: 0 1px 2px rgba(41, 32, 11, 0.3);
        }

        .review-cta-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(184, 142, 47, 0.4);
          background: linear-gradient(135deg, #FFF2CC 0%, #E6C262 50%, #B88E2F 100%);
        }

        .review-cta-btn:disabled {
          background: #E0DBCE;
          color: #A39E93;
          text-shadow: none;
          box-shadow: none;
          cursor: not-allowed;
        }
      `}</style>

      <div className="review-root">
        {/* Header */}
        <div className="review-header">
          <div className="review-header-title">DESIGN REVIEW</div>
          <div style={{ fontSize: 9, letterSpacing: '0.25em', color: '#d4a843', fontWeight: 600 }}>
            FINAL SUMMARY
          </div>
        </div>

        <div className="review-content">
          <div className="mb-2 text-[11px] tracking-wide text-[#8a8680] leading-relaxed uppercase">
            Your elevator configuration is complete. Please review selections, specify optional constraints, and render the design specification sheet.
          </div>

          {/* PROJECT NAME */}
          <div className="review-section">
            <div className="review-section-label"><span>PROJECT / JOB NAME</span></div>
            <div className="p-2">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Hilton Hotel Lobby Elevator"
                className="review-input"
              />
              <p className="text-[11px] text-[#8a8680] italic mt-2">
                This appears at the top of your downloaded spec sheet, next to the model name.
              </p>
            </div>
          </div>

          {/* DIMENSIONS */}
          <div className="review-section">
            <div className="review-section-label"><span>DIMENSIONS</span></div>
            <div className="p-2 space-y-4">
              <p className="text-xs text-[#B88E2F] italic">
                Dimensions are not mandatory at this stage to complete your design. However, you will need to provide them to request an 'Advanced Download'. You can do this now or in the future.
              </p>

              <div className="review-dim-box">
                {[
                  { key: "D1", label: "DEPTH:" },
                  { key: "W1", label: "WIDTH:" },
                  { key: "H1", label: "CAB SHELL HEIGHT:" },
                  { key: "H2", label: "CEILING HEIGHT:" },
                ].map(({ key, label }) => (
                  <div className="review-dim-row" key={key}>
                    <span className="review-dim-badge">{key}</span>
                    <span className="review-dim-label">{label}</span>
                    <input
                      type="text"
                      value={dimensions[key]}
                      onChange={(e) => handleDimensionChange(key, e.target.value)}
                      disabled={!showDimensions}
                      placeholder={showDimensions ? "in inches" : ""}
                      className="review-dim-input"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowDimensions((v) => !v)}
                className="review-luxury-btn"
              >
                <div className="review-btn-glaze" />
                <span className="review-btn-text">
                  {showDimensions ? "LOCK DIMENSIONS" : "EDIT CAB DIMENSIONS"}
                </span>
              </button>
            </div>
          </div>

          {/* QUANTITY */}
          <div className="mb-2">
            <label className="review-plus-label mb-2">+ QUANTITY:</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="review-input "
            />
          </div>

          {/* COMMENTS */}
          <div className="mb-0">
            <textarea
              rows={5}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Use this field to share any additional comment on your elevator interior design. If you use a 'Custom' material in your design, please provide us with as much information as possible in order to streamline the quoting process."
              className="review-input resize-y min-h-[120px]"
            ></textarea>
          </div>

          {/* DETAILS TOGGLE */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="review-collapse-toggle mb-2"
          >
            {isOpen ? "+LESS DETAILS (click to collapse)" : "+MORE DETAILS (click to expand)"}
          </button>

          {isOpen && (
            <div className="review-section">
              <div className="p-2 space-y-2">
                <div className="review-select-row">
                  <label className="review-plus-label">+ JOB TYPE:</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="review-select"
                  >
                    <option value="">Select an Option</option>
                    <option value="New Construction">New Construction</option>
                    <option value="Modernization">Modernization</option>
                    <option value="Retrofit">Retrofit</option>
                  </select>
                </div>

                <div className="review-select-row">
                  <label className="review-plus-label">+ ELEVATOR TYPE:</label>
                  <select
                    value={elevatorType}
                    onChange={(e) => setElevatorType(e.target.value)}
                    className="review-select"
                  >
                    <option value="">Select an Option</option>
                    <option value="Passenger">Passenger</option>
                    <option value="Freight">Freight</option>
                    <option value="Residential">Residential</option>
                  </select>
                </div>

                <div className="review-select-row">
                  <label className="review-plus-label">+ CAB SHELL MATERIAL:</label>
                  <select
                    value={cabShellMaterial}
                    onChange={(e) => setCabShellMaterial(e.target.value)}
                    className="review-select"
                  >
                    <option value="">Select an Option</option>
                    <option value="Stainless Steel">Stainless Steel</option>
                    <option value="Painted Steel">Painted Steel</option>
                    <option value="Glass">Glass</option>
                  </select>
                </div>

                <div className="review-select-row">
                  <label className="review-plus-label">+ MANUFACTURER:</label>
                  <select
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="review-select"
                  >
                    <option value="">Select an Option</option>
                    <option value="Otis">Otis</option>
                    <option value="Schindler">Schindler</option>
                    <option value="KONE">KONE</option>
                    <option value="ThyssenKrupp">ThyssenKrupp</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* WRAP-UP */}
          <div className="review-section mt-2">
            <div className="review-section-label"><span>SPECIFICATION VERIFICATION</span></div>
            <div className="p-2 text-center">
              <p className="text-[9px] text-[#8a8680] mb-2 leading-relaxed tracking-wider uppercase">
                All parameters auto-saved to cloud repository.<br />
                Compile configuration layouts into production-ready blueprint document.
              </p>
              <button
                onClick={handleDownloadPDF}
                disabled={isLoading}
                className="review-cta-btn"
              >
                {isLoading ? "COMPILING SPEC SHEET..." : "DOWNLOAD PRO BLUEPRINT (6 PAGES)"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Review;