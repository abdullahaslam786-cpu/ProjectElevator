import React, { useEffect, useState, useRef } from "react";
import { IoClose, IoCheckmark } from "react-icons/io5";
import { RingLoader } from "react-spinners";
import gsap from "gsap";

// Local preview thumbs (UI only) — public/previewHandrails/1.png … 12.png
const getLocalHandrailImage = (num) => `/previewHandrails/${num}.png`;

// Only four styles under SubMaterial/splithandrails/
// Within each category: index 0 = Silver, 1 = Golden, 2 = Black
const HANDRAIL_CATEGORIES = [
  { label: "Round", nums: [1, 2, 3] },
  { label: "Flat",  nums: [13, 14, 15] },
  { label: "Oval",  nums: [7, 8, 9] },
  { label: "Add",   nums: [10, 11, 12] },
];

const FINISHES = [
  { name: "Silver", swatch: "radial-gradient(circle at 35% 32%, #ffffff 0%, #d6dade 35%, #a3a9ae 70%, #797f84 100%)" },
  { name: "Golden", swatch: "radial-gradient(circle at 35% 32%, #fff6dd 0%, #eac36c 35%, #c9974e 70%, #8b5e34 100%)" },
  { name: "Black",  swatch: "radial-gradient(circle at 35% 32%, #5a5852 0%, #2c2a26 40%, #131211 75%, #000000 100%)" },
];

