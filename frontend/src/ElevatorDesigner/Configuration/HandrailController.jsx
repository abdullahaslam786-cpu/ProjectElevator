import React, { useEffect, useState, useRef } from "react";
import { IoClose, IoCheckmark } from "react-icons/io5";
import { RingLoader } from "react-spinners";
import gsap from "gsap";

const getLocalHandrailImage = (num) => `/previewHandrails/${num}.png`;

const HANDRAIL_CATEGORIES = [
  { label: "Round", nums: [1, 2, 3] },
  { label: "Flat", nums: [13, 14, 15] },
  { label: "Oval", nums: [7, 8, 9] },
];

const FINISHES = [
  { name: "Silver", classKey: "silver-shine" },
  { name: "Gold", classKey: "gold-shine" },
  { name: "Black", classKey: "black-shine" },
];

const HandrailController = ({
  applyHandrail,
  applySubHandrail,
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
  const [frontFinish, setFrontFinish] = useState("silver");
  const [sideFinish, setSideFinish] = useState("silver");

  const [activeLayer, setActiveLayer] = useState(null);

  const previewContainerRef = useRef(null);

  useEffect(() => {
    const warm = async () => {
      try {
        setLoading(true);
        await fetch("/api/images-by-prefix?prefix=previewHandrails").catch(
          () => null
        );
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

  const handleMainSelect = (num) => {
    setSelectedHandrail(num);
    setPreviewUrl(getLocalHandrailImage(num));
  };

  const handleFrontFinishSelect = (num, finishName) => {
    setSelectedHandrail(num);
    setPreviewUrl(getLocalHandrailImage(num));
    setFrontFinish(finishName.toLowerCase());
    setFrontEnabled(true);
  };

  const handleSideFinishSelect = (num, finishName) => {
    setSelectedHandrail(num);
    setPreviewUrl(getLocalHandrailImage(num));
    setSideFinish(finishName.toLowerCase());
    setSideEnabled(true);
  };

  const handleCategoryClick = (idx) => {
    const isOpeningNew = selectedCategory !== idx;
    setSelectedCategory((prev) => (prev === idx ? null : idx));

    if (isOpeningNew) {
      const firstNum = HANDRAIL_CATEGORIES[idx].nums[0];
      handleMainSelect(firstNum);
      setFrontFinish("silver");
      setSideFinish("silver");
      setFrontEnabled(false);
      setSideEnabled(false);
    }
  };

  const activeCategoryIndex = selectedHandrail
    ? HANDRAIL_CATEGORIES.findIndex((cat) =>
        cat.nums.includes(selectedHandrail)
      )
    : -1;

  const openCategoryIndex =
    selectedCategory !== null ? selectedCategory : activeCategoryIndex;

  const selectedStyleKey =
    openCategoryIndex !== -1 && openCategoryIndex !== null
      ? HANDRAIL_CATEGORIES[openCategoryIndex].label.toLowerCase()
      : null;

  useEffect(() => {
    if (!applyFrontHandrail) return;

    if (!frontEnabled || !selectedStyleKey) {
      applyFrontHandrail(null);
      return;
    }

    applyFrontHandrail({ style: selectedStyleKey, finish: frontFinish });
  }, [frontEnabled, selectedStyleKey, frontFinish, applyFrontHandrail]);

  useEffect(() => {
    if (!applySideHandrail) return;

    if (!sideEnabled || !selectedStyleKey) {
      applySideHandrail(null);
      return;
    }

    applySideHandrail({ style: selectedStyleKey, finish: sideFinish });
  }, [sideEnabled, selectedStyleKey, sideFinish, applySideHandrail]);

  const toggleSubHandrail = () => {
    const next = !subHandrailEnabled;
    setSubHandrailEnabled(next);
    applySubHandrail(next ? "subhandrail" : null);
  };

  const handleLayerTab = (layer) => {
    setActiveLayer((prev) => (prev === layer ? null : layer));
  };

  const renderFinishRow = (currentFinish, layerEnabled, onSelect, onOff) => {
    if (openCategoryIndex === -1 || openCategoryIndex === null) return null;

    return (
      <div className="hrc-finish-panel">
        <div className="hrc-finish-row has-off">
          {FINISHES.map((finish, i) => {
            const num = HANDRAIL_CATEGORIES[openCategoryIndex].nums[i];
            const isSelected =
              layerEnabled && currentFinish === finish.name.toLowerCase();

            return (
              <div
                key={finish.name}
                className={`hrc-finish-swatch ${isSelected ? "selected" : ""}`}
                onClick={() => onSelect(num, finish.name)}
              >
                {/* Shining Metallic Radial Button */}
                <div className={`hrc-shine-button ${finish.classKey}`}>
                  <div className="hrc-shine-text">{finish.name}</div>
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

          {/* Off Button */}
          <div
            className={`hrc-finish-swatch ${!layerEnabled ? "selected" : ""}`}
            onClick={onOff}
          >
            <div className="hrc-finish-circle off">
              <IoClose size={20} />
              {!layerEnabled && (
                <div className="hrc-finish-check">
                  <IoCheckmark size={11} />
                </div>
              )}
            </div>
            <div className="hrc-finish-name">Off</div>
          </div>
        </div>
      </div>
    );
  };

  const renderStatus = (on) => (
    <div className={`hrc-tab-status ${on ? "on" : ""}`}>
      <span className="hrc-tab-dot" />
      {on ? "ON" : "OFF"}
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght=300;400;500&family=Jost:wght=200;300;400;500;600;700&display=swap');

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
          width: 86%;
          margin: 0 auto;
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
          padding: 5px 4px;
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

        .hrc-finish-row.has-off {
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .hrc-finish-swatch {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        /* ───────── High-Shine Metallic Conical Buttons ───────── */
        .hrc-shine-button {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
          transition: transform 0.2s cubic-bezier(0.25, 1, 0.33, 1), box-shadow 0.2s ease;
        }

        .hrc-shine-text {
          font-family: 'Jost', sans-serif;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          z-index: 2;
          pointer-events: none;
        }

        .hrc-finish-swatch:hover .hrc-shine-button {
          transform: translateY(-2px) scale(1.05);
        }

        .hrc-finish-swatch.selected .hrc-shine-button {
          transform: scale(1.05);
        }

        /* SILVER SHINE */
        .hrc-shine-button.silver-shine {
          background: conic-gradient(
            from 180deg at 50% 50%,
            #e6ecef 0deg,
            #7d8b94 45deg,
            #ffffff 90deg,
            #8c9aa3 135deg,
            #e6ecef 180deg,
            #7d8b94 225deg,
            #ffffff 270deg,
            #8c9aa3 315deg,
            #e6ecef 360deg
          );
          border: 2px solid #b3bec4;
          box-shadow: 
            0 8px 16px rgba(0, 0, 0, 0.35),
            inset 0 2px 3px rgba(255, 255, 255, 0.8),
            inset 0 -2px 4px rgba(0, 0, 0, 0.4);
        }

        .hrc-shine-button.silver-shine .hrc-shine-text {
          color: #1a2730;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .hrc-finish-swatch.selected .hrc-shine-button.silver-shine {
          box-shadow: 
            0 0 0 3px #C9974E,
            0 10px 20px rgba(0, 0, 0, 0.4),
            inset 0 2px 3px rgba(255, 255, 255, 0.8);
        }

        /* GOLD SHINE */
        .hrc-shine-button.gold-shine {
          background: conic-gradient(
            from 180deg at 50% 50%,
            #f9e380 0deg,
            #9e7016 45deg,
            #fffcd6 90deg,
            #b2801b 135deg,
            #f9e380 180deg,
            #9e7016 225deg,
            #fffcd6 270deg,
            #b2801b 315deg,
            #f9e380 360deg
          );
          border: 2px solid #d4a73b;
          box-shadow: 
            0 8px 16px rgba(0, 0, 0, 0.35),
            inset 0 2px 3px rgba(255, 255, 220, 0.9),
            inset 0 -2px 4px rgba(0, 0, 0, 0.4);
        }

        .hrc-shine-button.gold-shine .hrc-shine-text {
          color: #3d2700;
          text-shadow: 0 1px 0 rgba(255, 248, 204, 0.8);
        }

        .hrc-finish-swatch.selected .hrc-shine-button.gold-shine {
          box-shadow: 
            0 0 0 3px #C9974E,
            0 10px 20px rgba(0, 0, 0, 0.4),
            inset 0 2px 3px rgba(255, 255, 220, 0.9);
        }

        /* BLACK SHINE */
        .hrc-shine-button.black-shine {
          background: conic-gradient(
            from 180deg at 50% 50%,
            #3a3f47 0deg,
            #0f1115 45deg,
            #6c7685 90deg,
            #15181e 135deg,
            #3a3f47 180deg,
            #0f1115 225deg,
            #6c7685 270deg,
            #15181e 315deg,
            #3a3f47 360deg
          );
          border: 2px solid #484f59;
          box-shadow: 
            0 8px 16px rgba(0, 0, 0, 0.45),
            inset 0 2px 3px rgba(255, 255, 255, 0.3),
            inset 0 -2px 4px rgba(0, 0, 0, 0.7);
        }

        .hrc-shine-button.black-shine .hrc-shine-text {
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
        }

        .hrc-finish-swatch.selected .hrc-shine-button.black-shine {
          box-shadow: 
            0 0 0 3px #C9974E,
            0 10px 20px rgba(0, 0, 0, 0.5),
            inset 0 2px 3px rgba(255, 255, 255, 0.4);
        }

        .hrc-finish-circle.off {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px solid #E7DFCB;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.15), 0 4px 10px rgba(92,74,38,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FFFDF6;
          color: #AA9154;
          transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hrc-finish-swatch.selected .hrc-finish-circle.off {
          background: linear-gradient(135deg, #F7ECD8 0%, #F0DEB8 100%);
          color: #5C4A26;
          border-color: #C9974E;
        }

        .hrc-finish-check {
          position: absolute;
          bottom: -2px;
          right: -2px;
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
          z-index: 5;
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

        .hrc-tab-row {
          display: flex;
          align-items: stretch;
          justify-content: center;
          flex-wrap: nowrap;
          gap: 8px;
          padding: 4px 14px 0;
        }

        .hrc-luxury-btn.hrc-tab {
          flex: 1 1 0;
          min-width: 0;
          height: auto;
          min-height: 46px;
          padding: 5px 6px;
        }

        .hrc-tab-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          text-align: center;
        }

        .hrc-tab .hrc-btn-text {
          font-size: 9px;
          letter-spacing: 0.1em;
          line-height: 1.25;
        }

        .hrc-tab-status {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.2em;
          color: #B9AD8C;
          transition: color 0.3s ease;
        }

        .hrc-tab-status.on {
          color: #B27B1F;
        }

        .hrc-tab-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #DDD3B8;
          transition: background 0.3s ease, box-shadow 0.3s ease;
        }

        .hrc-tab-status.on .hrc-tab-dot {
          background: #C9974E;
          box-shadow: 0 0 0 3px rgba(201, 151, 78, 0.22);
        }

        @media (max-width: 420px) {
          .hrc-tab-row { gap: 6px; padding: 4px 10px 0; }
          .hrc-tab .hrc-btn-text { font-size: 8px; letter-spacing: 0.05em; }
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
          margin-bottom: 4px;
        }

        .hrc-layer-block {
          margin-bottom: 8px;
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
            <div className="hrc-category-grid">
              {HANDRAIL_CATEGORIES.map((cat, idx) => {
                const isExpanded = openCategoryIndex === idx;
                const isAppliedHere = activeCategoryIndex === idx;
                return (
                  <div
                    key={cat.label}
                    className={`hrc-category-card ${
                      isExpanded ? "expanded" : ""
                    }`}
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
          )}

          <div className="hrc-section-label" style={{ marginTop: 14 }}>
            <span>HANDRAIL OPTIONS</span>
          </div>

          <div className="hrc-tab-row flex items-center justify-center">
            <div
              role="button"
              tabIndex={0}
              aria-pressed={activeLayer === "front"}
              className={`hrc-luxury-btn hrc-tab ${
                activeLayer === "front" ? "active" : ""
              }`}
              onClick={() => handleLayerTab("front")}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && handleLayerTab("front")
              }
            >
              <div className="hrc-btn-glaze" />
              <div className="hrc-tab-content">
                <div className="hrc-btn-text">Front Handrail</div>
                {renderStatus(frontEnabled)}
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-pressed={activeLayer === "side"}
              className={`hrc-luxury-btn hrc-tab ${
                activeLayer === "side" ? "active" : ""
              }`}
              onClick={() => handleLayerTab("side")}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && handleLayerTab("side")
              }
            >
              <div className="hrc-btn-glaze" />
              <div className="hrc-tab-content">
                <div className="hrc-btn-text">Side Handrail</div>
                {renderStatus(sideEnabled)}
              </div>
            </div>

            <div
              role="switch"
              tabIndex={0}
              aria-checked={subHandrailEnabled}
              className={`hrc-luxury-btn hrc-tab ${
                subHandrailEnabled ? "active" : ""
              }`}
              onClick={toggleSubHandrail}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && toggleSubHandrail()
              }
            >
              <div className="hrc-btn-glaze" />
              <div className="hrc-tab-content">
                <div className="hrc-btn-text">Secondary Perimeter Guard</div>
                {renderStatus(subHandrailEnabled)}
              </div>
            </div>
          </div>

          {activeLayer && !selectedStyleKey && (
            <div className="hrc-split-hint">
              Select a handrail style above to choose a finish
            </div>
          )}

          {activeLayer === "front" && selectedStyleKey && (
            <div className="px-6 hrc-layer-block">
              <div className="hrc-split-hint">
                Front · {frontEnabled ? frontFinish : "off"} · {selectedStyleKey}
              </div>
              {renderFinishRow(
                frontFinish,
                frontEnabled,
                handleFrontFinishSelect,
                () => setFrontEnabled(false)
              )}
            </div>
          )}

          {activeLayer === "side" && selectedStyleKey && (
            <div className="px-6 hrc-layer-block">
              <div className="hrc-split-hint">
                Side · {sideEnabled ? sideFinish : "off"} · {selectedStyleKey}
              </div>
              {renderFinishRow(
                sideFinish,
                sideEnabled,
                handleSideFinishSelect,
                () => setSideEnabled(false)
              )}
            </div>
          )}

          <div className="pb-14" />
        </div>
      </div>
    </>
  );
};

export default HandrailController;