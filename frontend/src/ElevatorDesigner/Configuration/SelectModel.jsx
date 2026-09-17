import React, { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import { IoClose } from "react-icons/io5";
import gsap from "gsap";

const SelectModel = ({
  setSelectedView,
  setSelectedModelId,
  selectedModel,
  setSelectedModel,
  onResetConfiguration,
}) => {
  const [activeTab, setActiveTab] = useState("ELX");
  const [openingOptions, setOpeningOptions] = useState({
    front: false,
    straight: false,
    back: false,
  });

  const [showWarning, setShowWarning] = useState(false);
  const [pendingModel, setPendingModel] = useState(null);

  const tabRefs = useRef([]);
  const cardRefs = useRef({});


// LevelE-101    ELX-1101
// LevelE-102    ELX-1102
// LevelE-103    ELX-1103
// LevelE-104    ELX-1104
// LevelE-105    ELX-1105
// LevelE-106    ELX-1106
// LevelE-107    ELX-1107
// LevelE-108    ELX-1108
// LevelR-201    RLX-2201
// LevelR-202    RLX-2202
// LevelR-203    RLX-2203
// LevelR-204    RLX-2204
// LevelR-205    RLX-2205
// LevelC-301    CLX-3301
// LevelC-302    CLX-3302

  const skeleton = [
    {
      modelId: "ELX-1101",
      views: [
        { id: "view-1", image: "/SKELETONS/Gaf-001/1 GAF-001 v1.jpg" },
        { id: "view-2", image: "/SKELETONS/Gaf-001/1 GAF-001 v2.jpg" },
        { id: "view-3", image: "/SKELETONS/Gaf-001/1 GAF-001 v3.jpg" },
      ],
    },
    {
      modelId: "ELX-1102",
      views: [
        { id: "view-1", image: "/SKELETONS/Gaf-002/2 GAF-001 v1.jpg" },
        { id: "view-2", image: "/SKELETONS/Gaf-002/2 GAF-001 v2.jpg" },
        { id: "view-3", image: "/SKELETONS/Gaf-002/2 GAF-001 v3.jpg" },
      ],
    },
    {
      modelId: "ELX-1103",
      views: [
        { id: "view-1", image: "/SKELETONS/Gaf-003/3 GAF-001 v1.jpg" },
        { id: "view-2", image: "/SKELETONS/Gaf-003/3 GAF-001 v2.jpg" },
        { id: "view-3", image: "/SKELETONS/Gaf-003/3 GAF-001 v3.jpg" },
      ],
    },
    {
      modelId: "ELX-1104",
      views: [
        { id: "view-1", image: "/SKELETONS/Gaf-004/4 GAF-001 v1.jpg" },
        { id: "view-2", image: "/SKELETONS/Gaf-004/4 GAF-001 v2.jpg" },
        { id: "view-3", image: "/SKELETONS/Gaf-004/4 GAF-001 v3.jpg" },
      ],
    },
    {
      modelId: "ELX-1105",
      views: [
        { id: "view-1", image: "/SKELETONS/Gaf-005/5 GAF-001 v1.jpg" },
        { id: "view-2", image: "/SKELETONS/Gaf-005/5 GAF-001 v2.jpg" },
        { id: "view-3", image: "/SKELETONS/Gaf-005/5 GAF-001 v3.jpg" },
      ],
    },
    {
      modelId: "ELX-1106",
      views: [
        { id: "view-1", image: "/SKELETONS/Gaf-006/6 GAF-001 v1.jpg" },
        { id: "view-2", image: "/SKELETONS/Gaf-006/6 GAF-001 v2.jpg" },
        { id: "view-3", image: "/SKELETONS/Gaf-006/6 GAF-001 v3.jpg" },
      ],
    },
    {
      modelId: "ELX-1107",
      views: [
        { id: "view-1", image: "/SKELETONS/Gaf-007/7 GAF-001 v1.jpg" },
        { id: "view-2", image: "/SKELETONS/Gaf-007/7 GAF-001 v2.jpg" },
        { id: "view-3", image: "/SKELETONS/Gaf-007/7 GAF-001 v3.jpg" },
      ],
    },
    {
      modelId: "ELX-1108",
      views: [
        { id: "view-1", image: "/SKELETONS/Gaf-008/8 GAF-001 v1.jpg" },
        { id: "view-2", image: "/SKELETONS/Gaf-008/8 GAF-001 v2.jpg" },
        { id: "view-3", image: "/SKELETONS/Gaf-008/8 GAF-001 v3.jpg" },
      ],
    },
    {
      modelId: "RLX-2201",
      views: [
        { id: "view-1", image: "/SKELETONS/Gaf-009/9 GAF-001 v1.jpg" },
        { id: "view-2", image: "/SKELETONS/Gaf-009/9 GAF-001 v2.jpg" },
        { id: "view-3", image: "/SKELETONS/Gaf-009/9 GAF-001 v3.jpg" },
      ],
    },
    {
      modelId: "RLX-2202",
      views: [
        { id: "view-1", image: "/SKELETONS/Gaf-010/10 GAF-001 v1.jpg" },
        { id: "view-2", image: "/SKELETONS/Gaf-010/10 GAF-001 v2.jpg" },
        { id: "view-3", image: "/SKELETONS/Gaf-010/10 GAF-001 v3.jpg" },
      ],
    },
    {
      modelId: "RLX-2203",
      views: [
        { id: "view-1", image: "/SKELETONS/Gaf-011/11 GAF-001 v1.jpg" },
        { id: "view-2", image: "/SKELETONS/Gaf-011/11 GAF-001 v2.jpg" },
        { id: "view-3", image: "/SKELETONS/Gaf-011/11 GAF-001 v3.jpg" },
      ],
    },
    {
      modelId: "RLX-2204",
      views: [
        { id: "view-1", image: "/SKELETONS/Gaf-012/12 GAF-001 v1.jpg" },
        { id: "view-2", image: "/SKELETONS/Gaf-012/12 GAF-001 v2.jpg" },
        { id: "view-3", image: "/SKELETONS/Gaf-012/12 GAF-001 v3.jpg" },
      ],
    },
    {
      modelId: "RLX-2205",
      views: [
        { id: "view-1", image: "/SKELETONS/Gaf-013/13 GAF-001 v1.jpg" },
        { id: "view-2", image: "/SKELETONS/Gaf-013/13 GAF-001 v2.jpg" },
        { id: "view-3", image: "/SKELETONS/Gaf-013/13 GAF-001 v3.jpg" },
      ],
    },
    {
      modelId: "CLX-3301",
      views: [
        { id: "view-1", image: "/SKELETONS/Gaf-014/14 GAF-001 v1.jpg" },
        { id: "view-2", image: "/SKELETONS/Gaf-014/14 GAF-001 v2.jpg" },
        { id: "view-3", image: "/SKELETONS/Gaf-014/14 GAF-001 v3.jpg" },
      ],
    },
    {
      modelId: "CLX-3302",
      views: [
        { id: "view-1", image: "/SKELETONS/Gaf-015/15 GAF-001 v1.jpg" },
        { id: "view-2", image: "/SKELETONS/Gaf-015/15 GAF-001 v2.jpg" },
        { id: "view-3", image: "/SKELETONS/Gaf-015/15 GAF-001 v3.jpg" },
      ],
    },
  ];

  const elevatorData = {
    ELX: [
      { id: "ELX-1101", name: "ELX-1101" },
      { id: "ELX-1102", name: "ELX-1102" },
      { id: "ELX-1103", name: "ELX-1103" },
      { id: "ELX-1104", name: "ELX-1104" },
      { id: "ELX-1105", name: "ELX-1105" },
      { id: "ELX-1106", name: "ELX-1106" },
      { id: "ELX-1107", name: "ELX-1107" },
      { id: "ELX-1108", name: "ELX-1108" },
    ],
    RLX: [
      { id: "RLX-2201", name: "RLX-2201" },
      { id: "RLX-2202", name: "RLX-2202" },
      { id: "RLX-2203", name: "RLX-2203" },
      { id: "RLX-2204", name: "RLX-2204" },
      { id: "RLX-2205", name: "RLX-2205" },
    ],
    CLX: [
      { id: "CLX-3301", name: "CLX-3301" },
      { id: "CLX-3302", name: "CLX-3302" },
    ],
  };

  // ── GSAP Tabs Mechanics ──────────────────────────────────────────────────
  useEffect(() => {
    ["ELX", "RLX", "CLX"].forEach((tab, idx) => {
      const el = tabRefs.current[idx];
      if (!el) return;
      if (activeTab === tab) {
        gsap.to(el, { transform: "rotateX(12deg) translateZ(8px)", filter: "brightness(1.1)", duration: 0.3 });
      } else {
        gsap.to(el, { transform: "rotateX(0deg) translateZ(0px)", filter: "brightness(1)", duration: 0.3 });
      }
    });
  }, [activeTab]);

  const handleModelClick = (model) => {
    if (selectedModel?.id === model.id) {
      setSelectedModel(null);
      setOpeningOptions({ front: false, straight: false, back: false });
      if (setSelectedModelId) setSelectedModelId(null);
      return;
    }

    if (!selectedModel) {
      setSelectedModel(model);
      setOpeningOptions({ front: false, straight: false, back: false });
      if (setSelectedModelId) setSelectedModelId(model.id);
      return;
    }

    setPendingModel(model);
    setShowWarning(true);
  };

  const handleCancel = () => {
    setPendingModel(null);
    setShowWarning(false);
  };

  const handleProceed = () => {
    if (onResetConfiguration) onResetConfiguration();
    setSelectedModel(pendingModel);
    setOpeningOptions({ front: false, straight: false, back: false });
    if (setSelectedModelId) setSelectedModelId(pendingModel.id);
    setPendingModel(null);
    setShowWarning(false);
  };

  const handleOpeningOptionClick = (option) => {
    if (option === "front") {
      setOpeningOptions({ front: true, straight: false, back: false });
      setSelectedView(1);
    } else if (option === "straight") {
      setOpeningOptions({ front: false, straight: true, back: false });
      setSelectedView(2);
    } else if (option === "back") {
      setOpeningOptions({ front: false, straight: false, back: true });
      setSelectedView(3);
    }
  };

  const getDefaultImage = (modelId) => {
    const modelData = skeleton.find((s) => s.modelId === modelId);
    return modelData?.views?.find((v) => v.id === "view-1")?.image || "";
  };

  const currentModels = elevatorData[activeTab];

  // ── Mouse-Driven Holographic Tracking Loop ────────────────────────────────
  const handleCardMouseMove = (e, id) => {
    const card = cardRefs.current[id];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(card, {
      rotateY: x * 15,
      rotateX: -y * 15,
      transform: `scaleX(1.02) scaleY(1.02) translateZ(10px)`,
      duration: 0.2,
      ease: "power1.out"
    });
  };

  const handleCardMouseLeave = (id, isSelected) => {
    const card = cardRefs.current[id];
    if (!card) return;
    gsap.to(card, {
      rotateY: 0,
      rotateX: 0,
      transform: isSelected ? "translateZ(8px)" : "translateZ(0px)",
      duration: 0.4,
      ease: "power2.out"
    });
  };

  return (
    <>
     <style>{`
        /* ── Root now locked to viewport height, column layout ── */
        .smc-root {
          font-family: 'Jost', sans-serif;
          color: #5C4A26;
          background: linear-gradient(180deg, #FFFDF6, #F7EFCF);
          height: 73vh;
          max-height: 100vh;
          border: 1px solid #D6C394;
          display: flex;
          flex-direction: column;
          overflow: hidden; /* nothing escapes the box */
        }

        .smc-header {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 24px;
          background: linear-gradient(180deg, #423516 0%, #29200B 100%);
          color: #FFF3CD;
          border-bottom: 2px solid #C9A245;
        }

        .smc-header-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          color: #E6C262;
        }

        /* ── 3D Projection Deck Hierarchy ── */
        .smc-tab-perspective-deck {
          flex: 0 0 auto;
          background: #1F190A;
          padding: 8px 16px 0 16px;
          perspective: 600px;
          border-bottom: 3px solid #29200B;
        }

        .smc-tab-rail {
          display: flex;
          gap: 8px;
          transform-style: preserve-3d;
        }

        .smc-tab-btn {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #423516;
          border-bottom: none;
          background: #29200B;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #AA9154;
          cursor: pointer;
          text-align: center;
          text-transform: uppercase;
          transform-origin: bottom center;
          transition: color 0.3s, background 0.3s;
        }

        .smc-tab-btn:hover {
          color: #FFF2CC;
          background: #382C0E;
        }

        .smc-tab-btn.active {
          background: linear-gradient(to top, #3D3012, #1F190A);
          color: #E6C262;
          border-color: #C9A245;
          box-shadow: 0 -4px 12px rgba(230, 194, 98, 0.2);
        }

        /* ── Core Skeuomorphic Interactive Grid ── */
        /* This is now the ONLY scrollable region, and its scrollbar is hidden */
        .smc-grid-wrapper {
          perspective: 1200px;
          padding: 16px;
          background: linear-gradient(180deg, #FFFDF6, #F7EFCF);
          flex: 1 1 auto;
          min-height: 0; /* required for flex children to actually scroll instead of overflowing */
          overflow-y: auto;
          scrollbar-width: thin;      /* Firefox */
          -ms-overflow-style: none;   /* IE/Edge */
          scrollbar-width: thin;
          scrollbar-color: #D4AF37 #F7EFCF;  
        }
        .smc-grid-wrapper::-webkit-scrollbar {
          display: none;              /* Chrome/Safari */
        }

        .smc-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          transform-style: preserve-3d;
        }

        /* 3D Core Block Frame */
        .smc-cube-card-container {
          perspective: 800px;
          min-height: 160px;
        }

        .smc-model-card {
          position: relative;
          width: 100%;
          height: 100%;
          background: #FFFBF0;
          border: 1px solid #D6C394;
          cursor: pointer;
          transform-style: preserve-3d;
          box-shadow: 0 4px 10px rgba(184, 142, 47, 0.05);
          transition: border-color 0.3s, box-shadow 0.3s;
        }

        .smc-model-card:hover {
          border-color: #B88E2F;
        }

        .smc-model-card.selected {
          border-color: #D4AF37;
          box-shadow: 0 8px 24px rgba(212, 175, 55, 0.25);
          background: #FFF9E6;
        }

        /* Solid Extrusion Base Lip */
        .smc-model-card::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 0;
          width: 100%;
          height: 5px;
          background: #B88E2F;
          transform: rotateX(-90deg);
          transform-origin: bottom;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .smc-model-card.selected::after {
          opacity: 1;
        }

        .smc-model-name {
          text-align: left;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #3D3012;
          border-bottom: 1px solid #E8D8A7;
          text-transform: uppercase;
        }

        .smc-image-container {
          padding: 2px 0px;
          background: #FFFFFF;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 210px; /* was 150px — shrunk so more cards fit without scrolling */
        }

        .smc-image-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transition: transform 0.4s;
          filter: sepia(0.1) saturate(1.05);
        }
        .smc-model-card:hover .smc-image-container img {
          transform: translateZ(15px) scale(1.03);
        }

        /* ── Opening Control Matrix ── */
        .smc-opening-panel {
          background: linear-gradient(180deg, #3D3012 0%, #1F190A 100%);
          border: 1px solid #C9A245;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 30px rgba(41, 32, 11, 0.25);
          color: #FFF2CC;
        }

        .smc-opening-header {
          padding: 12px 16px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          background: #1F190A;
          color: #E6C262;
          border-bottom: 1px solid #423516;
          text-transform: uppercase;
        }

        .smc-option {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          border-bottom: 1px solid #423516;
          cursor: pointer;
          transition: background 0.2s;
        }
        .smc-option:last-child {
          border-bottom: none;
        }
        .smc-option:hover {
          background: #423516;
        }

        /* Tactile Mechanical Checkbox Button */
        .smc-checkbox-3d {
          position: relative;
          width: 20px;
          height: 20px;
          background: #1F190A;
          border: 1px solid #5C4A26;
          margin-right: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.4);
          transition: all 0.3s;
        }

        .smc-checkbox-3d.active {
          background: radial-gradient(circle at 35% 35%, #FFFFFF 0%, #FFF2CC 20%, #E6C262 60%, #B88E2F 100%);
          border-color: #FFF9E6;
          box-shadow: 0 0 10px #E6C262, inset 0 1px 1px rgba(255,255,255,0.5);
        }

        /* ── Informational footer: fixed-height, no longer stacked below a tall grid ── */
        .smc-footer {
          flex: 0 0 auto;
          padding: 12px 24px;
          border-top: 1px solid #E8D8A7;
          background: #FFFFFF;
        }

        /* ── Warning Architecture Modal ── */
        .smc-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(41, 32, 11, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .smc-modal-box {
          background: #FFFBF0;
          width: 100%;
          max-width: 440px;
          border: 1px solid #C9A245;
          box-shadow: 0 20px 50px rgba(41, 32, 11, 0.3);
          overflow: hidden;
        }

        .smc-modal-btn {
          flex: 1;
          padding: 16px;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          border: none;
          background: #FAEDC8;
          color: #7A6535;
          cursor: pointer;
          transition: all 0.2s;
        }
        .smc-modal-btn:hover {
          background: #E6DCBA;
          color: #3D3012;
        }
        .smc-modal-btn.proceed {
          color: #B88E2F;
          border-left: 1px solid #D6C394;
          font-weight: 700;
        }
        .smc-modal-btn.proceed:hover {
          background: linear-gradient(135deg, #E6C262 0%, #B88E2F 100%);
          color: #FFFFFF;
        }
      `}</style>

      <div className="smc-root">
        {/* Header Block */}
        <div className="smc-header">
          <div className="smc-header-title">ELEVATOR CONFIGURATIONS</div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-[#dfb76c]">
            STAGE 01
          </div>
        </div>

        {/* 3D Angled Tab Navigation */}
        <div className="smc-tab-perspective-deck">
          <div className="smc-tab-rail">
            {["ELX", "RLX", "CLX"].map((tab, idx) => (
              <button
                key={tab}
                ref={(el) => (tabRefs.current[idx] = el)}
                onClick={() => setActiveTab(tab)}
                className={`smc-tab-btn ${activeTab === tab ? "active" : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Holographic Matrix Grid — the only scrollable area, scrollbar hidden */}
        <div className="smc-grid-wrapper">
          <div className="smc-grid">
            {currentModels.map((model) => {
              const isSelected = selectedModel?.id === model.id;

              return (
                <div key={model.id} className="smc-cube-card-container">
                  {isSelected ? (
                    <div className="smc-opening-panel">
                      <div className="smc-opening-header">
                        {model.name} — OPTIONS
                      </div>
                      <div className="flex flex-col flex-1 justify-center">
                        {["front", "straight", "back"].map((option) => (
                          <div
                            key={option}
                            onClick={() => handleOpeningOptionClick(option)}
                            className="smc-option"
                          >
                            <div className={`smc-checkbox-3d ${openingOptions[option] ? "active" : ""}`}>
                              {openingOptions[option] && <Check className="w-3 h-3 text-[#1c1615] stroke-[4]" />}
                            </div>
                            <span className="text-xs font-bold tracking-wider uppercase text-gray-300">
                              {option} Opening
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div
                      ref={(el) => (cardRefs.current[model.id] = el)}
                      onClick={() => handleModelClick(model)}
                      onMouseMove={(e) => handleCardMouseMove(e, model.id)}
                      onMouseLeave={() => handleCardMouseLeave(model.id, isSelected)}
                      className={`smc-model-card ${isSelected ? "selected" : ""}`}
                    >
                      <div className="smc-model-name">{model.name}</div>
                      <div className="smc-image-container">
                        <img src={getDefaultImage(model.id)} alt={model.name} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Informational Lower Plate — fixed height, always visible, not part of scroll area */}
        <div className="smc-footer">
          <h3 className="text-xs font-bold tracking-widest text-gray-800 mb-1 uppercase">
            System Specifications
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed font-normal">
            ELX pairs structural aluminum-framed modules with high-precision internal interlocking alignment matrices. Material loads do not transfer between configuration switches.
          </p>
        </div>
      </div>

      {/* Verification overlay architecture */}
      {showWarning && (
        <div className="smc-modal-overlay">
          <div className="smc-modal-box">
            <div className="bg-[#1c1615] px-6 py-4 flex justify-between items-center border-bottom border-[#dfb76c]">
              <h2 className="text-[#dfb76c] font-bold tracking-widest text-xs uppercase">Configuration Alert</h2>
              <IoClose 
                onClick={handleCancel}
                className="text-gray-400 hover:text-white cursor-pointer text-xl transition-colors"
              />
            </div>

            <div className="p-6 space-y-4 text-xs text-gray-600 leading-relaxed">
              <p>
                Switching blueprints will drop current material arrays from your session canvas. Selections are bounded to this structure profile.
              </p>
              <p className="font-bold text-gray-800">
                Confirm processing structural reset sequence?
              </p>
            </div>

            <div className="flex border-t border-gray-100">
              <button onClick={handleCancel} className="smc-modal-btn">
                ABORT
              </button>
              <button onClick={handleProceed} className="smc-modal-btn proceed">
                PROCEED RESET
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SelectModel;