const HandrailController = ({
  applyHandrail,
  applySubHandrail,
  // Parent (ElevatorDesigner3) just stores whatever is passed here, same as
  // applySubHandrail. ModelPreview does the actual per-view S3 key building —
  // so what we pass is a small { style, finish } descriptor, not a full key.
  // Passing null turns the layer off (same pattern as applySubHandrail(null)).
  applyFrontHandrail,
  applySideHandrail,
}) => {
  const [selectedHandrail, setSelectedHandrail] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subHandrailEnabled, setSubHandrailEnabled] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const [frontEnabled, setFrontEnabled] = useState(false);
  const [sideEnabled, setSideEnabled] = useState(false);
  const [splitFinish, setSplitFinish] = useState("silver");

  const previewContainerRef = useRef(null);

  useEffect(() => {
    const warm = async () => {
      try {
        setLoading(true);
        await fetch("/api/images-by-prefix?prefix=previewHandrails").catch(() => null);
      } finally {
        setLoading(false);
      }
    };
    warm();
  }, []);

  useEffect(() => {
    if (!previewContainerRef.current) return;
    if (previewUrl) {
      gsap.to(previewContainerRef.current, {
        height: 250,
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
  }, [previewUrl]);

  // Style / finish = UI ONLY — never touches the 3D model
  const handleMainSelect = (num) => {
    setSelectedHandrail(num);
    setPreviewUrl(getLocalHandrailImage(num));

    const cat = HANDRAIL_CATEGORIES.find((c) => c.nums.includes(num));
    if (cat) {
      const finishIdx = cat.nums.indexOf(num);
      const finishName = FINISHES[finishIdx]?.name?.toLowerCase();
      if (finishName) setSplitFinish(finishName);
    }
  };

  const handleCategoryClick = (idx) => {
    const isOpeningNew = selectedCategory !== idx;
    setSelectedCategory((prev) => (prev === idx ? null : idx));

    if (isOpeningNew) {
      handleMainSelect(HANDRAIL_CATEGORIES[idx].nums[0]);
      setFrontEnabled(false);
      setSideEnabled(false);
    }
  };

  const activeCategoryIndex = selectedHandrail
    ? HANDRAIL_CATEGORIES.findIndex((cat) => cat.nums.includes(selectedHandrail))
    : -1;

  const openCategoryIndex =
    selectedCategory !== null ? selectedCategory : activeCategoryIndex;

  const selectedStyleKey =
    openCategoryIndex !== -1 && openCategoryIndex !== null
      ? HANDRAIL_CATEGORIES[openCategoryIndex].label.toLowerCase()
      : null;

  // FRONT — pass a { style, finish } descriptor, or null to turn the layer off.
  // ModelPreview builds the actual SubMaterial/splithandrails/FrontHandrails/... key
  // per-view from this, exactly like appliedHandrail/appliedCeiling/etc. are just
  // identifiers and ModelPreview builds their per-view keys too.
  useEffect(() => {
    if (!applyFrontHandrail) return;

    if (!frontEnabled || !selectedStyleKey) {
      applyFrontHandrail(null);
      return;
    }

    applyFrontHandrail({ style: selectedStyleKey, finish: splitFinish });
  }, [frontEnabled, selectedStyleKey, splitFinish, applyFrontHandrail]);

  // SIDE — same pattern
  useEffect(() => {
    if (!applySideHandrail) return;

    if (!sideEnabled || !selectedStyleKey) {
      applySideHandrail(null);
      return;
    }

    applySideHandrail({ style: selectedStyleKey, finish: splitFinish });
  }, [sideEnabled, selectedStyleKey, splitFinish, applySideHandrail]);

  // Bumper — unchanged
  const toggleSubHandrail = () => {
    const next = !subHandrailEnabled;
    setSubHandrailEnabled(next);
    applySubHandrail(next ? "subhandrail" : null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght=300;400;500&family=Jost:wght=200;300;400;500&display=swap');

        .hrc-root {
          font-family: 'Jost', sans-serif;
          color: #5C4A26;
          background: linear-gradient(180deg, #FFFDF8, #F7F1E4);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .hrc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 24px;
          background: #FFFFFF;
          border-bottom: 1px solid #EADFC8;
          flex-shrink: 0;
        }

        .hrc-header-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.15em;
          color: #4A3826;
        }

        .hrc-preview {
          position: relative;
          overflow: hidden;
          background: #F7F1E4;
          height: 0px;
          flex-shrink: 0;
        }

        .hrc-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hrc-preview-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(74,56,38,0.85) 0%, transparent 55%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 20px;
        }

        .hrc-preview-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 400;
          color: #FFFDF6;
          letter-spacing: 0.1em;
        }

        .hrc-content {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          background: linear-gradient(180deg, #FFFDF8, #F7F1E4);
          scrollbar-width: thin;
          scrollbar-color: #C9974E #F7F1E4;
        }

        .hrc-section-label {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 14px;
        }

        .hrc-section-label span {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #AA9154;
        }

        .hrc-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #EADFC8;
        }

        .hrc-category-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          padding: 0 14px;
        }

        .hrc-category-card {
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

        .hrc-category-image-wrap {
          position: relative;
          aspect-ratio: 1;
          background: #FBF7EC;
        }

        .hrc-category-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.92;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .hrc-category-check {
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

        .hrc-category-label {
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

        .hrc-category-card:hover {
          border-color: #C9974E;
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(180, 140, 70, 0.18);
        }

        .hrc-category-card:hover img {
          opacity: 1;
          transform: scale(1.03);
        }

        .hrc-category-card.expanded {
          border-color: #C9974E;
          box-shadow: 0 8px 20px rgba(201, 151, 78, 0.3);
        }

        .hrc-category-card.expanded .hrc-category-label {
          background: linear-gradient(135deg, #F7ECD8 0%, #F0DEB8 100%);
          color: #5C4A26;
        }

        .hrc-finish-panel {
          padding: 4px 14px 4px;
          animation: hrc-finish-in 0.3s ease;
        }

        @keyframes hrc-finish-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hrc-finish-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          justify-items: center;
        }

        .hrc-finish-swatch {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .hrc-finish-circle {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px solid #E7DFCB;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.15), 0 3px 8px rgba(92,74,38,0.12);
          transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hrc-finish-swatch:hover .hrc-finish-circle {
          transform: translateY(-2px) scale(1.05);
        }

        .hrc-finish-swatch.selected .hrc-finish-circle {
          border-color: #C9974E;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.15), 0 0 0 3px rgba(201,151,78,0.2), 0 6px 14px rgba(201,151,78,0.3);
        }

        .hrc-finish-check {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E7A94C 0%, #C9974E 100%);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(74, 56, 38, 0.35);
          border: 2px solid #FFFDF8;
        }

        .hrc-finish-name {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #8F7A4F;
          transition: color 0.3s ease;
        }

        .hrc-finish-swatch.selected .hrc-finish-name {
          color: #5C4A26;
        }

        .hrc-luxury-btn {
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

        .hrc-btn-glaze {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #F7ECD8 0%, #F0DEB8 100%);
          transform: translateX(-100%);
          transition: transform 0.35s cubic-bezier(0.25, 1, 0.33, 1), background 0.3s ease;
          z-index: 1;
        }

        .hrc-btn-text {
          position: relative;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #8F7A4F;
          z-index: 2;
          transition: color 0.3s ease;
        }

        .hrc-luxury-btn:not(.active):hover {
          border-color: #D6C394;
          transform: translateY(-1px);
        }

        .hrc-luxury-btn:not(.active):hover .hrc-btn-glaze {
          transform: translateX(0);
        }

        .hrc-luxury-btn:not(.active):hover .hrc-btn-text {
          color: #5C4A26;
        }

        .hrc-luxury-btn:active {
          transform: translateY(0) scale(0.98);
        }

        .hrc-luxury-btn.active {
          border-color: #C9974E;
          background: #FFFCF3;
          box-shadow: 0 4px 14px rgba(201, 151, 78, 0.2);
        }

        .hrc-luxury-btn.active .hrc-btn-glaze {
          transform: translateX(0);
          background: linear-gradient(135deg, #F7ECD8 0%, #EFDBAF 100%);
        }

        .hrc-luxury-btn.active .hrc-btn-text {
          color: #5C4A26;
          font-weight: 700;
        }

        .hrc-luxury-btn.clear-btn.active {
          border-color: #C8BEA4;
          background: #FBF9F3;
        }

        .hrc-luxury-btn.clear-btn.active .hrc-btn-glaze {
          background: linear-gradient(135deg, #EDE7D6 0%, #E1D8BE 100%);
        }

        .hrc-luxury-btn.clear-btn.active .hrc-btn-text {
          color: #5C4A26;
        }

        .hrc-apply-btn {
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

        .hrc-apply-btn:hover {
          background: linear-gradient(135deg, #E7A94C 0%, #C9974E 100%);
          border-color: #C9974E;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(184, 142, 47, 0.25);
        }

        .hrc-preview-close {
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

        .hrc-preview-close:hover {
          background: #FFFFFF;
          border-color: #C9974E;
        }

        .hrc-split-hint {
          text-align: center;
          font-size: 9px;
          letter-spacing: 0.15em;
          color: #AA9154;
          text-transform: uppercase;
          margin-top: 10px;
        }
      `}</style>

      <div className="hrc-root">
        <div className="hrc-header">
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div className="hrc-header-title">HANDRAIL CONFIGURATOR</div>
            <div className="text-[11px] text-[#AA9154] tracking-[0.15em] font-light">
              Select a handrail style, finish and height to complete your design.
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
            Premium Finishes
          </div>
        </div>

        <div ref={previewContainerRef} className="hrc-preview">
          {previewUrl && (
            <>
              <img
                src={previewUrl}
                alt={`Handrail ${selectedHandrail}`}
                className="hrc-preview-img"
              />
              <div className="hrc-preview-overlay">
                <div className="hrc-preview-name">
                  EXTERIOR PROFILE OPTION 0{selectedHandrail}
                </div>
                <div style={{ marginTop: "12px" }}>
                  <button className="hrc-apply-btn" onClick={() => {}}>
                    CONFIRM LAYER
                  </button>
                </div>
              </div>
              <button
                className="hrc-preview-close"
                onClick={() => {
                  setPreviewUrl(null);
                  setSelectedHandrail(null);
                }}
              >
                <IoClose size={16} />
              </button>
            </>
          )}
        </div>

        <div className="hrc-content">
          <div className="hrc-section-label">
            <span>SELECT HANDRAIL STYLE</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <RingLoader color="#C9974E" size={45} />
              <p className="mt-5 text-[10px] tracking-[0.3em] text-[#AA9154] font-light">
                COMPILING TEXTURE SWATCHES
              </p>
            </div>
          ) : (
            <>
              <div className="hrc-category-grid">
                {HANDRAIL_CATEGORIES.map((cat, idx) => {
                  const isExpanded = openCategoryIndex === idx;
                  const isAppliedHere = activeCategoryIndex === idx;
                  return (
                    <div
                      key={cat.label}
                      className={`hrc-category-card ${isExpanded ? "expanded" : ""}`}
                      onClick={() => handleCategoryClick(idx)}
                    >
                      <div className="hrc-category-image-wrap">
                        <img
                          src={getLocalHandrailImage(cat.nums[0])}
                          alt={cat.label}
                        />
                        {isAppliedHere && (
                          <div className="hrc-category-check">
                            <IoCheckmark size={12} />
                          </div>
                        )}
                      </div>
                      <div className="hrc-category-label">{cat.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* 1. Click Add/Round/Flat/Oval → this section appears (nothing on model yet) */}
              {selectedStyleKey && (
                <>
                  <div className="hrc-section-label" style={{ marginTop: 12 }}>
                    <span>SPLIT HANDRAIL LAYERS</span>
                  </div>

                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* 2. FRONT → parent gets { style, finish } for FrontHandrails */}
                      <div
                        className={`hrc-luxury-btn ${frontEnabled ? "active" : ""}`}
                        onClick={() => setFrontEnabled(true)}
                      >
                        <div className="hrc-btn-glaze" />
                        <div className="hrc-btn-text">FRONT</div>
                      </div>
                      {/* 4. FRONT OFF → parent gets null */}
                      <div
                        className={`hrc-luxury-btn clear-btn ${!frontEnabled ? "active" : ""}`}
                        onClick={() => setFrontEnabled(false)}
                      >
                        <div className="hrc-btn-glaze" />
                        <div className="hrc-btn-text">FRONT OFF</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4" style={{ marginTop: 10 }}>
                      <div
                        className={`hrc-luxury-btn ${sideEnabled ? "active" : ""}`}
                        onClick={() => setSideEnabled(true)}
                      >
                        <div className="hrc-btn-glaze" />
                        <div className="hrc-btn-text">SIDE</div>
                      </div>
                      <div
                        className={`hrc-luxury-btn clear-btn ${!sideEnabled ? "active" : ""}`}
                        onClick={() => setSideEnabled(false)}
                      >
                        <div className="hrc-btn-glaze" />
                        <div className="hrc-btn-text">SIDE OFF</div>
                      </div>
                    </div>

                    {(frontEnabled || sideEnabled) && (
                      <div className="hrc-split-hint">
                        Applying {splitFinish} · {selectedStyleKey}
                        {frontEnabled && sideEnabled
                          ? " · front + side"
                          : frontEnabled
                            ? " · front"
                            : " · side"}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 3. Golden finish → if Front/Side is on, parent gets updated { style, finish } */}
              {openCategoryIndex !== -1 && openCategoryIndex !== null && (
                <>
                  <div className="hrc-section-label" style={{ marginTop: 18 }}>
                    <span>Select Finish</span>
                  </div>
                  <div className="hrc-finish-panel">
                    <div className="hrc-finish-row">
                      {FINISHES.map((finish, i) => {
                        const num = HANDRAIL_CATEGORIES[openCategoryIndex].nums[i];
                        const isSelected = selectedHandrail === num;
                        return (
                          <div
                            key={finish.name}
                            className={`hrc-finish-swatch ${isSelected ? "selected" : ""}`}
                            onClick={() => handleMainSelect(num)}
                          >
                            <div
                              className="hrc-finish-circle"
                              style={{ background: finish.swatch }}
                            >
                              {isSelected && (
                                <div className="hrc-finish-check">
                                  <IoCheckmark size={11} />
                                </div>
                              )}
                            </div>
                            <div className="hrc-finish-name">{finish.name}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <div className="hrc-section-label" style={{ marginTop: 18 }}>
            <span>SECONDARY PERIMETER GUARD</span>
          </div>
          <div className="px-6 pb-14">
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`hrc-luxury-btn ${subHandrailEnabled ? "active" : ""}`}
                onClick={toggleSubHandrail}
              >
                <div className="hrc-btn-glaze" />
                <div className="hrc-btn-text">BUMPER RAILS</div>
              </div>
              <div
                className={`hrc-luxury-btn clear-btn ${!subHandrailEnabled ? "active" : ""}`}
                onClick={() => {
                  setSubHandrailEnabled(false);
                  applySubHandrail(null);
                }}
              >
                <div className="hrc-btn-glaze" />
                <div className="hrc-btn-text">NONE</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HandrailController;