import React, { useState } from "react";

// Individual Unified Sub-Component
const DockedGoldButton = ({ children, isActive, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative px-8 py-4 bg-gradient-to-b from-[#211a19] to-[#14100f] text-[#dfb76c] font-sans text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 ease-out hover:text-white flex items-center justify-center gap-2 group select-none"
    >
      {/* 1. Top Faded/Rounded Border Shell */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#c29d59]/40 to-transparent" />
      <div className="absolute inset-0 rounded-t-[16px] pointer-events-none border-t border-x border-[#c29d59]/10 group-hover:border-[#c29d59]/30 transition-colors duration-300" />

      {/* 2. Top Inner Corner Rounding Mask (Faded Effect) */}
      <div className="absolute -inset-[1px] rounded-t-[16px] bg-gradient-to-b from-[#c29d59]/5 to-transparent -z-10 opacity-50 group-hover:opacity-100 blur-[4px] transition-opacity duration-300" />

      {/* 3. Radial Top Spotlight Flares */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(223,183,108,0.08),transparent_65%)] group-hover:bg-[radial-gradient(circle_at_50%_0%,rgba(223,183,108,0.2),transparent_55%)] transition-all duration-500" />

      {/* 4. Crisp Metallic Vertical Right/Left Side Walls */}
      <div className="absolute left-0 top-1/4 bottom-0 w-[1px] bg-gradient-to-b from-[#c29d59]/20 via-[#c29d59]/50 to-[#dfb76c]" />
      <div className="absolute right-0 top-1/4 bottom-0 w-[1px] bg-gradient-to-b from-[#c29d59]/20 via-[#c29d59]/50 to-[#dfb76c]" />

      {/* Active State Bottom Glow Injection */}
      {isActive && (
        <div className="absolute inset-x-4 bottom-0 h-[2px] bg-[#dfb76c] shadow-[0_-4px_10px_rgba(223,183,108,0.5)] z-20 animate-pulse" />
      )}

      {/* Content Label */}
      <span className="relative z-10 block transition-transform duration-300 group-hover:translate-y-[-1px]">
        {children}
      </span>

         <button
      role="button"
      onClick={onClick}
      className="group relative inline-block overflow-hidden border border-[#18181a] bg-white px-[18px] pb-[17px] pt-[18px] text-[15px] leading-[15px] text-[#18181a] cursor-pointer select-none touch-none no-underline
        after:content-[''] after:absolute after:-bottom-1/2 after:left-0 after:w-full after:h-full after:bg-black after:z-20
        after:origin-bottom-center after:transition-transform after:duration-600 after:ease-[cubic-bezier(0.48,0,0.12,1)]
        after:[transform:skewY(9.3deg)_scaleY(0)]
        hover:after:[transform:skewY(9.3deg)_scaleY(2)]"
    >
      {/* Primary Text */}
      <span className="relative z-10 transition-colors duration-600 ease-[cubic-bezier(0.48,0,0.12,1)]">
        text
      </span>

      {/* Alternate Text */}
      <span className="absolute left-1/2 top-1/2 z-50 h-[14px] text-white opacity-0 transition-all duration-500 ease-[cubic-bezier(0.48,0,0.12,1)] leading-[13px] -translate-x-1/2 translate-y-[225%] group-hover:-translate-x-1/2 group-hover:-translate-y-full group-hover:opacity-100 group-hover:duration-900">
        alternateText
      </span>
    </button>
    </button>
  );
};

// Main Row Container
const FancyGoldButtonRow = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, label: "Configurations" },
    { id: 1, label: "Wall Panels" },
    { id: 2, label: "Handrails" },
    { id: 3, label: "Ceilings" }
  ];

  return (
    <div className="w-full bg-[#14100f] p-8 rounded-sm border border-gray-900 shadow-xl">
      {/* Container holding the buttons inline with no outer margin interference */}
      <div className="relative w-full">
        
        {/* Buttons Flex Row Wrapper */}
        <div className="flex flex-row items-end justify-start gap-[1px] overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <DockedGoldButton
              key={tab.id}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </DockedGoldButton>
          ))}
        </div>

        {/* The Master Crisp Lower Baseline Underline Wire */}
        <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-gradient-to-r from-[#dfb76c] via-[#c29d59] to-[#dfb76c]/20 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
      </div>

      {/* Dummy Workspace Content Anchor to visualize the design split */}
      <div className="mt-6 p-6 text-sm text-gray-400 font-light border border-dashed border-gray-800/60 rounded-sm">
        Active Viewport Canvas Details for Component Profile State ID: <span className="text-[#dfb76c] font-mono font-bold">{activeTab}</span>
      </div>



   
    </div>
  );
};

export default FancyGoldButtonRow;