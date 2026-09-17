import React, { useEffect, useState, useCallback } from "react";
import { IoClose } from "react-icons/io5";
import { RingLoader } from "react-spinners";

const FloorController = ({ applyFloor }) => {
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [floorThumbnails, setFloorThumbnails] = useState([]);
  const [allFloorImages, setAllFloorImages] = useState([]);
  const [floorPreviewUrl, setFloorPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Robust Image Processing Engine (same logic as CeilingController) ──
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
        const res = await fetch("/api/images-by-prefix?prefix=SubMaterial/floor");
        const floorData = await res.json();

        // Keep the full unfiltered list around so we can look up any /V1/{num}.png
        // for the preview panel, the same way CeilingController does.
        setAllFloorImages(floorData);
        setFloorThumbnails(processImages(floorData.filter((i) => i.key.includes("/V1/"))));
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [processImages]);

  const handleFloorSelect = (num) => {
    setSelectedFloor(num);
    applyFloor(num);

    const found = allFloorImages.find((img) => img.key.includes(`/V1/${num}.png`));
    if (found) setFloorPreviewUrl(found.url);
  };

  const handleClearPreview = () => {
    setFloorPreviewUrl(null);
    setSelectedFloor(null);
    applyFloor(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Jost:wght@200;300;400;500&display=swap');

        .flc-root {
          font-family: 'Jost', sans-serif;
          background: linear-gradient(180deg, #FFFDF6, #F7EFCF);
          color: #5C4A26;
          min-height: 100%;
        }

        .flc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 24px;
          background: linear-gradient(180deg, #423516 0%, #29200B 100%);
          border-bottom: 1px solid #C9A245;
        }

        .flc-header-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 12px;
          font-weight: 300;
          letter-spacing: 0.15em;
          color: #FFF3CD;
        }

        /* Pure-CSS reveal: no JS animation library involved, so the panel
           is guaranteed to appear the instant floorPreviewUrl is set. */
        .flc-preview {
          position: relative;
          overflow: hidden;
          background: #1F190A;
          max-height: 0;
          transition: max-height 0.45s ease;
        }

        .flc-preview.flc-preview-open {
          max-height: 260px;
        }

        .flc-preview-img {
          width: 100%;
          height: 200px;
          object-fit: contain;
          padding: 60px;
          opacity: 0.95;
          filter: sepia(0.15) saturate(1.05);
        }

        .flc-preview-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(41,32,11,0.95) 0%, transparent 60%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 20px;
        }

        .flc-content {
          height: 600px;
          overflow-y: auto;
          background: linear-gradient(180deg, #FFFDF6, #F7EFCF);
          scrollbar-width: thin;
          scrollbar-color: #D4AF37 #F7EFCF;
        }

        .flc-section-label {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 14px 6px 14px;
        }

        .flc-section-label span {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #AA9154;
        }

        .flc-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #E8D8A7;
        }

        .flc-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 4px;
          padding: 0px 24px 20px 20px;
        }

        .flc-swatch-wrap {
          position: relative;
          aspect-ratio: 1;
          cursor: pointer;
          perspective: 900px;
          margin-bottom: 22px;
        }

        .flc-swatch-item {
          width: 100%;
          height: 100%;
          background: #1F190A;
          border: 1px solid #D6C394;
          border-radius: 4px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.33, 1);
          transform-style: preserve-3d;
        }

        .flc-swatch-item img {
          width: 120%;
          height: 100%;
          padding-bottom: -20px;
          object-fit: center;
          opacity: 0.75;
          transition: opacity 0.3s;
        }

        .flc-swatch-badge {
          position: absolute;
          bottom: -20px;
          left: 0;
          right: 0;
          height: 18px;
          background: linear-gradient(135deg, #E6C262 0%, #B88E2F 100%);
          color: #241A03;
          font-size: 8px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: bottom 0.3s ease;
        }

        .flc-swatch-wrap:hover .flc-swatch-item {
          transform: translateZ(25px);
          border-color: #B88E2F;
          box-shadow: 0 6px 16px rgba(184, 142, 47, 0.15);
        }

        .flc-swatch-wrap:hover img {
          opacity: 1;
        }

        .flc-swatch-wrap:hover .flc-swatch-badge {
          bottom: 0;
        }

        .flc-swatch-wrap.selected .flc-swatch-item {
          border-color: #D4AF37;
          transform: translateZ(25px);
          box-shadow: 0 10px 24px rgba(184, 142, 47, 0.3);
          background: #FFF9E6;
        }

        .flc-swatch-wrap.selected .flc-swatch-badge {
          bottom: 0;
          background: linear-gradient(135deg, #FFFFFF 0%, #FFF2CC 100%);
          color: #5C4A26;
          border-top: 1px solid #E6C262;
        }

        .flc-swatch-wrap.selected img {
          opacity: 1;
        }
      `}</style>

      <div className="flc-root">
        <div className="flc-header">
          <div className="flc-header-title">FLOOR CONFIGURATOR</div>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "#d4a843", fontWeight: 600 }}>
            PREMIUM SERIES
          </div>
        </div>

        <div className={`flc-preview ${floorPreviewUrl ? "flc-preview-open" : ""}`}>
          {floorPreviewUrl && (
            <>
              <img src={floorPreviewUrl} alt="Preview" className="flc-preview-img" />
              <div className="flc-preview-overlay">
                <div style={{ fontFamily: 'Cormorant Garamond', fontSize: 16, color: '#d4a843' }}>
                  BASE OPTION 0{selectedFloor}
                </div>
              </div>
              <button
                className="absolute top-4 right-4 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center border border-[#332a15]"
                onClick={handleClearPreview}
              >
                <IoClose size={16} />
              </button>
            </>
          )}
        </div>

        <div className="flc-content">
          <div className="flc-section-label">
            <span>FLOORING FINISHES</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RingLoader color="#d4a843" size={40} />
            </div>
          ) : (
            <div className="flc-grid">
              {floorThumbnails.map((item) => (
                <div
                  key={item.num}
                  className={`flc-swatch-wrap ${selectedFloor === item.num ? "selected" : ""}`}
                  onClick={() => handleFloorSelect(item.num)}
                >
                  <div className="flc-swatch-item">
                    <img src={item.url} alt={`Floor ${item.num}`} />
                    <div className="flc-swatch-badge">BASE 0{item.num}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FloorController;