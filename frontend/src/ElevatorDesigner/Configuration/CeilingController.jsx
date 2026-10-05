import React, { useEffect, useState, useRef, useCallback } from "react";
import { IoClose, IoCheckmark } from "react-icons/io5";
import { RingLoader } from "react-spinners";
import gsap from "gsap";

// Ceiling numbers that ALLOW lights
const CEILINGS_WITH_LIGHT = [1, 5, 6, 7];

// Fixed local icons shown ON the light buttons (display only).
const LIGHT_BUTTON_ICONS = ["/lights/yellow.png", "/lights/white.png"];

const pad = (n) => String(n).padStart(2, "0");

const CeilingController = ({ applyCeiling, applyLight }) => {
  const [selectedCeiling, setSelectedCeiling] = useState(null);
  const [selectedLight, setSelectedLight] = useState(1);

  const [ceilingThumbnails, setCeilingThumbnails] = useState([]);
  const [lightThumbnails, setLightThumbnails] = useState([]);

  const [ceilingPreviewUrl, setCeilingPreviewUrl] = useState(null);
  const [allCeilingImages, setAllCeilingImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const previewContainerRef = useRef(null);
  const lightsSectionRef = useRef(null);

  // Status for the conditional Light Options container
  const lightsEnabled = CEILINGS_WITH_LIGHT.includes(selectedCeiling);

  // ── Robust Image Processing Engine ──
  const processImages = useCallback((data) => {
    return data
      .filter((item) => item.key.endsWith(".png"))
      .map((item) => {
        const match = item.key.match(/(\d+)\.png$/);
        return { ...item, num: match ? parseInt(match[1]) : 0 };
      })
      .sort((a, b) => a.num - b.num);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cRes, lRes] = await Promise.all([
          fetch("/api/images-by-prefix?prefix=SubMaterial/ceiling"),
          fetch("/api/images-by-prefix?prefix=SubMaterial/lights"),
        ]);

        const ceilingData = await cRes.json();
        const lightData = await lRes.json();

        setAllCeilingImages(ceilingData);

        const thumbs = processImages(ceilingData.filter((i) => i.key.includes("/V1/")));
        setCeilingThumbnails(thumbs);
        setLightThumbnails(processImages(lightData.filter((i) => i.key.includes("/V1/"))));

        // ── Auto-select the FIRST ceiling option on load ──
        if (thumbs.length > 0) {
          const first = thumbs[0];
          setSelectedCeiling(first.num);
          applyCeiling(first.num);

          // If the first ceiling supports lights, keep default light selected
          if (CEILINGS_WITH_LIGHT.includes(first.num)) {
            setSelectedLight(1);
            applyLight?.(1);
          } else {
            setSelectedLight(null);
            applyLight?.(null);
          }

          const found = ceilingData.find((img) =>
            img.key.includes(`/V1/${first.num}.png`)
          );
          if (found) setCeilingPreviewUrl(found.url);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [processImages, applyCeiling, applyLight]);

  // GSAP: Preview banner open / close (same behaviour as the handrail preview)
  useEffect(() => {
    if (!previewContainerRef.current) return;
    if (ceilingPreviewUrl) {
      gsap.to(previewContainerRef.current, {
        height: 300,
        duration: 0.5,
        ease: "power3.out",
      });
    } else {
      gsap.to(previewContainerRef.current, {
        height: 0,
        duration: 0.4,
        ease: "power3.inOut",
      });
    }
  }, [ceilingPreviewUrl]);

  // GSAP: Lights Section Reveal
  useEffect(() => {
    if (lightsSectionRef.current) {
      if (lightsEnabled) {
        gsap.to(lightsSectionRef.current, {
          height: "auto",
          opacity: 1,
          duration: 0.6,
          ease: "power3.out",
        });
      } else {
        gsap.to(lightsSectionRef.current, {
          height: 0,
          opacity: 0,
          duration: 0.4,
          ease: "power3.inOut",
        });
      }
    }
  }, [lightsEnabled]);

  const handleCeilingSelect = (num) => {
    setSelectedCeiling(num);
    applyCeiling(num);

    if (!CEILINGS_WITH_LIGHT.includes(num)) {
      setSelectedLight(null);
      applyLight(null);
    } else {
      // When switching to a ceiling that supports lights, restore default light if none selected
      if (selectedLight === null) {
        setSelectedLight(1);
        applyLight(1);
      }
    }

    const found = allCeilingImages.find((img) => img.key.includes(`/V1/${num}.png`));
    if (found) setCeilingPreviewUrl(found.url);
  };

  const handleNoneLight = useCallback(() => {
    setSelectedLight(null);
    applyLight(null);
  }, [applyLight]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Jost:wght@200;300;400;500&display=swap');

        .cec-root {
          font-family: 'Jost', sans-serif;
          color: #5C4A26;
          background: linear-gradient(180deg, #FFFDF8, #F7F1E4);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .cec-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 24px;
          background: #FFFFFF;
          border-bottom: 1px solid #EADFC8;
          flex-shrink: 0;
        }

        .cec-header-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.15em;
          color: #4A3826;
        }

        /* ── Preview banner (matches handrail) ── */
        .cec-preview {
          position: relative;
          overflow: hidden;
          background: #F7F1E4;
          height: 0px;
          flex-shrink: 0;
        }

        .cec-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
        }

        .cec-preview-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(74,56,38,0.85) 0%, transparent 55%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 20px;
        }

        .cec-preview-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 400;
          color: #FFFDF6;
          letter-spacing: 0.1em;
        }

        .cec-apply-btn {
          padding: 8px 20px;
          background: transparent;
          border: 1px solid #FFF3D6;
          font-family: 'Jost', sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #FFF3D6;
          cursor: pointer;
          border-radius: 3px;
          transition: all 0.3s;
        }

        .cec-apply-btn:hover {
          background: linear-gradient(135deg, #E7A94C 0%, #C9974E 100%);
          border-color: #C9974E;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(184, 142, 47, 0.25);
        }

        .cec-preview-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 253, 246, 0.9);
          border: 1px solid #E7DFCB;
          color: #5C4A26;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cec-preview-close:hover {
          background: #FFFFFF;
          border-color: #C9974E;
        }

        /* ── Scroll area ── */
        .cec-content {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          background: linear-gradient(180deg, #FFFDF8, #F7F1E4);
          scrollbar-width: thin;
          scrollbar-color: #C9974E #F7F1E4;
        }

        .cec-section-label {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 14px;
        }

        .cec-section-label span {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #AA9154;
        }

        .cec-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #EADFC8;
        }

        /* ── Option cards (matches handrail style cards) ── */
        .cec-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
          gap: 12px;
          padding: 0 14px;
        }

        .cec-card {
          position: relative;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          background: #FFFFFF;
          border: 1px solid #E7DFCB;
          border-radius: 10px;
          overflow: hidden;
          transition: border-color 0.3s ease, transform 0.3s cubic-bezier(0.25, 1, 0.33, 1), box-shadow 0.3s ease;
        }

        .cec-card-image-wrap {
          position: relative;
          aspect-ratio: 1;
          background: #FBF7EC;
        }

        .cec-card-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          opacity: 0.92;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .cec-card-check {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E7A94C 0%, #C9974E 100%);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(74, 56, 38, 0.35);
        }

        .cec-card-label {
          padding: 6px 4px;
          text-align: center;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #8F7A4F;
          background: #FFFDF6;
          border-top: 1px solid #F0E8D2;
          transition: background 0.3s ease, color 0.3s ease;
        }

        .cec-card:hover {
          border-color: #C9974E;
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(180, 140, 70, 0.18);
        }

        .cec-card:hover img {
          opacity: 1;
          transform: scale(1.03);
        }

        .cec-card.selected {
          border-color: #C9974E;
          box-shadow: 0 8px 20px rgba(201, 151, 78, 0.3);
        }

        .cec-card.selected img {
          opacity: 1;
        }

        .cec-card.selected .cec-card-label {
          background: linear-gradient(135deg, #F7ECD8 0%, #F0DEB8 100%);
          color: #5C4A26;
        }

        /* ── Luxury button (matches handrail ON/OFF buttons) ── */
        .cec-luxury-btn {
          position: relative;
          height: 35px;
          background: #FFFFFF;
          border: 1px solid #E7DFCB;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease;
        }

        .cec-btn-glaze {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #F7ECD8 0%, #F0DEB8 100%);
          transform: translateX(-100%);
          transition: transform 0.35s cubic-bezier(0.25, 1, 0.33, 1), background 0.3s ease;
          z-index: 1;
        }

        .cec-btn-text {
          position: relative;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #8F7A4F;
          z-index: 2;
          transition: color 0.3s ease;
        }

        .cec-luxury-btn:not(.active):hover {
          border-color: #D6C394;
          transform: translateY(-1px);
        }

        .cec-luxury-btn:not(.active):hover .cec-btn-glaze {
          transform: translateX(0);
        }

        .cec-luxury-btn:not(.active):hover .cec-btn-text {
          color: #5C4A26;
        }

        .cec-luxury-btn:active {
          transform: translateY(0) scale(0.98);
        }

        .cec-luxury-btn.active {
          border-color: #C9974E;
          background: #FFFCF3;
          box-shadow: 0 4px 14px rgba(201, 151, 78, 0.2);
        }

        .cec-luxury-btn.active .cec-btn-glaze {
          transform: translateX(0);
          background: linear-gradient(135deg, #F7ECD8 0%, #EFDBAF 100%);
        }

        .cec-luxury-btn.active .cec-btn-text {
          color: #5C4A26;
          font-weight: 700;
        }

        .cec-luxury-btn.clear-btn.active {
          border-color: #C8BEA4;
          background: #FBF9F3;
        }

        .cec-luxury-btn.clear-btn.active .cec-btn-glaze {
          background: linear-gradient(135deg, #EDE7D6 0%, #E1D8BE 100%);
        }

        .cec-luxury-btn.clear-btn.active .cec-btn-text {
          color: #5C4A26;
        }

        .cec-lights-section {
          overflow: hidden;
          opacity: 0;
          height: 0;
        }

        .cec-top-row {
          flex-shrink: 0;
        }

        /* Lights sit in the narrow left column: 2 cards per row, like before */
        .cec-lights-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
      `}</style>

      <div className="cec-root">
        <div className="cec-header">
          <div className="flex flex-col">
            <div className="cec-header-title">CEILING CONFIGURATOR</div>
            <div className="text-[11px] text-[#AA9154] tracking-[0.15em] font-light">
              Please select the Ceiling according to your Elevator design
            </div>
          </div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.25em",
              color: "#C9974E",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Premium Series
          </div>
        </div>

        {/* Top row: lights on the LEFT (2 cols), preview on the RIGHT (4 cols) — original positioning */}
        <div className="grid grid-cols-6 cec-top-row">
          <div className="col-span-2 p-3 flex flex-col justify-between">
            <div ref={lightsSectionRef} className="cec-lights-section w-full">
              <div className="cec-section-label" style={{ padding: "6px 0" }}>
                <span>INTEGRATED LIGHTING</span>
              </div>
              <div className="cec-lights-grid">
                {lightThumbnails.slice(0, 8).map((item, idx) => (
                  <div
                    key={item.num}
                    className={`cec-card ${selectedLight === item.num ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedLight(item.num);
                      applyLight(item.num);
                    }}
                  >
                    <div className="cec-card-image-wrap">
                      <img
                        src={LIGHT_BUTTON_ICONS[idx] || item.url}
                        alt={`Light ${item.num}`}
                      />
                      {selectedLight === item.num && (
                        <div className="cec-card-check">
                          <IoCheckmark size={12} />
                        </div>
                      )}
                    </div>
                    <div className="cec-card-label">Glow {pad(item.num)}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, marginBottom: 4 }}>
                <div
                  className={`cec-luxury-btn clear-btn ${
                    selectedLight === null ? "active" : ""
                  }`}
                  onClick={handleNoneLight}
                >
                  <div className="cec-btn-glaze" />
                  <div className="cec-btn-text" style={{ fontSize: 9, textAlign: "center", padding: "0 4px" }}>
                    Deactivate Illumination
                  </div>
                </div>
              </div>
            </div>
          </div>

        <div ref={previewContainerRef} className="cec-preview col-span-4">
          {ceilingPreviewUrl && (
            <>
              <img src={ceilingPreviewUrl} alt="Preview" className="cec-preview-img" />
              <div className="cec-preview-overlay">
                <div className="cec-preview-name">
                  STRUCTURE OPTION {pad(selectedCeiling ?? 0)}
                </div>
                <div style={{ marginTop: "12px" }}>
                  <button
                    className="cec-apply-btn"
                    onClick={() => setCeilingPreviewUrl(null)}
                  >
                    CONFIRM LAYER
                  </button>
                </div>
              </div>
              <button
                className="cec-preview-close"
                onClick={() => {
                  setCeilingPreviewUrl(null);
                  setSelectedCeiling(null);
                  applyCeiling(null);
                }}
              >
                <IoClose size={16} />
              </button>
            </>
          )}
        </div>
        </div>

        <div className="cec-content">
          <div className="cec-section-label">
            <span>CEILING STRUCTURE</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RingLoader color="#C9974E" size={40} />
            </div>
          ) : (
            <div className="cec-grid">
              {ceilingThumbnails.map((item) => (
                <div
                  key={item.num}
                  className={`cec-card ${selectedCeiling === item.num ? "selected" : ""}`}
                  onClick={() => handleCeilingSelect(item.num)}
                >
                  <div className="cec-card-image-wrap">
                    <img src={item.url} alt={`Ceiling ${item.num}`} />
                    {selectedCeiling === item.num && (
                      <div className="cec-card-check">
                        <IoCheckmark size={12} />
                      </div>
                    )}
                  </div>
                  <div className="cec-card-label">Ceiling {pad(item.num)}</div>
                </div>
              ))}
            </div>
          )}

          <div className="pb-14" />
        </div>
      </div>
    </>
  );
};

export default CeilingController;