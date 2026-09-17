import React, { useRef, useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Check } from "lucide-react";
import SelectModel from "./Configuration/SelectModel";
import OpenModel from "./Configuration/OpenModel";
import WallpanelController from "./Configuration/WallpanelController";
import HandrailController from "./Configuration/HandrailController";
import CeilingController from "./Configuration/CeilingController";
import FloorController from "./Configuration/FloorController";
import Review from "./Configuration/Review";
import { saveDesignState, loadDesignState } from "../redux/features/Project/projectSlice";
import gsap from "gsap";

// ─── Debounce helper ──────────────────────────────────────────────────────
function useDebounce(fn, delay) {
  const timerRef = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

export default function ElevatorDesigner3() {
  const { id: subprojectId } = useParams();
  const dispatch = useDispatch();

  // ── Track projectId once loaded ──────────────────────────────────────
  const projectIdRef = useRef(null);
  const isLoadedRef = useRef(false);

  // ── All design state ─────────────────────────────────────────────────
  const [selectedView, setSelectedView]       = useState(1);
  const [appliedHandrail, setAppliedHandrail] = useState(null);
  const [appliedCeiling, setAppliedCeiling]   = useState(null);
  const [appliedFloor, setAppliedFloor]       = useState(null);
  const [appliedLight, setAppliedLight]       = useState(null);
  const [appliedSubHandrail, setAppliedSubHandrail] = useState(null);
  const [appliedDoor, setAppliedDoor]         = useState(null);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [selectedModel, setSelectedModel]     = useState(null);
  const [isDesignLoading, setIsDesignLoading] = useState(false);
  const [activeZone, setActiveZone]           = useState("A");
  const [appliedMaterials, setAppliedMaterials] = useState({});
  const [presignedCache, setPresignedCache]   = useState({});
  const [selectedPanels, setSelectedPanels]   = useState({
    A: [], B: [], C: [], D: [], E: [], F: [], G: [],
  });
  const [steps, setSteps] = useState([
    { label: "Configurations", shortLabel: "Config", icon: "/ConfigurationNavbar/Elevator.png",  active: true  },
    { label: "Wall Panels",    shortLabel: "Walls",  icon: "/ConfigurationNavbar/Wallpanel.png", active: false },
    { label: "Handrails",      shortLabel: "Rails",  icon: "/ConfigurationNavbar/handrail.png",  active: false },
    { label: "Ceilings",       shortLabel: "Roof",   icon: "/ConfigurationNavbar/ceiling.png",   active: false },
    { label: "Floors",         shortLabel: "Floor",  icon: "/ConfigurationNavbar/floor.png",     active: false },
    { label: "Review",         shortLabel: "Review", icon: "/ConfigurationNavbar/review.png",    active: false },
  ]);

  const [pageLoading, setPageLoading] = useState(true);
  const [saveStatus, setSaveStatus]   = useState("");

  const openModelRef = useRef(null);
  const navRefs = useRef([]);

  // ── 1. LOAD design state on mount ────────────────────────────────────
  useEffect(() => {
    if (!subprojectId) {
      setPageLoading(false);
      return;
    }

    const load = async () => {
      try {
        setPageLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/projects/subprojects/${subprojectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load subproject");
        const data = await res.json();

        const sub = data.subproject;
        projectIdRef.current = sub.projectId;
        const ds = sub.designState;

        if (ds && ds.selectedModelId) {
          setSelectedView(ds.selectedView       ?? 1);
          setSelectedModelId(ds.selectedModelId ?? null);
          setSelectedModel(ds.selectedModel     ?? null);
          setAppliedHandrail(ds.appliedHandrail ?? null);
          setAppliedCeiling(ds.appliedCeiling   ?? null);
          setAppliedFloor(ds.appliedFloor       ?? null);
          setAppliedLight(ds.appliedLight       ?? null);
          setAppliedSubHandrail(ds.appliedSubHandrail ?? null);
          setAppliedDoor(ds.appliedDoor         ?? null);
          setActiveZone(ds.activeZone           ?? "A");
          setAppliedMaterials(ds.appliedMaterials ?? {});
          setSelectedPanels(ds.selectedPanels ?? {
            A: [], B: [], C: [], D: [], E: [], F: [], G: [],
          });

          // NOTE: We intentionally do NOT overwrite the whole `steps` array
          // with `ds.steps`. The steps array (labels/icons/order) is UI
          // structure that lives in code, not user data — a subproject saved
          // before a new step (e.g. "Floors") was added would otherwise load
          // a stale, shorter array and silently lose that tab forever.
          // We only restore *which* step was active.
          if (ds.steps) {
            const savedActiveLabel = ds.steps.find((s) => s.active)?.label;
            setSteps((prevSteps) =>
              prevSteps.map((step) => ({
                ...step,
                active: step.label === savedActiveLabel,
              }))
            );
          }
        }
      } catch (err) {
        console.error("[DesignLoad] Failed:", err.message);
      } finally {
        setPageLoading(false);
        setTimeout(() => { isLoadedRef.current = true; }, 500);
      }
    };

    load();
  }, [subprojectId]);

  // ── 2. BUILD current design state object ─────────────────────────────
  const buildDesignState = useCallback(() => ({
    selectedView,
    selectedModelId,
    selectedModel,
    appliedHandrail,
    appliedCeiling,
    appliedFloor,
    appliedLight,
    appliedSubHandrail,
    appliedDoor,
    activeZone,
    appliedMaterials,
    selectedPanels,
    steps,
  }), [
    selectedView, selectedModelId, selectedModel,
    appliedHandrail, appliedCeiling, appliedFloor, appliedLight,
    appliedSubHandrail, appliedDoor, activeZone,
    appliedMaterials, selectedPanels, steps,
  ]);

  // ── 3. AUTO-SAVE with 2s debounce ────────────────────────────────────
  const doSave = useCallback(async (designState) => {
    if (!isLoadedRef.current) return;
    if (!subprojectId || !projectIdRef.current) return;

    try {
      setSaveStatus("saving");
      await dispatch(saveDesignState({
        projectId: projectIdRef.current,
        subprojectId,
        designState,
      })).unwrap();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (err) {
      console.error("[DesignSave] Failed:", err);
      setSaveStatus("error");
    }
  }, [dispatch, subprojectId]);

  const debouncedSave = useDebounce(doSave, 2000);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    debouncedSave(buildDesignState());
  }, [
    selectedView, selectedModelId, selectedModel,
    appliedHandrail, appliedCeiling, appliedFloor, appliedLight,
    appliedSubHandrail, appliedDoor, activeZone,
    appliedMaterials, selectedPanels, steps,
  ]);

  // ── GSAP Dynamic Animations ──────────────────────────────────────────
  useEffect(() => {
    if (window.innerWidth < 1024) return;
    steps.forEach((step, idx) => {
      if (navRefs.current[idx]) {
        if (step.active) {
          gsap.set(navRefs.current[idx], { translateZ: -4, filter: "brightness(1.15)" });
        } else {
          gsap.set(navRefs.current[idx], { translateZ: 0, scale: 1, filter: "brightness(1)" });
        }
      }
    });
  }, [steps]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleResetConfiguration = () => {
    setAppliedMaterials({});
    setAppliedHandrail(null);
    setAppliedCeiling(null);
    setAppliedFloor(null);
    setAppliedLight(null);
    setAppliedSubHandrail(null);
    setAppliedDoor(null);
    setPresignedCache({});
    setSelectedPanels({ A: [], B: [], C: [], D: [], E: [], F: [], G: [] });
    setActiveZone("A");
    setSelectedView(1);
  };

  const handleApplySubHandrail = (value) => setAppliedSubHandrail(value);

  const applyMaterialToPanels = (zone, panels, material) => {
    setAppliedMaterials((oldData) => {
      const newData = { ...oldData };
      if (!newData[zone]) newData[zone] = {};
      panels.forEach((panelNumber) => {
        newData[zone][panelNumber] = material;
      });
      return newData;
    });
  };

  const togglePanel = (zone, num) => {
    setSelectedPanels((prev) => {
      const current = prev[zone] || [];
      return current.includes(num)
        ? { ...prev, [zone]: current.filter((n) => n !== num) }
        : { ...prev, [zone]: [...current, num] };
    });
  };

  const handleApplyHandrail = (val) => setAppliedHandrail(val);

  const handleStepClick = (clickedIndex) => {
    setSteps(steps.map((step, index) => ({ ...step, active: index === clickedIndex })));
  };

  const activeStep = steps.find((step) => step.active)?.label;

  const handleNextStep = () => {
    const currentIndex = steps.findIndex((s) => s.active);
    if (currentIndex < steps.length - 1) {
      handleStepClick(currentIndex + 1);
      setSelectedView(1);
    }
  };

  const handleNavMouseEnter = (index) => {
    if (window.innerWidth < 1024) return;
    gsap.to(navRefs.current[index], { scale: 1.02, translateZ: 10, duration: 0.3, ease: "power2.out" });
  };

  const handleNavMouseMove = (e, index) => {
    if (window.innerWidth < 1024) return;
    const rect = navRefs.current[index].getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    navRefs.current[index].style.setProperty("--mouse-x", `${x}%`);
    navRefs.current[index].style.setProperty("--mouse-y", `${y}%`);
  };

  const handleNavMouseLeave = (index, isActive) => {
    if (window.innerWidth < 1024) return;
    gsap.to(navRefs.current[index], { scale: 1, translateZ: isActive ? -4 : 0, duration: 0.4, ease: "power2.out" });
  };

  const handleNavClick = (index) => {
    handleStepClick(index);
    if (window.innerWidth < 1024) return;
    const tl = gsap.timeline();
    tl.to(navRefs.current[index], { translateZ: -6, duration: 0.1, ease: "power1.inOut" })
      .to(navRefs.current[index], { translateZ: -4, duration: 0.2, ease: "power2.out" });
  };

  if (pageLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#f7f5f2] z-50">
        <div className="w-12 h-12 border-4 border-[#c29d59] border-t-transparent rounded-full animate-spin mb-4" />
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.3em", color: "#c29d59", textTransform: "uppercase" }}>
          Loading your design...
        </p>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;700&display=swap');
        
       .ed3-root {
          font-family: 'Jost', sans-serif;
          background: linear-gradient(180deg, #FFFDF6, #F7EFCF);
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          color: #5C4A26;
          
        }

        /* ── Desktop-Only Custom Hexagon Component Layouts ────────────────── */
        @media (min-width: 1024px) {
          .ed3-navbar-wrapper { 
    perspective: 1000px; 
    width: 100%; 
    margin-bottom: 6px; 
    margin-top: 24px; /* Reduced from 58px to save vertical space */
  }
          .ed3-navbar { display: flex; flex-direction: row; align-items: center; justify-content: start; width: 100%; }
         .ed3-step-button-container { 
    position: relative; 
    flex: 1; 
    min-height: 60px; /* Reduced from 74px */
    margin-right: -2.2rem; /* Replaced -38px with relative rem unit */
    filter: drop-shadow(0 4px 8px rgba(92,74,38,0.12)); 
    transform-style: preserve-3d; 
  }
          .ed3-step-button-container:last-child { margin-right: 0; }
         .ed3-step-button {
    position: relative; 
    width: 100%; 
    height: 100%; 
    min-height: 60px; 
    display: flex; 
    align-items: center; 
    justify-content: space-between;
    padding: 8px 1.8rem 8px 2.5rem; /* Reduced rigid horizontal padding */
    background: linear-gradient(180deg, #423516 0%, #29200B 100%); 
    color: #E6C262; 
    border: none; 
    outline: none; 
    cursor: pointer; 
    user-select: none;
    clip-path: polygon(88% 0%, 100% 50%, 88% 100%, 0% 100%, 12% 50%, 0% 0%); 
    transform-style: preserve-3d; 
    transition: color 0.3s ease;
  }
    .ed3-step-button span {
    font-size: 10px; /* Scaled down slightly from 11px so labels don't wrap */
    letter-spacing: 0.1em;
  }
          .ed3-step-button::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, #FFF2CC, #C9A245); clip-path: polygon(88% 0%, 100% 50%, 88% 100%, 0% 100%, 12% 50%, 0% 0%); z-index: -1; }
          .ed3-step-inner-face { position: absolute; inset: 2px 3px 2px 3px; background: #29200B; clip-path: polygon(88% 0%, 100% 50%, 88% 100%, 0% 100%, 12% 50%, 0% 0%); z-index: 1; pointer-events: none; transition: background 0.3s ease; }
          .ed3-step-button:hover { color: #FFFFFF; }
          .ed3-step-button:hover .ed3-step-inner-face { background: #3D3012; }
          .ed3-step-button.active { color: #FFFFFF; }
          .ed3-step-button.active .ed3-step-inner-face { background: linear-gradient(to bottom, #423516, #1F190A); }
          .ed3-step-spotlight { position: absolute; inset: 0; background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 243, 205, 0.25), transparent 60%); pointer-events: none; z-index: 5; }
          
          .ed3-bulbs-panel { display: flex; flex-direction: row; align-items: center; justify-content: space-around; width: 100%; padding: 10px 45px; background: #1F190A; border-bottom: 2px solid #C9A245; border-top: 1px solid rgba(230, 194, 98, 0.2); margin-top: 4px; box-shadow: inset 0 4px 20px rgba(0,0,0,0.4); }
          .ed3-bulb-container { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; }
          .ed3-status-bulb { width: 12px; height: 12px; border-radius: 50%; background: #382C0E; border: 1px solid #5C4A26; transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); position: relative; box-shadow: inset 0 2px 4px rgba(0,0,0,0.6); }
          .ed3-status-bulb.active { background: radial-gradient(circle at 35% 35%, #FFFFFF 0%, #FFF2CC 30%, #E6C262 70%, #B88E2F 100%); border-color: #FFF9E6; box-shadow: 0 0 6px #E6C262, 0 0 15px rgba(230, 194, 98, 0.8), inset 0 1px 2px rgba(255,255,255,0.6); filter: drop-shadow(0 0 4px rgba(230, 194, 98, 0.5)); }
        }

        .ed3-save-badge { position: fixed; bottom: 24px; right: 24px; padding: 8px 16px; border-radius: 2px; font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; z-index: 999; border: 1px solid #D6C394; box-shadow: 0 4px 12px rgba(41, 32, 11, 0.1); }
        .ed3-save-badge.saving { background: #FFFBF0; color: #B88E2F; }
        .ed3-save-badge.saved { background: #FFFBF0; color: #4A8B5F; border-color: #A3D9B5; }
        .ed3-save-badge.error { background: #FFFBF0; color: #C24B4B; border-color: #F2A3A3; }
        .openModel-container { width: 100%; height: 100%; position: relative; }
      `}
      </style>

      <div className="ed3-root w-full flex justify-center ">
        {/* Responsive Box Frame: Zero mobile paddings */}
        <div className="w-full min-h-screen max-w-7xl mx-auto p-2 sm:p-4 lg:px-6 lg:pt-12 lg:pb-20">

          {saveStatus && (
            <div className={`ed3-save-badge ${saveStatus}`}>
              {saveStatus === "saving" && "● Saving..."}
              {saveStatus === "saved"  && "✓ Saved"}
              {saveStatus === "error"  && "✕ Save failed"}
            </div>
          )}

          {/* Master Responsive Header Bar Matrix */}
          <div className="w-full bg-[#1c1615] lg:bg-transparent border-b border-[#dfb76c]/40 lg:border-b-0">
            
            {/* Mobile Horizon Tabs System (Fluid Stretch Execution with ICONS appended) */}
            <nav className="flex lg:hidden w-full items-center justify-between pt-18">
              {steps.map((step, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleNavClick(index)}
                  className={`flex-1 flex flex-col items-center justify-center pt-3 pb-2.5 transition-all duration-200 border-b-2 ${
                    step.active 
                      ? "text-[#ffffff] bg-[#2b2120] border-[#dfb76c]" 
                      : "text-[#dfb76c]/60 border-transparent bg-transparent"
                  }`}
                >
                  <img
                    src={step.icon}
                    alt={step.shortLabel}
                    className={`object-contain w-5 h-5 mb-1 transition-all ${
                      step.active ? "filter brightness-125" : "opacity-40 grayscale"
                    }`}
                  />
                  <span className="text-[10px] font-bold tracking-wider uppercase">
                    {step.shortLabel}
                  </span>
                </button>
              ))}
            </nav>

            {/* Premium Big Screen Geometric Hex Nav Track — WITH LABELS & ICONS intact */}
            <div className="hidden lg:block ed3-navbar-wrapper">
              <nav className="ed3-navbar">
                {steps.map((step, index) => (
                  <div key={index} className="ed3-step-button-container" style={{ zIndex: steps.length - index }}>
                    <button
                      ref={(el) => (navRefs.current[index] = el)}
                      type="button"
                      onClick={() => handleNavClick(index)}
                      onMouseEnter={() => handleNavMouseEnter(index)}
                      onMouseMove={(e) => handleNavMouseMove(e, index)}
                      onMouseLeave={() => handleNavMouseLeave(index, step.active)}
                      className={`ed3-step-button ${step.active ? "active" : ""}`}
                    >
                      <div className="ed3-step-inner-face">
                        <div className="ed3-step-spotlight" />
                      </div>
                      
                      {/* Name Label is permanently visible on desktop */}
                      <span className="relative z-10 text-[11px] font-bold tracking-widest uppercase transition-colors duration-300 transform translate-z-[12px]">
                        {step.label}
                      </span>

                      {/* Matching Graphical Icon Frame */}
                      <div className="relative flex items-center justify-center w-8 h-8 z-10 select-none">
                        <img
                          src={step.icon}
                          alt={step.label}
                          className={`object-contain transition-all duration-300 ${
                            step.active ? "w-7 h-7 filter brightness-125 drop-shadow-[0_2px_6px_rgba(223,183,108,0.4)]" : "w-6 h-6 opacity-30 grayscale"
                          }`}
                        />
                      </div>
                    </button>
                  </div>
                ))}
              </nav>

              <div className="ed3-bulbs-panel">
                {steps.map((step, index) => (
                  <div key={index} className="ed3-bulb-container">
                    <div className={`ed3-status-bulb ${step.active ? "active" : ""}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Master View Grid Layout Workspace Stack Matrix */}
  <div className="grid grid-cols-1 lg:grid-cols-11 gap-0 sm:gap-4 lg:gap-2 w-full items-stretch">
  
  {/* Right Controls Panel Sidebar */}
  {/* INCREASED FROM lg:col-span-8 TO lg:col-span-9 */}
  <div className="col-span-1 lg:col-span-7 bg-white border-b lg:border border-[#e0dcd6] sm:rounded-xl shadow-sm overflow-hidden order-1 lg:order-2 w-full flex flex-col justify-between h-90vh lg:h-[560px]">
    <div className="w-full h-full">
      {activeStep === "Configurations" && (
        <SelectModel
          setSelectedView={setSelectedView}
          setSelectedModelId={setSelectedModelId}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          onResetConfiguration={handleResetConfiguration}
        />
      )}
      {activeStep === "Wall Panels" && (
        <WallpanelController
          activeZone={activeZone}
          setActiveZone={setActiveZone}
          selectedPanels={selectedPanels}
          togglePanel={togglePanel}
          applyMaterial={applyMaterialToPanels}
          setSelectedPanels={setSelectedPanels}
          selectedModelId={selectedModelId}
          onDesignLoad={setIsDesignLoading}
        />
      )}
      {activeStep === "Handrails" && (
        <HandrailController
          applyHandrail={handleApplyHandrail}
          applySubHandrail={handleApplySubHandrail}
        />
      )}
      {activeStep === "Ceilings" && (
        <CeilingController
          applyCeiling={setAppliedCeiling}
          applyLight={setAppliedLight}
        />
      )}
      {activeStep === "Floors" && (
        <FloorController
          applyFloor={setAppliedFloor}
        />
      )}
      {activeStep === "Review" && (
        <Review
          presignedCache={presignedCache}
          selectedModelId={selectedModelId}
          selectedView={selectedView}
          subprojectId={subprojectId}
          appliedMaterials={appliedMaterials}
          appliedHandrail={appliedHandrail}
          appliedSubHandrail={appliedSubHandrail}
          appliedCeiling={appliedCeiling}
          appliedFloor={appliedFloor}
          appliedLight={appliedLight}
          appliedDoor={appliedDoor}
          openModelRef={openModelRef}
        />
      )}
    </div>
  </div>

  {/* Left 3D Interactive Viewport Area (OpenModel) */}
  {/* REDUCED FROM lg:col-span-4 TO lg:col-span-3 */}
  <div className="col-span-1 lg:col-span-4 bg-white lg:border border-[#e0dcd6] sm:rounded-xl overflow-hidden shadow-sm min-h-[70vw] sm:min-h-[500px] lg:min-h-[530px] w-full order-2 lg:order-1 flex flex-col">
    <div className="w-full h-full flex-1 relative openModel-container">
      <OpenModel
        ref={openModelRef}
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        activeStep={activeStep}
        onNext={handleNextStep}
        activeZone={activeZone}
        highlightedPanels={selectedPanels[activeZone] || []}
        appliedMaterials={appliedMaterials}
        presignedCache={presignedCache}
        setPresignedCache={setPresignedCache}
        appliedHandrail={appliedHandrail}
        appliedSubHandrail={appliedSubHandrail}
        appliedCeiling={appliedCeiling}
        appliedFloor={appliedFloor}
        appliedLight={appliedLight}
        selectedModelId={selectedModelId}
        isDesignLoading={isDesignLoading}
        appliedDoor={appliedDoor}
        setAppliedDoor={setAppliedDoor}
      />
    </div>
  </div>

</div>
        </div>
      </div>
    </>
  );
}