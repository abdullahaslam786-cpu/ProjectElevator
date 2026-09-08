import React, { useEffect, useState, useRef, useCallback } from "react";
import { IoClose } from "react-icons/io5";
import { RingLoader } from "react-spinners";
import gsap from "gsap";

// Ceiling numbers that ALLOW lights
const CEILINGS_WITH_LIGHT = [1, 5, 6, 7];

const CeilingController = ({ applyCeiling, applyFloor, applyLight }) => {
  const [selectedCeiling, setSelectedCeiling] = useState(null);
  const [selectedFloor,   setSelectedFloor]   = useState(null);
  const [selectedLight,   setSelectedLight]   = useState(null);

  const [ceilingThumbnails, setCeilingThumbnails] = useState([]);
  const [floorThumbnails,   setFloorThumbnails]   = useState([]);
  const [lightThumbnails,   setLightThumbnails]   = useState([]);

  const [ceilingPreviewUrl, setCeilingPreviewUrl] = useState(null);
  const [allCeilingImages,  setAllCeilingImages]  = useState([]);
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
        const [cRes, fRes, lRes] = await Promise.all([
          fetch("/api/images-by-prefix?prefix=SubMaterial/ceiling"),
          fetch("/api/images-by-prefix?prefix=SubMaterial/floor"),
          fetch("/api/images-by-prefix?prefix=SubMaterial/lights"),
        ]);
        
        const ceilingData = await cRes.json();
        const floorData   = await fRes.json();
        const lightData   = await lRes.json();

        setAllCeilingImages(ceilingData);
        
        setCeilingThumbnails(processImages(ceilingData.filter(i => i.key.includes("/V2/"))));
        setFloorThumbnails(processImages(floorData.filter(i => i.key.includes("/V2/"))));
        setLightThumbnails(processImages(lightData)); 

      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [processImages]);

  // GSAP: Dropdown Preview Animation
  useEffect(() => {
    if (previewContainerRef.current) {
      gsap.to(previewContainerRef.current, {
        height: ceilingPreviewUrl ? 260 : 0,
        duration: 0.5,
        ease: "power3.out"
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
          marginTop: 10,
          duration: 0.6,
          ease: "power3.out",
        });
      } else {
        gsap.to(lightsSectionRef.current, {
          height: 0,
          opacity: 0,
          marginTop: 0,
          duration: 0.4,
          ease: "power3.inOut"
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
    }

    const found = allCeilingImages.find((img) => img.key.includes(`/V2/${num}.png`));
    if (found) setCeilingPreviewUrl(found.url);
  };

  // ADDED BACK: The missing handler function to fix the ceiling crash
  const handleNoneLight = useCallback(() => {
    setSelectedLight(null);
    applyLight(null);
  }, [applyLight]);

  return (
    <>
     <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Jost:wght=200;300;400;500&display=swap');

        .cec-root {
          font-family: 'Jost', sans-serif;
          background: linear-gradient(180deg, #FFFDF6, #F7EFCF); /* Soft Cream to Light Golden Veil */
          color: #5C4A26; /* Deep Bronze-Gold text */
          min-height: 100%;
        }

        .cec-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 24px;
          background: linear-gradient(180deg, #423516 0%, #29200B 100%); /* Deep Satin Gold-Onyx */
          border-bottom: 1px solid #C9A245; /* Polished Golden Hairline Separator */
        }

        .cec-header-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 12px;
          font-weight: 300;
          letter-spacing: 0.15em;
          color: #FFF3CD; /* Radiant White-Gold Tint */
        }

        .cec-preview {
          position: relative;
          overflow: hidden;
          background: #1F190A; /* Dense Golden Shadows */
        }

        .cec-preview-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 30px;
          opacity: 0.95;
          filter: sepia(0.15) saturate(1.05);
        }

        .cec-preview-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(41,32,11,0.95) 0%, transparent 60%); /* Amber Shaded Vignette */
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 20px;
        }

        .cec-content {
          height: 480px;
          overflow-y: auto;
          background: linear-gradient(180deg, #FFFDF6, #F7EFCF);
          scrollbar-width: thin;
          scrollbar-color: #D4AF37 #F7EFCF;
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
          color: #AA9154; /* Muted Ochre-Gold Label Text */
        }

        .cec-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #E8D8A7; /* Light Gold Wireframe Separator */
        }

        .cec-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          padding: 0 24px 20px;
        }

        .cec-swatch-wrap {
          position: relative;
          aspect-ratio: 1;
          cursor: pointer;
          perspective: 1000px;
        }

        .cec-swatch-item {
          width: 100%;
          height: 100%;
          background: #FFFBF0; /* Warm Alabaster Gold Base */
          border: 1px solid #D6C394; /* Soft Brushed Gold Border */
          border-radius: 4px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.33, 1);
          transform-style: preserve-3d;
        }

        .cec-swatch-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.75;
          transition: opacity 0.3s;
        }

        .cec-swatch-badge {
          position: absolute;
          bottom: -20px;
          left: 0;
          right: 0;
          height: 18px;
          background: linear-gradient(135deg, #E6C262 0%, #B88E2F 100%); /* Liquid Satin Gold Badge */
          color: #241A03; /* High Contrast Dark Bronze text */
          font-size: 8px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: bottom 0.3s ease;
        }

        .cec-swatch-wrap:hover .cec-swatch-item {
          transform: translateZ(15px);
          border-color: #B88E2F;
          box-shadow: 0 6px 16px rgba(184, 142, 47, 0.15);
        }

        .cec-swatch-wrap:hover img {
          opacity: 1;
        }

        .cec-swatch-wrap:hover .cec-swatch-badge {
          bottom: 0;
        }

        .cec-swatch-wrap.selected .cec-swatch-item {
          border-color: #D4AF37;
          transform: translateZ(20px);
          box-shadow: 0 10px 24px rgba(184, 142, 47, 0.3);
          background: #FFF9E6;
        }

        .cec-swatch-wrap.selected .cec-swatch-badge {
          bottom: 0;
          background: linear-gradient(135deg, #FFFFFF 0%, #FFF2CC 100%); /* Radiant White-Gold Highlight */
          color: #5C4A26;
          border-top: 1px solid #E6C262;
        }

        .cec-swatch-wrap.selected img {
          opacity: 1;
        }

        .cec-luxury-btn {
          position: relative;
          width: 100%;
          height: 50px;
          background: #FAEDC8; /* Soft Amber-Cream Matte Base */
          border: 1px solid #D6C394;
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cec-btn-glaze {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #E6C262 0%, #FFF2CC 50%, #B88E2F 100%); /* Shimmering Luxury Gold Sweep */
          transform: translateX(-100%);
          transition: transform 0.5s cubic-bezier(0.25, 1, 0.33, 1);
        }

        .cec-btn-text {
          position: relative;
          z-index: 2;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #7A6535; /* Crisp Medium Bronze-Gold text */
          transition: color 0.3s;
        }

        .cec-luxury-btn:hover .cec-btn-glaze {
          transform: translateX(0);
        }

        .cec-luxury-btn:hover .cec-btn-text {
          color: #241A03;
        }

        /* Active State Custom Accent - Kept for specific selection states */
        .cec-luxury-btn.active {
          border-color: #B88E2F;
        }
        
        .cec-luxury-btn.active .cec-btn-glaze {
          transform: translateX(0);
          background: linear-gradient(135deg, #E6C262 0%, #B88E2F 100%);
        }

        .cec-luxury-btn.active .cec-btn-text {
          color: #FFFFFF;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(41, 32, 11, 0.3);
        }

        .cec-lights-section {
          overflow: hidden;
          opacity: 0;
          height: 0;
        }
      `}</style>

      <div className="cec-root">
        <div className="cec-header">
          <div className="cec-header-title">CEILING CONFIGURATOR</div>
          <div style={{ fontSize: 9, letterSpacing: '0.25em', color: '#d4a843', fontWeight: 600 }}>
            PREMIUM SERIES
          </div>
        </div>

        <div ref={previewContainerRef} className="cec-preview">
          {ceilingPreviewUrl && (
            <>
              <img src={ceilingPreviewUrl} alt="Preview" className="cec-preview-img" />
              <div className="cec-preview-overlay">
                <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 16, color: '#d4a843' }}>
                  STRUCTURE OPTION 0{selectedCeiling}
                </div>
              </div>
              <button
                className="absolute top-4 right-4 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center border border-[#332a15]"
                onClick={() => { setCeilingPreviewUrl(null); setSelectedCeiling(null); applyCeiling(null); }}
              >
                <IoClose size={16} />
              </button>
            </>
          )}
        </div>

        <div className="cec-content">
          <div className="cec-section-label"><span>CEILING STRUCTURE</span></div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RingLoader color="#d4a843" size={40} />
            </div>
          ) : (
            <div className="cec-grid">
              {ceilingThumbnails.map((item) => (
                <div
                  key={item.num}
                  className={`cec-swatch-wrap ${selectedCeiling === item.num ? "selected" : ""}`}
                  onClick={() => handleCeilingSelect(item.num)}
                >
                  <div className="cec-swatch-item">
                    <img src={item.url} alt={`Ceiling ${item.num}`} />
                    <div className="cec-swatch-badge">0{item.num}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lighting UI wrapper layer */}
          <div ref={lightsSectionRef} className="cec-lights-section">
            <div className="cec-section-label"><span>INTEGRATED LIGHTING</span></div>
            <div className="cec-grid">
              {lightThumbnails.slice(0, 8).map((item) => (
                <div
                  key={item.num}
                  className={`cec-swatch-wrap ${selectedLight === item.num ? "selected" : ""}`}
                  onClick={() => { setSelectedLight(item.num); applyLight(item.num); }}
                >
                  <div className="cec-swatch-item">
                    <img src={item.url} alt={`Light ${item.num}`} />
                    <div className="cec-swatch-badge">GLOW 0{item.num}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <div 
                className={`cec-luxury-btn ${selectedLight === null ? "active" : ""}`}
                onClick={handleNoneLight}
              >
                <div className="cec-btn-glaze" />
                <div className="cec-btn-text">DEACTIVATE ILLUMINATION</div>
              </div>
            </div>
          </div>

          <div className="cec-section-label"><span>FLOORING FINISHES</span></div>
          <div className="cec-grid">
            {floorThumbnails.map((item) => (
              <div
                key={item.num}
                className={`cec-swatch-wrap ${selectedFloor === item.num ? "selected" : ""}`}
                onClick={() => { setSelectedFloor(item.num); applyFloor(item.num); }}
              >
                <div className="cec-swatch-item">
                  <img src={item.url} alt={`Floor ${item.num}`} />
                  <div className="cec-swatch-badge">BASE 0{item.num}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default CeilingController;