import React, { useEffect, useState, useRef } from "react";
import { IoClose } from "react-icons/io5";
import { RingLoader } from "react-spinners";
import gsap from "gsap";

// Local (public folder) image path for a given handrail number.
// Used for BOTH the option buttons and the big preview panel so they load
// instantly, instead of waiting on the AWS url (item.url / previewImages[num]).
// Files expected at: public/previewHandrail/1.png ... public/previewHandrail/15.png
const getLocalHandrailImage = (num) => `/previewHandrails/${num}.png`;

const HandrailController = ({ applyHandrail, applySubHandrail }) => {
  const [selectedHandrail, setSelectedHandrail] = useState(null);
  const [subHandrailEnabled, setSubHandrailEnabled] = useState(false);
  const [thumbnails, setThumbnails] = useState([]);
  const [previewImages, setPreviewImages] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const previewContainerRef = useRef(null);

  useEffect(() => {
    const fetchHandrails = async () => {
      try {
        setLoading(true);

        // Main Handrails Thumbnails
        const thumbRes = await fetch("/api/images-by-prefix?prefix=SubMaterial/handrails");
        if (thumbRes.ok) {
          const data = await thumbRes.json();
          const thumbs = data
            .filter(item => item.key.includes("/V2/") && item.key.endsWith(".png"))
            .map(item => {
              const match = item.key.match(/\/V2\/(\d+)\.png$/);
              return { ...item, num: match ? parseInt(match[1]) : 0 };
            })
            .sort((a, b) => a.num - b.num);
          setThumbnails(thumbs);
        }

        // Preview Images
        const previewRes = await fetch("/api/images-by-prefix?prefix=previewHandrails");
        if (previewRes.ok) {
          const previewData = await previewRes.json();
          const previewMap = {};
          previewData.forEach((item) => {
            const match = item.key.match(/previewHandrails\/(\d+)\.(png|jpg|jpeg)$/i);
            if (match) previewMap[parseInt(match[1])] = item.url;
          });
          setPreviewImages(previewMap);
        }
      } catch (err) {
        console.error("Handrail fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHandrails();
  }, []);

  // GSAP animation handle for Dropdown Preview Height transitions
  useEffect(() => {
    if (previewContainerRef.current) {
      if (previewUrl) {
        gsap.to(previewContainerRef.current, {
          height: 250,
          duration: 0.5,
          ease: "power3.out"
        });
      } else {
        gsap.to(previewContainerRef.current, {
          height: 0,
          duration: 0.4,
          ease: "power3.inOut"
        });
      }
    }
  }, [previewUrl]);

  const handleMainSelect = (num) => {
    setSelectedHandrail(num);
    applyHandrail(num);

    // Use the local image for the preview instead of the AWS url so it
    // shows instantly rather than waiting on the network fetch.
    setPreviewUrl(getLocalHandrailImage(num));
  };
// const handleMainSelect = (num) => {
//     setSelectedHandrail(num);
//     applyHandrail(num);

//     const previewSrc = previewImages[num];
//     setPreviewUrl(previewSrc || null);
//   };

  // ─── INSERT IT HERE ───
  const toggleSubHandrail = () => {
    const newState = !subHandrailEnabled;
    setSubHandrailEnabled(newState);
    applySubHandrail(newState ? "subhandrail" : null);
  };
  return (
    <>
  <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght=300;400;500&family=Jost:wght=200;300;400;500&display=swap');

        .hrc-root {
          font-family: 'Jost', sans-serif;
          color: #5C4A26; /* Deep Bronze-Gold text */
          background: linear-gradient(180deg, #FFFDF6, #F7EFCF); /* Soft Cream to Light Golden Veil */
          min-height: 100%;
        }
        
        .hrc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 24px;
          background: linear-gradient(180deg, #423516 0%, #29200B 100%); /* Deep Satin Gold-Onyx */
          border-bottom: 1px solid #C9A245; /* Polished Golden Hairline Separator */
        }
        
        .hrc-header-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 12px;
          font-weight: 300;
          letter-spacing: 0.15em;
          color: #FFF3CD; /* Radiant White-Gold Tint */
        }
        
        .hrc-preview {
          position: relative;
          overflow: hidden;
          background: #1F190A; /* Dense Golden Shadows */
          height: 0px;
        }
        
        .hrc-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.15);
       
        }
        
        .hrc-preview-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(41,32,11,0.95) 0%, transparent 60%); /* Amber Shaded Vignette */
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 20px;
        }
        
        .hrc-preview-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 400;
          color: #FFF0B8; /* Warm Candlelight Gold */
          letter-spacing: 0.1em;
        }
        
        .hrc-content {
          height: 580px;
          overflow-y: auto;
          background: linear-gradient(180deg, #FFFDF6, #F7EFCF);
          scrollbar-width: thin;
          scrollbar-color: #D4AF37 #F7EFCF;
        }
        
        .hrc-section-label {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px  14px;
        }
        
        .hrc-section-label span {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #AA9154; /* Muted Ochre-Gold Label Text */
        }
        
        .hrc-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #E8D8A7; /* Light Gold Wireframe Separator */
        }
        
        /* ── Special Luxury Grid Microinteractions ── */
        .hrc-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 12px;
          padding: 0px 12px;
        }
      
        .hrc-swatch-premium {
          position: relative;
          aspect-ratio: 1;
          cursor: pointer;
          background: #FFFBF0; /* Warm Alabaster Gold Base */
          border: 1px solid #D6C394; /* Soft Brushed Gold Border */
          border-radius: 4px;
          overflow: hidden;
          perspective: 400px;
          transform-style: preserve-3d;
          transition: border-color 0.4s ease, transform 0.4s cubic-bezier(0.25, 1, 0.33, 1), box-shadow 0.4s ease;
        }

        .hrc-swatch-premium img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.75;
          transition: opacity 0.4s ease, transform 0.4s ease;
        }

        /* Gold Tag Label fixed securely at base */
        .hrc-swatch-badge {
          position: absolute;
          bottom: -20px;
          left: 0;
          right: 0;
          height: 18px;
          background: linear-gradient(135deg, #E6C262 0%, #B88E2F 100%); /* Liquid Satin Gold Badge */
          color: #241A03; /* High Contrast Dark Bronze text */
          font-size: 8px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          letter-spacing: 0.1em;
          transition: bottom 0.35s cubic-bezier(0.25, 1, 0.33, 1);
        }

        /* Hover: Extrude up along Z-axis while staying completely flat to avoid click loss */
        .hrc-swatch-premium:hover {
          border-color: #B88E2F;
          transform: translateZ(10px);
          box-shadow: 0 6px 16px rgba(184, 142, 47, 0.15);
        }

        .hrc-swatch-premium:hover img {
          opacity: 1;
          transform: scale(1.05);
        }

        .hrc-swatch-premium:hover .hrc-swatch-badge {
          bottom: 0;
        }

        /* Selected Luxury State Tracking */
        .hrc-swatch-premium.selected {
          border-color: #D4AF37;
          box-shadow: 0 8px 24px rgba(212, 175, 55, 0.35);
          transform: translateZ(15px);
          background: #FFF9E6;
        }

        .hrc-swatch-premium.selected img {
          opacity: 1;
        }

        .hrc-swatch-premium.selected .hrc-swatch-badge {
          bottom: 0;
          background: linear-gradient(135deg, #FFFFFF 0%, #FFF2CC 100%); /* Radiant White-Gold Highlight */
          color: #5C4A26;
          border-top: 1px solid #E6C262;
        }
        
        /* ── Special Fluid Expansion Action Buttons ── */
        .hrc-luxury-btn {
          position: relative;
          height: 35px;
          background: #FAEDC8; /* Soft Amber-Cream Matte Base */
          border: 1px solid #D6C394;
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.33, 1);
        }

        /* Glaze layer overlay background slide effect */
        .hrc-btn-glaze {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #E6DCBA 0%, #DBC995 100%); /* Shimmering Champagne Silk Slide */
          transform: translateX(-100%);
          transition: transform 0.4s cubic-bezier(0.25, 1, 0.33, 1);
          z-index: 1;
        }

        .hrc-btn-text {
          position: relative;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #7A6535; /* Crisp Medium Bronze-Gold text */
          z-index: 2;
          transition: color 0.3s ease;
        }

        .hrc-luxury-btn:hover .hrc-btn-glaze {
          transform: translateX(0);
        }

        .hrc-luxury-btn:hover .hrc-btn-text {
          color: #3D3012;
        }

        /* Active Enabled State Configurations */
        .hrc-luxury-btn.active {
          border-color: #C9A245;
          background: #FFF7DB;
          box-shadow: 0 4px 20px rgba(212, 175, 55, 0.25);
        }

        .hrc-luxury-btn.active .hrc-btn-glaze {
          transform: translateX(0);
          background: linear-gradient(135deg, #E6C262 0%, #B88E2F 100%); /* True Metallic Gold Solidification */
        }

        .hrc-luxury-btn.active .hrc-btn-text {
          color: #FFFFFF; /* High Bright Contrast */
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(41, 32, 11, 0.3);
        }

        /* Clear Mode Color Mapping Override */
        .hrc-luxury-btn.clear-btn.active .hrc-btn-glaze {
          background: linear-gradient(135deg, #B83C3A 0%, #7A1D1B 100%); /* Rich Crimson Velvet Reset Accent */
        }
        
        .hrc-luxury-btn.clear-btn.active .hrc-btn-text {
          color: #ffffff;
          text-shadow: none;
        }

        .hrc-apply-btn {
          padding: 8px 20px;
          background: transparent;
          border: 1px solid #B88E2F;
          font-family: 'Jost', sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #8F722C;
          cursor: pointer;
          border-radius: 3px;
          transition: all 0.3s;
        }
        .hrc-apply-btn:hover {
          background: linear-gradient(135deg, #E6C262 0%, #B88E2F 100%);
          border-color: #B88E2F;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(184, 142, 47, 0.2);
        }
      `}</style>

      <div className="hrc-root">
        {/* Header */}
        <div className="hrc-header">
          <div className="hrc-header-title">HANDRAIL CONFIGURATOR</div>
          <div style={{
            fontSize: 9,
            letterSpacing: '0.25em',
            color: '#d4a843',
            textTransform: 'uppercase',
            fontWeight: 500
          }}>
            Premium Finishes
          </div>
        </div>

        {/* Preview Area (GSAP Controlled Drop Height) */}
        <div ref={previewContainerRef} className="hrc-preview">
          {previewUrl && (
            <>
              <img src={previewUrl} alt={`Handrail ${selectedHandrail}`} className="hrc-preview-img" />
              <div className="hrc-preview-overlay">
                <div className="hrc-preview-name">
                  EXTERIOR PROFILE OPTION 0{selectedHandrail}
                </div>
                <div style={{ marginTop: '12px' }}>
                  <button className="hrc-apply-btn" onClick={() => {}}>
                    CONFIRM LAYER
                  </button>
                </div>
              </div>
              <button 
                className="absolute top-4 right-4 w-8 h-8 bg-black/60 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-all border border-[#332a15]"
                onClick={() => { setPreviewUrl(null); setSelectedHandrail(null); }}
              >
                <IoClose size={16} />
              </button>
            </>
          )}
        </div>

        {/* Scrollable Content Workspace */}
        <div className="hrc-content">
          <div className="hrc-section-label">
            <span>MAIN ARCHITECTURE LAYER</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <RingLoader color="#d4a843" size={45} />
              <p className="mt-5 text-[10px] tracking-[0.3em] text-[#8a8680] font-light">COMPILING TEXTURE SWATCHES</p>
            </div>
          ) : (
            <div className="hrc-grid">
              {thumbnails.map((item) => (
                <div
                  key={item.num}
                  className={`hrc-swatch-premium ${selectedHandrail === item.num ? "selected" : ""}`}
                  onClick={() => handleMainSelect(item.num)}
                >
                  {/* Button artwork is the local image (loads instantly);
                      selection state and applyHandrail() above still use the real AWS item.num */}
                  <img src={getLocalHandrailImage(item.num)} alt={`Handrail ${item.num}`} />
                  <div className="hrc-swatch-badge">OPTION 0{item.num}</div>
                </div>
              ))}
            </div>
          )}

          {/* Sub Handrails Control Area */}
          <div className="hrc-section-label">
            <span>SECONDARY PERIMETER GUARD</span>
          </div>

          <div className="px-6 pb-14">
            <div className="grid grid-cols-2 gap-4">
              
              {/* Sub Handrails Toggle Slider */}
              <div 
                className={`hrc-luxury-btn ${subHandrailEnabled ? "active" : ""}`}
                onClick={toggleSubHandrail}
              >
                <div className="hrc-btn-glaze" />
                <div className="hrc-btn-text">BUMPER RAILS</div>
              </div>

              {/* None Dismiss Slider */}
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