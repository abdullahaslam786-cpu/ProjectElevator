import { useEffect, useState, useMemo } from "react";
import { IoClose, IoSearch } from "react-icons/io5";
import { FaStar } from "react-icons/fa";
import { RingLoader } from "react-spinners";
import { modelConfigs } from "../config/modelConfigs";

const modelToDesignMap = {
  "LEVELe-101": 1, "LEVELe-102": 2, "LEVELe-103": 3, "LEVELe-104": 4,
  "LEVELe-105": 5, "LEVELe-106": 6, "LEVELe-107": 7, "LEVELe-108": 8,
  "LEVELr-201": 9, "LEVELr-202": 10, "LEVELr-203": 11, "LEVELr-204": 12,
  "LEVELr-205": 13, "LEVELc-301": 14, "LEVELc-302": 15,
};

// const modelToDesignMap = {
//   "ELX-1101": 1, "ELX-1102": 2, "ELX-1103": 3, "ELX-1104": 4,
//   "ELX-1105": 5, "ELX-1106": 6, "ELX-1107": 7, "ELX-1108": 8,
//   "RLX-2201": 9, "RLX-2202": 10, "RLX-2203": 11, "RLX-2204": 12,
//   "RLX-2205": 13, "CLX-3301": 14, "CLX-3302": 15,
// };


const specialConfig = {
  1: { E: "golden", F: "silver" },
  2: { D: "golden", E: "silver" },
  3: { D: "golden", E: "silver" },
  4: { D: "golden", E: "silver" },
  5: { D: "golden", E: "silver" },
  6: { D: "golden", E: "silver" },
  7: { E: "golden", F: "silver" },
  8: { F: "golden", G: "silver" },
  9: { E: "golden", F: "silver" },
  10: { E: "golden", F: "silver" },
  11: { F: "golden", G: "silver" },
  12: { C: "golden", D: "silver" },
  13: { C: "golden", D: "silver" },
  14: { D: "golden", E: "silver" },
  15: { C: "golden", D: "silver" },
};

