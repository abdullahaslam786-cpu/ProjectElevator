import React, { useEffect, useState, useCallback } from "react";
import { IoClose, IoCheckmark } from "react-icons/io5";
import { RingLoader } from "react-spinners";

const pad = (n) => String(n).padStart(2, "0");

const FloorController = ({ applyFloor }) => {
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [floorThumbnails, setFloorThumbnails] = useState([]);
  const [floorPreviewUrl, setFloorPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);

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
        const res = await fetch("/api/images-by-prefix?prefix=SubMaterial/floor");
        const floorData = await res.json();

        // Process the list so we know which floor numbers exist
        const thumbs = processImages(
          floorData.filter((i) => i.key.includes("/V1/"))
        );

        // ── Override every image URL to point to local public/floor/ ──
        const localThumbs = thumbs.map((item) => ({
          ...item,
          url: `/floor/${item.num}.png`, // ← local image
        }));

        setFloorThumbnails(localThumbs);

        // Auto-select first floor + open preview
        if (localThumbs.length > 0) {
          const first = localThumbs[0];
          setSelectedFloor(first.num);
          applyFloor(first.num);
          setFloorPreviewUrl(`/floor/${first.num}.png`); // ← local preview
        }
      } catch (err) {
        console.error("Fetch error:", err);

        // Fallback: hard-code 1-10 if API fails
        const fallback = Array.from({ length: 10 }, (_, i) => ({
          num: i + 1,
          url: `/floor/${i + 1}.png`,
        }));
        setFloorThumbnails(fallback);

        if (fallback.length > 0) {
          setSelectedFloor(1);
          applyFloor(1);
          setFloorPreviewUrl(`/floor/1.png`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [processImages, applyFloor]);

  const handleFloorSelect = (num) => {
    setSelectedFloor(num);
    applyFloor(num);
    // Always use the local image for the preview
    setFloorPreviewUrl(`/floor/${num}.png`);
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
          color: #5C4A26;
          background: linear-gradient(180deg, #FFFDF8, #F7F1E4);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .flc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 24px;
          background: #FFFFFF;
          border-bottom: 1px solid #EADFC8;
          flex-shrink: 0;
        }

        .flc-header-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.15em;
          color: #4A3826;
        }

        /* ── Preview banner (matches handrail) ── */
        .flc-preview {
          position: relative;
          overflow: hidden;
          background: #F7F1E4;
          height: 0;
          flex-shrink: 0;
          transition: height 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .flc-preview.flc-preview-open {
          height: 250px;
        }

        .flc-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .flc-preview-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(74,56,38,0.85) 0%, transparent 55%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 20px;
        }

        .flc-preview-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 400;
          color: #FFFDF6;
          letter-spacing: 0.1em;
        }

        .flc-apply-btn {
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

        .flc-apply-btn:hover {
          background: linear-gradient(135deg, #E7A94C 0%, #C9974E 100%);
          border-color: #C9974E;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(184, 142, 47, 0.25);
        }

        .flc-preview-close {
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

        .flc-preview-close:hover {
          background: #FFFFFF;
          border-color: #C9974E;
        }

        /* ── Scroll area ── */
        .flc-content {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          background: linear-gradient(180deg, #FFFDF8, #F7F1E4);
          scrollbar-width: thin;
          scrollbar-color: #C9974E #F7F1E4;
        }

        .flc-section-label {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 14px;
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
          background: #EADFC8;
        }

        /* ── Option cards (matches handrail style cards) ── */
        .flc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
          gap: 12px;
          padding: 0 14px;
        }

        .flc-card {
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

        .flc-card-image-wrap {
          position: relative;
          aspect-ratio: 1;
          background: #FBF7EC;
        }

        .flc-card-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.92;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .flc-card-check {
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

        .flc-card-label {
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

        .flc-card:hover {
          border-color: #C9974E;
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(180, 140, 70, 0.18);
        }

        .flc-card:hover img {
          opacity: 1;
          transform: scale(1.03);
        }

        .flc-card.selected {
          border-color: #C9974E;
          box-shadow: 0 8px 20px rgba(201, 151, 78, 0.3);
        }

        .flc-card.selected img {
          opacity: 1;
        }

        .flc-card.selected .flc-card-label {
          background: linear-gradient(135deg, #F7ECD8 0%, #F0DEB8 100%);
          color: #5C4A26;
        }
      `}</style>

      <div className="flc-root">
        <div className="flc-header">
          <div className="flex flex-col">
            <div className="flc-header-title">FLOOR CONFIGURATOR</div>
            <div className="text-[11px] text-[#AA9154] tracking-[0.15em] font-light">
              Please select the floor to Enhance your Elevator floor.
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

        {/* Preview banner */}
        <div className={`flc-preview ${floorPreviewUrl ? "flc-preview-open" : ""}`}>
          {floorPreviewUrl && (
            <>
              <img src={floorPreviewUrl} alt="Preview" className="flc-preview-img" />
              <div className="flc-preview-overlay">
                <div className="flc-preview-name">
                  BASE OPTION {pad(selectedFloor ?? 0)}
                </div>
                <div style={{ marginTop: "12px" }}>
                  <button
                    className="flc-apply-btn"
                    onClick={() => setFloorPreviewUrl(null)}
                  >
                    CONFIRM LAYER
                  </button>
                </div>
              </div>
              <button className="flc-preview-close" onClick={handleClearPreview}>
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
              <RingLoader color="#C9974E" size={40} />
            </div>
          ) : (
            <div className="flc-grid">
              {floorThumbnails.map((item) => (
                <div
                  key={item.num}
                  className={`flc-card ${selectedFloor === item.num ? "selected" : ""}`}
                  onClick={() => handleFloorSelect(item.num)}
                >
                  <div className="flc-card-image-wrap">
                    {/* Local image from public/floor/ */}
                    <img src={`/floor/${item.num}.png`} alt={`Floor ${item.num}`} />
                    {selectedFloor === item.num && (
                      <div className="flc-card-check">
                        <IoCheckmark size={12} />
                      </div>
                    )}
                  </div>
                  <div className="flc-card-label">Base {pad(item.num)}</div>
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

export default FloorController;