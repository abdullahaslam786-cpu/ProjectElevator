import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect
} from "react";
import html2canvas from "html2canvas";
import { HiX } from "react-icons/hi";
import { RingLoader } from "react-spinners";
import gsap from "gsap";
import ModelPreview from "./ModelPreview";

const OpenModel = forwardRef(
  (
    {
      selectedView,
      setSelectedView,
      activeStep,
      onNext,
      highlightedPanels = [],
      activeZone,
      appliedMaterials = {},
      presignedCache = {},
      setPresignedCache,
      appliedHandrail,
      appliedSubHandrail,
      appliedCeiling,
      appliedFloor,
      appliedLight,
      selectedModelId,
      isDesignLoading,
      appliedDoor,
      setAppliedDoor,
    },
    ref,
  ) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalView, setModalView] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    const mainPreviewRef = useRef(null);
    const modalPreviewRef = useRef(null);
    const topBarRef = useRef(null);
    const loaderRef = useRef(null);

    // Initial load and view change simulation
    useEffect(() => {
      if (selectedModelId) {
        setIsLoading(true);
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }, [selectedModelId, selectedView]);
// add this near your other useEffects in OpenModel.jsx
useEffect(() => {
  if (selectedModelId && (appliedDoor === null || appliedDoor === undefined)) {
    setAppliedDoor?.(2);
  }
}, [selectedModelId]);
    // GSAP Entrances for Top Bar UI elements
    useEffect(() => {
      if (topBarRef.current) {
        gsap.fromTo(
          topBarRef.current.querySelectorAll(".gsap-fade-in"),
          { opacity: 0, y: -15 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
        );
      }
    }, [selectedModelId]);

    useImperativeHandle(ref, () => ({
      async captureViews() {
        const images = [];
        console.log("[Capture] Starting improved captureViews...");

        const captureOptions = {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 20000,
          removeContainer: true,
        };

        try {
          if (mainPreviewRef.current) {
            await new Promise((r) => setTimeout(r, 600));
            const canvas1 = await html2canvas(mainPreviewRef.current, captureOptions);
            images.push(canvas1.toDataURL("image/jpeg", 0.92));
            console.log("[Capture] View 1 captured");
          }

          setIsModalOpen(true);
          await new Promise((r) => setTimeout(r, 800));

          for (const view of [2, 3]) {
            setModalView(view);
            await new Promise((r) => setTimeout(r, 1200));

            if (modalPreviewRef.current) {
              const canvas = await html2canvas(modalPreviewRef.current, captureOptions);
              images.push(canvas.toDataURL("image/jpeg", 0.92));
              console.log(`[Capture] View ${view} captured`);
            }
          }

          setIsModalOpen(false);
          console.log(`[Capture] Successfully captured ${images.length} views`);
          return images;

        } catch (err) {
          console.error("[Capture] Failed:", err);
          setIsModalOpen(false);
          return null;
        }
      },
    }));

    const openModal = (view = 1) => {
      setModalView(view);
      setIsModalOpen(true);
    };

    const closeModal = () => {
      setIsModalOpen(false);
    };

    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Jost:wght@200;300;400;500&display=swap');

          .om-root-theme {
            font-family: 'Jost', sans-serif;
          }

          /* Premium Header 3D Action Cube Structural Logic */
          .om-cube-wrap {
            perspective: 800px;
            perspective-origin: 50% 50%;
            height: 38px;
          }

          .om-cube {
            position: relative;
            width: 100%;
            height: 100%;
            transform-style: preserve-3d;
            transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          }

          .om-cube .om-face {
            position: absolute;
            inset: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 500;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            backface-visibility: hidden;
            border-radius: 4px;
            padding: 0 16px;
          }

          /* Dimensions Option Variant */
          .om-cube-dim .om-face.front {
            background: #000000;
            color: #d4a843;
            border: 1px solid #332a15;
            transform: translateZ(19px);
          }

          .om-cube-dim .om-face.bottom {
            background: #c9a96e;
            color: #000000;
            font-weight: 600;
            transform: rotateX(-90deg) translateZ(19px);
          }

          /* Next Action Key Variant */
          .om-cube-next .om-face.front {
            background: linear-gradient(135deg, #d4a843 0%, #f5d98a 50%, #b8841f 100%);
            color: #000000;
            font-weight: 600;
            transform: translateZ(19px);
          }

          .om-cube-next .om-face.bottom {
            background: #000000;
            color: #f5d98a;
            border: 1px solid #b8841f;
            transform: rotateX(-90deg) translateZ(19px);
          }

          /* Hover Interactions */
          .om-cube-wrap:hover .om-cube {
            transform: rotateX(90deg);
          }
        `}</style>

        <div className="om-root-theme bg-[#f7f5f2] h-full w-full flex flex-col relative overflow-hidden">
          <div className="relative h-[560px] bg-[#f7f5f2] border border-[#e0dcd6] overflow-hidden">
            
            {/* Top Action Header Bar */}
  <div 
  ref={topBarRef}
  className="absolute top-0  left-0 right-0 h-auto min-h-[90px] lg:min-h-[90px] bg-[#FFFBF0]/95 backdrop-blur-md z-10 flex flex-col items-center justify-center  gap-3 lg:gap-3 border-b border-[#D6C394] shadow-sm"
>
  {/* Elevator Metadata Text */}
  <div className="gsap-fade-in w-full flex flex-row items-center justify-between lg:justify-center lg:gap-8 text-left transition-all duration-300">
    <div className="text-[10px] sm:text-xs lg:text-[11px] text-[#8A8165] font-light tracking-[0.2em] lg:tracking-[0.25em] uppercase">
      Studio Space Pipeline
    </div>
    <div className="text-[14px] sm:text-[15px] lg:text-[12px] text-[#241A03] font-light tracking-wide font-serif mt-0.5 lg:mt-0">
      {selectedModelId || "LEVELe-108"} <span className="text-[#B88E2F] px-1 lg:px-2 font-sans font-bold">·</span> VIEW {selectedView}
    </div>
  </div>

  {/* Interactive Controls Segment: Color-mapped buttons directly within utility classes */}
  <div className="flex flex-row items-center justify-center gap-3 sm:gap-4 w-full lg:w-auto lg:min-w-[460px] gsap-fade-in">
    {activeStep !== "Configurations" && (
      <div className="om-cube-wrap om-cube-dim flex-1 lg:flex-initial lg:w-[200px] h-11 lg:h-[42px]">
        <button
          onClick={() => openModal(1)}
          className="om-cube w-full h-full"
        >
          {/* Light Golden Face: Warm Alabaster Cream base with soft brushed gold border */}
          <div className="om-face front text-center text-[11px] sm:text-xs lg:text-[13px] bg-[#FFFBF0] text-[#B88E2F] border border-[#D6C394] rounded-[4px] !important">
            Alter Dimensions
          </div>
          {/* Flip Side: Muted Amber-Cream */}
          <div className="om-face bottom text-center text-[11px] sm:text-xs lg:text-[13px] bg-[#FAEDC8] text-[#5C4A26] border border-[#C9A245] rounded-[4px] !important">
            Open Real-Time Map
          </div>
        </button>
      </div>
    )}

    <div className="om-cube-wrap om-cube-next flex-1 lg:flex-initial lg:w-[180px] h-11 lg:h-[42px]">
      <button
        onClick={onNext}
        className="om-cube w-full h-full"
      >
        {/* Golden Face: Shimmering Luxury Metallic Sweep with High-Contrast Deep Bronze Text */}
        <div className="om-face front text-center text-[11px] sm:text-xs lg:text-[13px] bg-gradient-to-br from-[#E6C262] via-[#FFF2CC] to-[#B88E2F] text-[#241A03] font-semibold rounded-[4px] shadow-sm !important">
          Next Step →
        </div>
        {/* Flip Side: Premium Deep Gold-Onyx Accent */}
        <div className="om-face bottom text-center text-[11px] sm:text-xs lg:text-[13px] bg-gradient-to-b from-[#423516] to-[#29200B] text-[#FFF3CD] border border-[#C9A245] rounded-[4px] !important">
          Proceed Suite
        </div>
      </button>
    </div>
  </div>
</div>


  

            {/* Main Interactive Stage Area */}
            <div ref={mainPreviewRef} className="w-full h-full pt-16 relative">
              {isLoading && (
                <div 
                  ref={loaderRef}
                  className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-[#000000]/90 backdrop-blur-sm"
                >
                  <div className="relative flex items-center justify-center p-8 rounded-full bg-[#111111] border border-[#2b220f] shadow-2xl">
                    <RingLoader color="#d4a843" size={50} />
                  </div>
                  <p className="mt-5 text-[10px] tracking-[0.3em] font-medium text-[#c9a96e] uppercase">
                    Generating Luxury Spatial View
                  </p>
                </div>
              )}

              <ModelPreview
                selectedView={selectedView}
                activeStep={activeStep}
                highlightedPanels={highlightedPanels}
                activeZone={activeZone}
                appliedMaterials={appliedMaterials}
                presignedCache={presignedCache}
                setPresignedCache={setPresignedCache}
                className="w-full h-full"
                showInfoOverlay={true}
                showThumbnails={false}
                appliedHandrail={appliedHandrail}
                appliedSubHandrail={appliedSubHandrail}
                appliedCeiling={appliedCeiling}
                appliedFloor={appliedFloor}
                appliedLight={appliedLight}
                isDesignLoading={isDesignLoading}
                selectedModelId={selectedModelId}
                appliedDoor={appliedDoor}
                setAppliedDoor={setAppliedDoor}
              />
            </div>
          </div>

          {/* Full-Scale Immersive Modal Viewport */}
          {isModalOpen && (
            <div
              className="fixed inset-0 z-50 bg-[#000000]/85 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn"
              onClick={closeModal}
            >
              <div
                ref={modalPreviewRef}
                className="relative w-[88vw] h-[88vh] bg-[#f7f5f2] rounded-lg shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border border-[#332a15] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button Trigger with interactive ring hover */}
                <button
                  onClick={closeModal}
                  className="absolute top-6 right-6 z-50 bg-[#0a0a0a] text-[#c9a96e] hover:text-white border border-[#332a15] hover:border-[#c9a96e] rounded-full p-3 shadow-xl transition-all duration-300"
                >
                  <HiX size={18} />
                </button>

                {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#000000]/95 z-20">
                    <RingLoader color="#d4a843" size={55} />
                    <p className="mt-6 text-[10px] tracking-[0.25em] font-light text-[#8a8680] uppercase">
                      Rendering Vector View <span className="text-[#d4a843] font-medium">{modalView}</span>
                    </p>
                  </div>
                )}

                <ModelPreview
                  selectedView={modalView}
                  setSelectedView={setModalView}
                  activeStep={activeStep}
                  highlightedPanels={highlightedPanels}
                  activeZone={activeZone}
                  appliedMaterials={appliedMaterials}
                  presignedCache={presignedCache}
                  setPresignedCache={setPresignedCache}
                  className="w-full h-full"
                  showInfoOverlay={false}
                  showThumbnails={true}
                  appliedHandrail={appliedHandrail}
                  appliedSubHandrail={appliedSubHandrail}
                  appliedCeiling={appliedCeiling}
                  appliedFloor={appliedFloor}
                  appliedLight={appliedLight}
                  selectedModelId={selectedModelId}
                  appliedDoor={appliedDoor}
                  setAppliedDoor={setAppliedDoor}
                />
              </div>
            </div>
          )}
        </div>
      </>
    );
  }
);

export default OpenModel;