const WallpanelController = ({
  activeZone,
  setActiveZone,
  selectedPanels,
  togglePanel,
  applyMaterial,
  selectedModelId,
  setSelectedPanels,
  onDesignLoad,
}) => {
  const config = modelConfigs[selectedModelId];
  if (!selectedModelId || !config || !config.panelMap) {
    onDesignLoad?.(false);
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm tracking-widest uppercase">
        <div className="w-8 h-px bg-gray-300 mb-4" />
        Select a model to begin
        <div className="w-8 h-px bg-gray-300 mt-4" />
      </div>
    );
  }

  const designNum = modelToDesignMap[selectedModelId] || 1;
  const designFolder = `DESIGN ${designNum}`;
  const isSpecialZone = !!specialConfig[designNum]?.[activeZone];
  const zoneType = specialConfig[designNum]?.[activeZone];

  const isGoldenZone = zoneType === "golden";
  const isSilverZone = zoneType === "silver";

  const zonePanelCounts = {};
  Object.keys(config.panelMap).forEach((zone) => {
    zonePanelCounts[zone] = config.panelMap[zone].length;
  });

  const availableZones = Object.keys(zonePanelCounts).sort();
  const panelCount = zonePanelCounts[activeZone] || 0;

  const [materials, setMaterials] = useState([]);
  const [designImages, setDesignImages] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewKey, setPreviewKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Reset
  useEffect(() => {
    setSelectedPanels({ A: [], B: [], C: [], D: [], E: [], F: [], G: [] });
    setActiveZone(availableZones[0] || "A");
    setPreviewUrl(null);
    setPreviewKey(null);
    setSearchTerm("");
  }, [selectedModelId]);

  // Auto-select
  useEffect(() => {
    if (!activeZone || panelCount === 0) return;
    setSelectedPanels((prev) => {
      if ((prev[activeZone] || []).length === 0) {
        const allPanels = Array.from({ length: panelCount }, (_, i) => i + 1);
        return { ...prev, [activeZone]: allPanels };
      }
      return prev;
    });
  }, [activeZone, panelCount, setSelectedPanels]);

  // Load Materials
  useEffect(() => {
    const loadMaterials = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/images-by-prefix?prefix=MATERIALS-SELECT");
        const data = await res.json();
        const materialSet = new Map();
        data.forEach((item) => {
          const match = item.key.match(/MATERIALS-SELECT\/(GAF-\d{3})\//i);
          if (match) {
            const label = match[1];
            if (!materialSet.has(label)) {
              materialSet.set(label, { key: item.key, url: item.url, label });
            }
          }
        });
        setMaterials(Array.from(materialSet.values()));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadMaterials();
  }, []);

  // Load Design Images
  useEffect(() => {
    const loadCurrentDesign = async () => {
      onDesignLoad?.(true);
      try {
        const res = await fetch(`/api/design-images?designNum=${designNum}`);
        const data = await res.json();
        setDesignImages(data);
      } catch (err) {
        console.error(err);
      } finally {
        onDesignLoad?.(false);
      }
    };
    loadCurrentDesign();
  }, [designNum, onDesignLoad]);

  const filteredMaterials = useMemo(() => {
    if (!searchTerm.trim()) return materials;
    return materials.filter((item) =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [materials, searchTerm]);

  const handleThumbnailClick = (item) => {
    setPreviewUrl(item.url);
    setPreviewKey(item.key);
  };

  // Golden zone handler
  const handleSpecialClick = (type) => {
    const folder = type === "golden" ? "goldenLayers" : "blackLayers";
    const keyPrefix = `SubMaterial/Layers/${folder}`;
    const previewFullUrl = `https://project-elevator-2026.s3.eu-north-1.amazonaws.com/${keyPrefix}/V1/1.png`;
    setPreviewKey(keyPrefix);
    setPreviewUrl(previewFullUrl);
  };

  // Silver zone handler
  const handleSilverZoneClick = (type) => {
    const revealFolder = type === "black" ? "blackReveals" : "silverReveals";
    const keyPrefix = `SubMaterial/Reveals/${revealFolder}/${designFolder}`;
    const previewFullUrl = `https://project-elevator-2026.s3.eu-north-1.amazonaws.com/${keyPrefix}/V1/1.png`;
    setPreviewKey(keyPrefix);
    setPreviewUrl(previewFullUrl);
  };

  // Apply
  const handleApply = () => {
    const selected = selectedPanels[activeZone] || [];
    if (!previewKey || selected.length === 0) {
      alert("Please select at least one panel and one option!");
      return;
    }

    if (previewKey.includes("blackLayers") || previewKey.includes("goldenLayers")) {
      applyMaterial(activeZone, selected, { keyPrefix: previewKey, isSpecialLayer: true });
      return;
    }

    if (previewKey.includes("Reveals")) {
      applyMaterial(activeZone, selected, { keyPrefix: previewKey, isSpecialLayer: true });
      return;
    }

    const gafMatch = previewKey.match(/GAF-(\d{3})/);
    if (gafMatch) {
      const gaf = `GAF-${gafMatch[1]}`;
      let applyUrl = previewUrl;
      let keyPrefix = previewKey.replace(/\/[^/]+\.png$/, "");

      const possiblePaths = [
        `Designs/${designFolder}/${gaf}/V2/7.png`,
        `Designs/${designFolder}/${gaf}/V2/1.png`,
        `Designs/${designFolder}/${gaf}/V1/1.png`,
      ];

      for (const path of possiblePaths) {
        const found = designImages.find((img) => img.key.endsWith(path) || img.key === path);
        if (found) {
          applyUrl = found.url;
          keyPrefix = found.key.replace(/\/V[1-3]\/.*\.png$/, "");
          break;
        }
      }
      applyMaterial(activeZone, selected, { keyPrefix, url: applyUrl });
    }
  };

  return (
    <>
  <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght=300;400;500&family=Jost:wght=200;300;400;500&display=swap');

        .wpc-root {
          font-family: 'Jost', sans-serif;
          color: #4A3B1B; /* Rich Deep Bronze/Gold text */
          background: linear-gradient(180deg, #FFFDF9, #FAF3E0); /* Soft Champagne / Light Golden Veil */
          min-height: 100%;
        }

        /* ── Header strip ── */
        .wpc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 20px;
          background: linear-gradient(180deg, #3A2E14 0%, #251D0C 100%); /* Deep Metallic Gold-Black */
          color: #F3E5AB; /* Soft Muted Gold Text */
          border-bottom: 1px solid #8C7335; /* Polished Gold Divider */
        }
        .wpc-header-model {
          font-family: 'Cormorant Garamond', serif;
          font-size: 12px;
          font-weight: 300;
          letter-spacing: 0.12em;
        }
        .wpc-header-zone {
          font-size: 8px;
          font-weight: 300;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #D4AF37; /* Bright Metallic Gold Accent */
        }

        /* ── Zone rail ── */
        .wpc-zone-rail {
          display: flex;
          gap: 6px;
          background: linear-gradient(180deg, #4A3B1B, #2D240F); /* Deep Gold Tinted Base */
          padding: 6px 20px;
          border-bottom: 1px solid #8C7335;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .wpc-zone-rail::-webkit-scrollbar { display: none; }

        /* Real 3D Cube Container Setup */
        .cube-wrap {
          perspective: 1000px;
          perspective-origin: 50% 50%;
          flex: 1;
          min-width: 50px;
          height: 30px;
         }

        .cube {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          cursor: pointer;
          background: transparent;
          border: none;
          padding: 0;
          transform: scaleX(1) scaleY(1) scaleZ(1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateX(0px) translateY(0px) translateZ(0px) skewX(0deg) skewY(0deg);
        }

        /* 3D Cube Faces */
        .cube .face {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          text-transform: uppercase;
          backface-visibility: hidden;
          border-radius: 4px;
        }

        /* Zone Buttons Front/Bottom styling */
        .wpc-zone-cube .face.front {
          background: linear-gradient(180deg, #705B29, #4A3B1B); /* Matte Gold-Bronze Base */
          color: #FFF2CC; /* Liquid Light Gold Text */
          border: 1px solid #AA8F4A; /* Brushed Gold Frame */
          transform: translateZ(20px);
        }

        .wpc-zone-cube .face.bottom {
          background: linear-gradient(135deg, #FFF1C5, #D4AF37, #8C7335); /* Pure Gold Metallic Spectrum */
          color: #1F190A; /* Deep Charcoal Contrast text */
          font-weight: 600;
          transform: rotateX(-90deg) translateZ(9px);
        }

        /* Dynamic Hover/Active transformations */
        .cube-wrap:hover .cube {
          transform: rotateX(35deg);
        }

        .cube-wrap.active .cube {
          transform: rotateX(90deg);
        }

        /* ── Panel Row & 3D Panel Cubes ── */
        .wpc-panel-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 20px;
          background: #F4EED4; /* Muted Champagne Cream */
          border-bottom: 1px solid #D0C39A; /* Soft Warm Gold Border */
          flex-wrap: wrap;
        }
        .wpc-panel-label {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #937A3E; /* Golden Ochre Text */
          margin-right: 4px;
          white-space: nowrap;
        }

        .panel-cube-wrap {
          perspective: 1000px;
          perspective-origin: 50% 50%;
          width: 26px;
          height: 26px;
        }

        /* Panel Cube Front/Bottom Faces */
        .wpc-panel-cube .face.front {
          background: linear-gradient(180deg, #5A4822, #4A3B1B); /* Dense Gold Core */
          color: #F7E7B4; /* Warm Cream Text */
          border: 1px solid #BA9E59; /* Soft Metallic Border */
          font-weight: 500;
          transform: translateZ(20px);
        }

        .wpc-panel-cube .face.bottom {
          background: linear-gradient(135deg, #FFFFFF, #E6CA73, #A6873B); /* Shimmering Light Gold */
          color: #4A3B1B;
          font-weight: 700;
          transform: rotateX(-90deg) translateZ(9px);
          box-shadow: inset 0 0 8px rgba(0,0,0,0.12);
        }

        .panel-cube-wrap:hover .wpc-panel-cube {
          transform: rotateX(30deg);
        }

        .panel-cube-wrap.active .wpc-panel-cube {
          transform: rotateX(90deg);
        }

        /* ── Advanced Luxury Search bar ── */
        .wpc-search {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 24px;
          height: 38px;
          background: linear-gradient(90deg, #4A3B1B, #5A4822); /* Radiant Bronze-Gold Bar */
          border-bottom: 1px solid #8C7335;
          position: relative;
          transition: background 0.3s ease;
        }
        .wpc-search::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, #E6CA73, transparent);
          transform: scaleX(0);
          transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .wpc-search:focus-within::after {
          transform: scaleX(1);
        }
        .wpc-search input {
          flex: 1;
          border: none;
          outline: none;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #FFF9E6;
          background: transparent;
        }
        .wpc-search input::placeholder { 
          color: #C2B085; /* Pale Gold Placeholder */
          transition: color 0.3s ease;
        }
        .wpc-search input:focus::placeholder {
          color: #FFF9E6;
        }
        .wpc-search-icon { 
          color: #D4AF37; 
          flex-shrink: 0; 
          filter: drop-shadow(0 0 4px rgba(212, 175, 55, 0.3));
        }
        .wpc-search-divider {
          width: 1px;
          height: 16px;
          background: #705B29;
        }
        .wpc-search-action {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.15em;
          color: #E6CA73;
          cursor: pointer;
          padding: 4px 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          border-radius: 20px;
          background: #5A4822;
          border: 1px solid #8C7335;
          transition: all 0.3s ease;
        }
        .wpc-search-action:hover {
          color: #FFFFFF;
          border-color: #D4AF37;
          background: #705B29;
        }

        /* ── Immersive Architectural Preview area ── */
        .wpc-preview {
          position: relative;
          overflow: hidden;
          transition: height 0.5s cubic-bezier(0.3, 1, 0.2, 1);
          background: #251D0C; /* Golden Midnight Dark Base */
          border-bottom: 0px solid #8C7335;
        }
        .wpc-preview[style*="height: 120px"] {
          border-bottom: 1px solid #8C7335;
        }
        .wpc-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.6);
          transform-origin: center;
        
          filter: sepia(0.3) saturate(1.1) brightness(0.9);
          transition: transform 8s cubic-bezier(0.1, 1, 0.1, 1);
        }
        .wpc-preview:hover .wpc-preview-img {
          transform: scale(1.8);
        }
        .wpc-preview-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 20px 24px;
        }
        .wpc-preview-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 300;
          color: #FFF9E6;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          text-shadow: 0 2px 10px rgba(25,20,10,0.7);
        }
        .wpc-preview-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .wpc-apply-btn {
          padding: 8px 28px;
          background: linear-gradient(135deg, #BA9E59, #D4AF37, #FFF1C5); /* Bright reflective gold mix */
          border: none;
          font-family: 'Jost', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #251D0C; /* High contrast text */
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.25);
          clip-path: polygon(0 0, 92% 0, 100% 100%, 8% 100%);
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .wpc-apply-btn:hover { 
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 241, 197, 0.45);
          background: linear-gradient(135deg, #FFF1C5, #FFFFFF, #FFEAA7); /* Full Golden Glow */
        }
        .wpc-close-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 32px;
          height: 32px;
          background: rgba(37,29,12,0.6);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #E6CA73;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .wpc-close-btn:hover {
          background: #8C7335;
          color: #251D0C;
          border-color: #8C7335;
          transform: rotate(90deg);
        }

        /* ── Scrollable content ── */
        .wpc-content {
          height: 390px;
          overflow-y: auto;
          background: linear-gradient(180deg, #FFFDF9, #FAF3E0);
          scrollbar-width: thin;
          scrollbar-color: #D0C39A #FAF3E0;
        }
        .wpc-content::-webkit-scrollbar { width: 4px; }
        .wpc-content::-webkit-scrollbar-track { background: #FAF3E0; }
        .wpc-content::-webkit-scrollbar-thumb { background: #D0C39A; border-radius: 2px; }

        /* ── Section label ── */
        .wpc-section-label {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 20px 4px;
        }
        .wpc-section-label span {
          font-size: 9px;
          font-weight: 400;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #AA945B;
          white-space: nowrap;
        }
        .wpc-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #E6DCBA;
        }

        /* ── 3D Material Grid & Swatches ── */
        .wpc-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 8px; 
          padding: 6px 20px;
        }

        .swatch-wrap {
          perspective: 510px;
          perspective-origin-x: -20%;
          perspective-origin-y: 90%;
          aspect-ratio: 1;
          cursor: pointer;
        }

        .swatch-cube {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
          transform: scaleX(1) scaleY(1) scaleZ(1) rotateX(0deg) rotateY(0deg) translateZ(2px);
        }

        .swatch-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          border-radius: 6px;
        }

        .swatch-front {
          background: #5A4822; /* Medium Gold Frame */
          z-index: 2;
          transform: translateZ(0px);
        }

        .swatch-image-container {
          position: absolute;
          inset: 4px; 
          border-radius: 4px;
          overflow: hidden;
          background: #251D0C;
        }

        .swatch-image-container img {
          width: 100%;
          height: 160%;
          object-fit: cover;
          transform: scale(2.5);
          transform-origin: center;
          transition: transform 0.4s ease;
        }

        .swatch-gradient-border {
          position: absolute;
          inset: 0;
          border-radius: 6px;
          padding: 4px; 
          background: linear-gradient(135deg, #D0C39A, #AA8F4A, #705B29); /* Shimmer Frame */
          pointer-events: none;
          transition: background 0.4s ease;
        }

        .swatch-depth {
          background: #4A3B1B;
          transform: rotateY(90deg) translateZ(-6px);
          width: 12px;
          height: 100%;
          left: 0;
          z-index: 1;
          border-left: 1px solid #705B29;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        /* Active Hover Interaction */
        .swatch-wrap:hover .swatch-cube {
          transform: scaleX(1.02) scaleY(1.02) scaleZ(1.02) rotateX(4deg) rotateY(-4deg) translateZ(10px);
        }

        .swatch-wrap:hover .swatch-image-container img {
          transform: scale(2.6);
        }

        /* Selected State */
        .swatch-wrap.selected .swatch-cube {
          transform: scaleX(1.05) scaleY(1.05) scaleZ(1.05) rotateX(0deg) rotateY(0deg) translateZ(35px);
        }

        .swatch-wrap.selected .swatch-gradient-border {
          background: linear-gradient(135deg, #FFF1C5, #D4AF37, #FFFFFF); /* High Intensity Gold Selection */
          box-shadow: 0 20px 40px rgba(112, 91, 41, 0.3);
        }

        .swatch-wrap.selected .swatch-depth {
          opacity: 1;
          background: linear-gradient(to bottom, #AA8F4A, #4A3B1B);
        }

        /* ── Premium 3D Special zone cards ── */
        .wpc-special-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          padding: 12px 20px 24px;
        }
        .wpc-special-card-wrap {
          perspective: 600px;
          perspective-origin: 50% 50%;
          aspect-ratio: 1.8;
          cursor: pointer;
        }
        .wpc-special-card-cube {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
          transform: translateZ(2px);
        }
        .wpc-special-card-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .wpc-special-card-front {
          z-index: 2;
          transform: translateZ(0px);
          border: 1px solid #705B29; 
          background: linear-gradient(180deg, #5A4822, #4A3B1B); /* Matte Gold Foil back */
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
          color: #E6CA73;
        }
        .wpc-special-card-depth {
          transform: rotateX(-90deg) translateZ(-6px);
          height: 12px;
          width: 100%;
          bottom: 0;
          z-index: 1;
          opacity: 0;
          transition: opacity 0.4s ease;
          background: #4A3B1B;
        }
        
        /* Special Card Hover States */
        .wpc-special-card-wrap:hover .wpc-special-card-cube {
          transform: scale(1.02) rotateX(8deg) translateZ(12px);
        }
        
        /* Special Card Selected States */
        .wpc-special-card-wrap.selected .wpc-special-card-cube {
          transform: scale(1.04) rotateX(0deg) translateZ(28px);
        }
        .wpc-special-card-wrap.selected .wpc-special-card-front {
          border-color: #D4AF37; /* Polished bright border frame */
          box-shadow: 0 18px 40px rgba(90, 72, 34, 0.35);
          color: #FFF9E6;
        }
        .wpc-special-card-wrap.selected .wpc-special-card-depth {
          opacity: 1;
        }

        .wpc-special-card-label {
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          position: relative;
          z-index: 1;
        }
        .wpc-special-card-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.8;
          position: relative;
          z-index: 1;
          box-shadow: 0 0 8px currentColor;
        }
      `}</style>

      <div className="wpc-root">

        {/* ── Header ── */}
        <div className="wpc-header">
          <div className="flex items-center justify-center gap-6">
            <div className="wpc-header-model">{selectedModelId}</div>
            <div className="wpc-header-zone" style={{ marginTop: 2 }}>
              Zone {activeZone} &nbsp;·&nbsp; Design Selection
            </div>
          </div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 11,
            letterSpacing: '0.2em',
            color: '#c9a96e',
            textTransform: 'uppercase',
          }}>
            {isSpecialZone ? (isGoldenZone ? 'Accent' : 'Reveal') : 'Surface'}
          </div>
        </div>

        {/* ── Zone rail (3D Cubes) ── */}
        <div className="wpc-zone-rail">
          {availableZones.map((zone) => (
            <div 
              key={zone} 
              className={`cube-wrap ${activeZone === zone ? "active" : ""}`}
            >
              <button
                onClick={() => setActiveZone(zone)}
                className="cube wpc-zone-cube"
              >
                <div className="face front">
                  {zone}
                  {specialConfig[designNum]?.[zone] && (
                    <span style={{
                      position: 'absolute',
                      bottom: 4,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: specialConfig[designNum][zone] === 'golden' ? '#c9a96e' : '#a8a8a8',
                    }} />
                  )}
                </div>
                <div className="face bottom">{zone}</div>
              </button>
            </div>
          ))}
        </div>

        {/* ── Panel selector (3D Cubes) ── */}
        <div className="wpc-panel-row">
          <span className="wpc-panel-label">Panels</span>
          {panelCount > 0
            ? Array.from({ length: panelCount }).map((_, i) => {
                const num = i + 1;
                const isSelected = selectedPanels[activeZone]?.includes(num);
                return (
                  <div 
                    key={num} 
                    className={`panel-cube-wrap ${isSelected ? "active" : ""}`}
                  >
                    <button
                      onClick={() => togglePanel(activeZone, num)}
                      className="cube wpc-panel-cube"
                    >
                      <div className="face front">{num}</div>
                      <div className="face bottom">{num}</div>
                    </button>
                  </div>
                );
              })
            : null}
        </div>

        {/* ── Search bar (normal zones only) ── */}
        {!isSpecialZone && (
          <div className="wpc-search">
            <IoSearch size={15} className="wpc-search-icon" />
            <input
              type="text"
              placeholder="Search finishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="wpc-search-divider" />
            <div className="wpc-search-action">
              <span>F+S</span>
              <FaStar size={9} />
            </div>
          </div>
        )}

        {/* ── Preview area ── */}
        <div className="wpc-preview" style={{ height: previewUrl ? '180px' : '0px' }}>
          {previewUrl && (
            <>
              <img src={previewUrl} alt="Preview" className="wpc-preview-img" />
              <div className="wpc-preview-overlay">
                <div className="wpc-preview-name">
                  {previewKey
                    ? (previewKey.match(/GAF-\d{3}/i)?.[0] ?? 'Design Selected')
                    : 'Design Selected'}
                </div>
                <div className="wpc-preview-actions">
                  <div style={{ fontSize: 12, letterSpacing: '0.2em', color: 'grey', textTransform: 'uppercase' }}>
                    Zone {activeZone} · {(selectedPanels[activeZone] || []).length} panel(s)
                  </div>
                  <button className="wpc-apply-btn" onClick={handleApply}>
                    Apply
                  </button>
                </div>
              </div>
              <button className="wpc-close-btn" onClick={() => { setPreviewUrl(null); setPreviewKey(null); }}>
                <IoClose size={14} />
              </button>
            </>
          )}
        </div>

        {/* ── Scrollable content area ── */}
        <div className="wpc-content">

          {/* Section label */}
          <div className="wpc-section-label">
            <span>
              {isGoldenZone ? 'Accent Finishes' : isSilverZone ? 'Reveal Finishes' : 'Surface Finishes'}
            </span>
          </div>

          {/* ── GOLDEN ZONE: Black + Golden ── */}
          {isGoldenZone && (
            <div className="wpc-special-grid">
              <div
                className={`wpc-special-card-wrap ${previewKey?.includes("blackLayers") ? "selected" : ""}`}
                onClick={() => handleSpecialClick("black")}
              >
                <div className="wpc-special-card-cube">
                  <div className="wpc-special-card-face wpc-special-card-front" style={{ background: '#111111', color: '#e8e4de' }}>
                    <div className="wpc-special-card-dot" />
                    <div className="wpc-special-card-label">Black Base</div>
                  </div>
                  <div className="wpc-special-card-face wpc-special-card-depth" style={{ background: '#0a0a0a', borderTop: '1px solid #2d2824' }} />
                </div>
              </div>
              
              <div
                className={`wpc-special-card-wrap ${previewKey?.includes("goldenLayers") ? "selected" : ""}`}
                onClick={() => handleSpecialClick("golden")}
              >
                <div className="wpc-special-card-cube">
                  <div className="wpc-special-card-face wpc-special-card-front" style={{ 
                    background: 'linear-gradient(135deg, #1f180c 0%, #3a2e14 100%)', 
                    color: '#f5d98a',
                    border: '1px solid #4a3b19'
                  }}>
                    <div className="wpc-special-card-dot" style={{ color: '#d4a843' }} />
                    <div className="wpc-special-card-label">Golden Accent</div>
                  </div>
                  <div className="wpc-special-card-face wpc-special-card-depth" style={{ background: '#1c1405' }} />
                </div>
              </div>
            </div>
          )}

          {/* ── SILVER ZONE: Black + Silver ── */}
          {isSilverZone && (
            <div className="wpc-special-grid">
              <div
                className={`wpc-special-card-wrap ${previewKey?.includes("blackReveals") ? "selected" : ""}`}
                onClick={() => handleSilverZoneClick("black")}
              >
                <div className="wpc-special-card-cube">
                  <div className="wpc-special-card-face wpc-special-card-front" style={{ background: '#111111', color: '#e8e4de' }}>
                    <div className="wpc-special-card-dot" />
                    <div className="wpc-special-card-label">Black Reveal</div>
                  </div>
                  <div className="wpc-special-card-face wpc-special-card-depth" style={{ background: '#0a0a0a', borderTop: '1px solid #2d2824' }} />
                </div>
              </div>

              <div
                className={`wpc-special-card-wrap ${previewKey?.includes("silverReveals") ? "selected" : ""}`}
                onClick={() => handleSilverZoneClick("silver")}
              >
                <div className="wpc-special-card-cube">
                  <div className="wpc-special-card-face wpc-special-card-front" style={{ 
                    background: 'linear-gradient(135deg, #1c1d1f 0%, #2c2e30 100%)', 
                    color: '#e0e0e0',
                    border: '1px solid #3d4042'
                  }}>
                    <div className="wpc-special-card-dot" style={{ color: '#c0c0c0' }} />
                    <div className="wpc-special-card-label">Silver Reveal</div>
                  </div>
                  <div className="wpc-special-card-face wpc-special-card-depth" style={{ background: '#121314' }} />
                </div>
              </div>
            </div>
          )}

          {/* ── NORMAL ZONES: material grid ── */}
          {!isSpecialZone && (
            loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
                <RingLoader color="#c9a96e" size={36} />
                <div style={{ marginTop: 12, fontSize: 10, letterSpacing: '0.2em', color: '#9a9590', textTransform: 'uppercase' }}>
                  Loading finishes
                </div>
              </div>
            ) : (
              <div className="wpc-grid">
                {filteredMaterials.map((item) => {
                  const isSelected = previewUrl === item.url;
                  
                  return (
                    <div 
                      key={item.key}
                      className={`swatch-wrap ${isSelected ? "selected" : ""}`}
                      onClick={() => handleThumbnailClick(item)}
                    >
                      <div className="swatch-cube">
                        {/* Front Face */}
                        <div className="swatch-face swatch-front">
                          <div className="swatch-gradient-border" />
                          <div className="swatch-image-container">
                            <img src={item.url} alt={item.label} />
                          </div>
                        </div>
                        {/* 3D Depth Extrusion */}
                        <div className="swatch-face swatch-depth" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

      </div>
    </>
  );
};

export default WallpanelController;