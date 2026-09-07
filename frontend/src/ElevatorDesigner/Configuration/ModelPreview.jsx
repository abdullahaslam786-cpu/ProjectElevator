import React, { forwardRef, useState, useEffect, useRef } from "react";
import { RingLoader } from "react-spinners";
import gsap from "gsap";
import { modelConfigs } from "../config/modelConfigs";

const ModelPreview = forwardRef((props, ref) => {
  const {
    selectedView,
    activeStep,
    highlightedPanels = [],
    activeZone,
    appliedMaterials = {},
    presignedCache = {},
    setPresignedCache,
    className = "",
    showThumbnails,
    setSelectedView,
    appliedHandrail,
    appliedCeiling,
    appliedFloor,
    appliedLight,
    appliedSubHandrail,
    selectedModelId,
    isDesignLoading = false,
    appliedDoor,
    setAppliedDoor,
  } = props;

  const [isViewLoading, setIsViewLoading] = useState(false);
  const stageRef = useRef(null);
  const wrapperRef = useRef(null);

  const config = modelConfigs[selectedModelId];
  const activeLayers = config?.skeletonViews?.[selectedView] || [];
  const shouldShowPanelIndicators = !showThumbnails && activeStep === "Wall Panels";

  // ── GSAP Dynamic 3D Horizontal & Depth Tracking (X-Axis + Z-Axis) ──
  useEffect(() => {
    if (shouldShowPanelIndicators && wrapperRef.current) {
      const activeNode = wrapperRef.current.querySelector(".spatial-node.node-active");
      const neutralNodes = wrapperRef.current.querySelectorAll(".spatial-node:not(.node-active)");

      if (activeNode) {
        // 1. Alter global workspace canvas focus across X-axis perspective coordinates
        gsap.to(wrapperRef.current, {
          "--pov-x": "-8%",
          duration: 0.65,
          ease: "power2.out"
        });

        // 2. Extrude Active Indicator cleanly on Z-Axis (Depth) and slide horizontally on X-Axis
        gsap.to(activeNode, {
          transform: "translate(-50%, -50%) translateZ(15px)  rotateY(-15deg)",
          duration: 0.55,
          ease: "power3.out",
          overwrite: "auto"
        });
      } else {
        // Reset container viewing coordinate to baseline balance
        gsap.to(wrapperRef.current, {
          "--pov-x": "-20%",
          duration: 0.55,
          ease: "power2.out"
        });
      }

      // 3. Keep inactive buttons resting perfectly at baseline flat coordinates
      if (neutralNodes.length > 0) {
        gsap.to(neutralNodes, {
          transform: "translate(-50%, -50%) translateZ(0px) translateX(0px) rotateY(0deg)",
          duration: 0.45,
          ease: "power2.out",
          overwrite: "auto"
        });
      }
    }
  }, [highlightedPanels, activeZone, shouldShowPanelIndicators, selectedView]);

  // ── Pre-fetch wall panel material layers ──────────────────────────────
  useEffect(() => {
    if (!config || !appliedMaterials) return;

    Object.entries(appliedMaterials).forEach(([zone, panels]) => {
      Object.entries(panels).forEach(([panelNum, applied]) => {
        if (!applied?.keyPrefix) return;

        [1, 2, 3].forEach((view) => {
          const fileName = applied.keyPrefix.includes("Reveals") ? `${view}.png` : `${panelNum}.png`;
          const key = `${applied.keyPrefix}/V${view}/${fileName}`;
          if (presignedCache[key]) return;

          fetch(`/api/presign-single?key=${encodeURIComponent(key)}`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => {
              if (data.url) setPresignedCache((prev) => ({ ...prev, [key]: data.url }));
            })
            .catch(() => {});
        });
      });
    });
  }, [appliedMaterials]);

  // ── Pre-fetch ALL overlay types upfront ───────────────────────────────
  useEffect(() => {
    const overlaysToFetch = [];
    if (appliedHandrail) [1, 2, 3].forEach((v) => { const key = `SubMaterial/handrails/V${v}/${appliedHandrail}.png`; if (!presignedCache[key]) overlaysToFetch.push(key); });
    if (appliedCeiling) [1, 2, 3].forEach((v) => { const key = `SubMaterial/ceiling/V${v}/${appliedCeiling}.png`; if (!presignedCache[key]) overlaysToFetch.push(key); });
    if (appliedFloor) [1, 2, 3].forEach((v) => { const key = `SubMaterial/floor/V${v}/${appliedFloor}.png`; if (!presignedCache[key]) overlaysToFetch.push(key); });
    if (appliedLight) [1, 2, 3].forEach((v) => { const key = `SubMaterial/lights/V${v}/${appliedLight}.png`; if (!presignedCache[key]) overlaysToFetch.push(key); });
    if (appliedSubHandrail) [1, 2, 3].forEach((v) => { const key = `SubMaterial/subhandrail/V${v}/${v}.png`; if (!presignedCache[key]) overlaysToFetch.push(key); });
    if (appliedDoor) { const key = `SubMaterial/doors/${appliedDoor}.png`; if (!presignedCache[key]) overlaysToFetch.push(key); }

    overlaysToFetch.forEach((key) => {
      fetch(`/api/presign-single?key=${encodeURIComponent(key)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => { if (data.url) setPresignedCache((prev) => ({ ...prev, [key]: data.url })); })
        .catch(() => {});
    });
  }, [appliedHandrail, appliedCeiling, appliedFloor, appliedLight, appliedSubHandrail, appliedDoor]);

  // ── Render a single skeleton layer ──
  const renderLayer = (layer) => {
    let src = layer.img;
    const layerMap = config.layerToPanelByView?.[selectedView];
    const panelInfo = layerMap?.[layer.id];

    if (panelInfo) {
      const { zone, panelNum } = panelInfo;
      const applied = appliedMaterials[zone]?.[panelNum];

      if (applied?.keyPrefix) {
        let fileName = `${layer.id}.png`;
        if (applied.keyPrefix.includes("blackLayers") || applied.keyPrefix.includes("goldenLayers")) fileName = `${panelNum}.png`;
        if (applied.keyPrefix.includes("Reveals")) fileName = `${selectedView}.png`;

        const materialKey = `${applied.keyPrefix}/V${selectedView}/${fileName}`;
        if (presignedCache[materialKey]) {
          src = presignedCache[materialKey];
        } else {
          fetch(`/api/presign-single?key=${encodeURIComponent(materialKey)}`)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => { if (data.url) setPresignedCache((prev) => ({ ...prev, [materialKey]: data.url })); })
            .catch(() => {});
        }
      }
    }

    return (
      <React.Fragment key={layer.id}>
        <img
          src={src}
          alt={`layer ${layer.id}`}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          onError={(e) => { e.target.src = layer.img; }}
        />

        {shouldShowPanelIndicators &&
          Object.entries(config.panelMap).map(([zone, panels]) => {
            const panel = panels.find((p) => p.layerId === layer.id);
            if (!panel) return null;

            const isSelected = activeZone === zone && highlightedPanels.includes(panel.panelNum);

            return (
              <div
                key={`${zone}-${panel.panelNum}`}
                className={`spatial-node absolute flex items-center justify-center text-[10px] font-bold z-30 pointer-events-auto transition-colors duration-300 ${
                  isSelected ? "node-active text-[#000]" : "text-[#c9a96e]"
                }`}
                style={{
                  top: panel.top,
                  left: panel.left,
                }}
              >
                {/* Sideways revolving structural node box */}
                <div className="node-3d-box">
                  <div className="node-face face-front">
                    {isSelected ? panel.panelNum : zone}
                  </div>
                  <div className="node-face face-right">
                    {panel.panelNum}
                  </div>
                </div>
              </div>
            );
          })}
      </React.Fragment>
    );
  };

  const renderOverlay = (appliedValue, folder, zIndex = 20) => {
    if (!appliedValue) return null;
    const key = `SubMaterial/${folder}/V${selectedView}/${appliedValue}.png`;
    const src = presignedCache[key];
    if (!src) return null;

    return (
      <img key={`${folder}-${selectedView}`} src={src} alt={folder} className="absolute inset-0 w-full h-full object-contain pointer-events-none" style={{ zIndex }} />
    );
  };

  const renderSubHandrailOverlay = () => {
    if (!appliedSubHandrail) return null;
    const key = `SubMaterial/subhandrail/V${selectedView}/${selectedView}.png`;
    const src = presignedCache[key];
    if (!src) return null;
    return <img src={src} alt="Sub Handrail" className="absolute inset-0 w-full h-full object-contain pointer-events-none z-[35]" />;
  };

  const renderDoorOverlay = () => {
    if (!appliedDoor || selectedView !== 3) return null;
    const doorKey = `SubMaterial/doors/${appliedDoor}.png`;
    const src = presignedCache[doorKey];
    if (!src) return null;
    return <img src={src} alt={`Door ${appliedDoor}`} className="absolute inset-0 w-full h-full object-contain pointer-events-none z-[40]" />;
  };

  return (
    <>
  <style>{`
        /* Dynamic Matrix Custom Variables — No Skewing permitted */
        .premium-view-wrapper {
          --pov-x: -20%;
          perspective: 600px;
          perspective-origin-x: var(--pov-x);
          perspective-origin-y: 90%;
          transition: perspective-origin-x 0.15s ease-out;
          background: linear-gradient(180deg, #FFFDF6, #F7EFCF); /* Soft Cream to Light Golden Veil */
        }

        .mp-root {
          font-family: 'Jost', sans-serif;
          color: #5C4A26; /* Rich Deep Bronze-Gold text */
        }

        /* ── Sideways Structural 3D Interface Elements ── */
        .spatial-node {
          perspective: 500px;
          width: 24px;
          height: 24px;
          transform-style: preserve-3d;
        }

        .node-3d-box {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transform-origin: center center -12px;
          transition: transform 0.5s cubic-bezier(0.25, 1, 0.33, 1);
        }

        .node-face {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          backface-visibility: hidden;
          box-shadow: 0 4px 12px rgba(92, 74, 38, 0.12); /* Balanced Light Golden-Bronze Cast Shadow */
        }

        .node-face.face-front {
          background: #FFFBF0; /* Pure Alabaster Gold Base */
          border: 1.5px solid #D6C394; /* Soft Brushed Gold Frame */
          transform: translateZ(0px);
        }

        .node-face.face-right {
          background: linear-gradient(135deg, #E6C262 0%, #B88E2F 100%); /* Radiant Metallic Satin Gold */
          color: #241A03; /* High Contrast Deep Bronze Typography */
          border: 1.5px solid #FFF2CC; /* Incandescent Inner Lip Highlight */
          font-weight: 700;
          transform: rotateY(90deg) translateZ(12px) translateX(12px);
        }

        /* Selected State Structural Lift */
        .node-active .node-3d-box {
          transform: rotateY(-90deg);
        }

        /* Hover side twist animation for desktop users */
        .spatial-node:hover .node-3d-box {
          box-shadow: 0 12px 24px rgba(184, 142, 47, 0.25); /* Shimmering Outer Ambient Shadow */
        }

        /* Sidebar viewport thumbnail structure frames */
        .premium-view-card {
          perspective: 600px;
          background: #FFFBF0;
          border: 1px solid #E8D8A7;
          border-radius: 4px;
          transition: border-color 0.3s;
        }

        .premium-view-card:hover {
          border-color: #B88E2F;
        }

        .premium-view-card.selected {
          border-color: #D4AF37;
          background: #FFF9E6; /* Cream Highlight Surface */
          box-shadow: 0 8px 20px rgba(184, 142, 47, 0.15);
        }

        .premium-view-cube {
          transform-style: preserve-3d;
          transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
        }

        .premium-view-card:hover .premium-view-cube {
          transform: rotateY(-8deg) translateZ(5px);
        }

        .premium-view-card.selected .premium-view-cube {
          transform: translateZ(12px);
        }
      `}</style>

      <div ref={wrapperRef} className={`premium-view-wrapper mp-root flex flex-col md:flex-row w-full h-full ${className} relative bg-[#111]`}>
        
        {/* Thumbnail Sidebar Selection Frame */}
        {showThumbnails && (
          <div className="mp-thumbnail-sidebar flex flex-col gap-6 w-full md:w-[38%] p-8 overflow-y-auto bg-[#0a0a0a] border-r border-[#241f13]">
            <div>
              <div className="uppercase tracking-[0.3em] text-[10px] text-[#8a8680] mb-1">
                Structural Angles
              </div>
              <h2 className="text-xl font-light text-white tracking-wide font-serif">Select Viewport</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((view) => (
                <div
                  key={view}
                  onClick={() => setSelectedView?.(view)}
                  className={`premium-view-card cursor-pointer group ${selectedView === view ? "selected" : ""}`}
                >
                  <div className={`premium-view-cube relative rounded overflow-hidden border transition-all duration-500 bg-[#141414] ${
                    selectedView === view ? "border-[#d4a843]" : "border-[#241f13] hover:border-[#443a22]"
                  }`}>
                    <img
                      src={`/SKELETONS/Gaf-001/1 GAF-001 v${view}.jpg`}
                      alt={`View ${view}`}
                      className="w-full h-auto object-cover opacity-60 group-hover:opacity-90 transition-opacity duration-300"
                    />
                    <div className={`text-center py-2 text-[10px] tracking-wider font-medium transition-colors ${
                      selectedView === view ? "text-[#f5d98a] bg-[#1d170b]" : "text-[#8a8680] bg-[#0d0d0d]"
                    }`}>
                      VIEW 0{view}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Doors Layout Section */}
            {selectedView === 3 && (
              <div className="animate-fadeIn">
                <div className="uppercase tracking-[0.3em] text-[10px] text-[#8a8680] mb-3 mt-6">
                  Exterior Portals
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2].map((doorNum) => (
                    <div
                      key={doorNum}
                      onClick={() => setAppliedDoor?.(doorNum)}
                      className={`premium-view-card cursor-pointer group ${appliedDoor === doorNum ? "selected" : ""}`}
                    >
                      <div className={`premium-view-cube relative rounded overflow-hidden aspect-square border transition-all duration-500 bg-[#141414] ${
                        appliedDoor === doorNum ? "border-[#d4a843]" : "border-[#241f13] hover:border-[#443a22]"
                      }`}>
                        <img
                          src={`/doors/${doorNum}.png`}
                          alt={`Door ${doorNum}`}
                          className="w-full h-full object-cover opacity-50 group-hover:opacity-85 transition-opacity"
                        />
                        <div className={`text-center py-1.5 text-[10px] tracking-wider font-medium transition-colors ${
                          appliedDoor === doorNum ? "text-[#f5d98a] bg-[#1d170b]" : "text-[#8a8680] bg-[#0d0d0d]"
                        }`}>
                          DOOR 0{doorNum}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Render Canvas Area */}
        <div
          ref={stageRef}
          className={`relative flex-1 flex items-center justify-center px-0 pt-6 pb-0 ${
            showThumbnails ? "md:w-[57%]" : "w-full"
          }`}
style={{
  backgroundImage: "url('/openmodelbg/simplebg1.png')",
  backgroundSize: "cover",
  backgroundPosition: "center"
}}

        >
          {(isDesignLoading || isViewLoading) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-sm z-50">
              <div className="p-6 rounded-full bg-[#111111] border border-[#2b220f] shadow-2xl">
                <RingLoader color="#d4a843" size={50} />
              </div>
              <p className="mt-5 text-[10px] tracking-[0.25em] text-[#c9a96e] font-light uppercase">
                {isDesignLoading ? "Compiling Textures..." : `Assembling Workspace Viewport 0${selectedView}`}
              </p>
            </div>
          )}

          {/* Layer Matrix Stack with explicitly declared preserve-3d context */}
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden" style={{ transformStyle: "preserve-3d" }}>
            {activeLayers.map(renderLayer)}

            {renderOverlay(appliedFloor,    "floor",     10)}
            {renderOverlay(appliedHandrail, "handrails", 20)}
            {renderOverlay(appliedCeiling,  "ceiling",   25)}
            {renderOverlay(appliedLight,    "lights",    30)}
            {renderSubHandrailOverlay()}
            {renderDoorOverlay()}
          </div>
        </div>
      </div>
    </>
  );
});

export default ModelPreview;