import React from "react";
import {
  Lightbulb,
  Heart,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  List,
  Scale,
  RotateCw,
} from "lucide-react";

const categories = ["ALL STYLES", "INDUSTRIAL", "HEALTHCARE", "HOSPITALITY", "CORPORATE"];

const ceilingOptions = [
  "ceilings/ceiling1.png",
  "ceilings/ceiling2.png",
  "ceilings/ceiling3.png",
  "ceilings/ceiling4.png",
  "ceilings/ceiling5.png",
  "ceilings/ceiling6.png",
  "ceilings/ceiling7.png",
];

const materialOptions = [
  "material/material.png",
  "material/material2.png",
  "material/material3.png",
  "material/material4.png",
  "material/material5.png",
  "material/material6.png",
  "material/material7.png",
  "material/material9.png",
  "material/material8.png",
  "material/material10.png",
  "material/material11.png",
];

// Only 6 handrail preview images are shown in this gallery step — it stops
// here, no more images and no pagination beyond these 6.
const handrailOptions = [
  "previewHandrails/1.png",
  "previewHandrails/2.png",
  "previewHandrails/3.png",
  "previewHandrails/4.png",
  "previewHandrails/5.png",
  "previewHandrails/6.png",
];

const concepts = [
  { id: 1, title: "Silver Mesh", image: "Cab Inspiration/gallarey/1.jpg", swatches: ["#C9C9C9", "#B99B72", "#5C5C5C", "#1E1E1E"] },
  { id: 2, title: "Urban Bronze", image: "Cab Inspiration/gallarey/2.jpg", swatches: ["#B08A54", "#8C6239", "#3A332B", "#1E1E1E"] },
  { id: 3, title: "Marble Elegance", image: "Cab Inspiration/gallarey/3.jpg", swatches: ["#F5F2EC", "#D8CBB4", "#C7C3BB", "#4A463F"] },
  { id: 4, title: "Graphite Edge", image: "Cab Inspiration/gallarey/4.jpg", swatches: ["#6E6E6E", "#4A4A4A", "#9A9A9A", "#1A1A1A"] },
  { id: 5, title: "Natural Oak", image: "Cab Inspiration/gallarey/5.jpg", swatches: ["#B9793B", "#D9A24B", "#8C6239", "#3A2E22"] },
  { id: 6, title: "Linear Grey", image: "Cab Inspiration/gallarey/6.jpg", swatches: ["#B7B2A8", "#8C877C", "#5C574D", "#2A2822"] },
  { id: 7, title: "Midnight Blue", image: "Cab Inspiration/gallarey/7.jpg", swatches: ["#3C4E60", "#2C3A47", "#D8CFC0", "#1A1A1A"] },
  { id: 8, title: "Onyx Luxe", image: "Cab Inspiration/gallarey/1.jpg", swatches: ["#1E1B18", "#4A433A", "#D8CBB4", "#EAD9B8"] },
];

/**
 * Maps the active wizard step's label to the correct image set.
 * Matches loosely (case-insensitive, substring) so it's tolerant of
 * label variations like "Wall Panels" / "Panels" / "Wall Panel".
 */
const getGalleryItems = (stepLabel = "") => {
  const label = stepLabel.toLowerCase();

  if (label.includes("wall") || label.includes("panel")) {
    return materialOptions.map((img, idx) => ({ id: `material-${idx}`, image: img }));
  }
  if (label.includes("handrail")) {
    return handrailOptions.map((img, idx) => ({ id: `handrail-${idx}`, image: img }));
  }
  if (label.includes("ceiling")) {
    return ceilingOptions.map((img, idx) => ({ id: `ceiling-${idx}`, image: img }));
  }
  // Default / "Configuration(s)" step
  return concepts;
};

/**
 * ReviewInfoPanel
 * Self-contained explanation of what the Review step does — no external
 * component or extra props needed. Shown in the gallery area whenever the
 * active wizard step is "Review".
 */
const ReviewInfoPanel = () => {
  const fields = [
    {
      label: "PROJECT / JOB NAME",
      desc: "This appears at the top of your downloaded spec sheet, next to the model name.",
    },
    {
      label: "DIMENSIONS",
      desc: "Dimensions are not mandatory at this stage to complete your design. However, you will need to provide them to request an 'Advanced Download'. You can do this now or in the future.",
      sub: [
        { tag: "D1", text: "DEPTH" },
        { tag: "W1", text: "WIDTH" },
        { tag: "H1", text: "CAB SHELL HEIGHT" },
        { tag: "H2", text: "CEILING HEIGHT" },
      ],
      note: "\"EDIT CAB DIMENSIONS\" unlocks these four fields so you can type in exact measurements.",
    },
    {
      label: "+ QUANTITY",
      desc: "How many units of this exact configuration you need built.",
    },
    {
      label: "+MORE DETAILS (click to expand)",
      desc: "Expands a set of optional fields — Job Type, Elevator Type, Cab Shell Material, and Manufacturer — for anyone who wants to specify them up front.",
      sub: [
        { tag: "JOB TYPE", text: "New Construction · Modernization · Retrofit" },
        { tag: "ELEVATOR TYPE", text: "Passenger · Freight · Residential" },
        { tag: "CAB SHELL MATERIAL", text: "Stainless Steel · Painted Steel · Glass" },
        { tag: "MANUFACTURER", text: "Otis · Schindler · KONE · ThyssenKrupp" },
      ],
    },
    {
      label: "SPECIFICATION VERIFICATION",
      desc: "All parameters auto-saved to cloud repository. Compile configuration layouts into a production-ready blueprint document.",
    },
    {
      label: "DOWNLOAD PRO BLUEPRINT (6 PAGES)",
      desc: "Generates and downloads a 6-page PDF spec sheet with every view of your elevator design, plus the project details, dimensions, and job specs entered above — ready to send for quoting or fabrication.",
    },
  ];

  return (
    <div className="bg-white border border-[#E6E0D6] rounded-xl p-6 sm:p-8">
      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#8C6239] mb-1.5">
        Design Review
      </p>
      <h2
        className="text-xl sm:text-2xl lg:text-3xl font-medium tracking-tight text-[#2C2822] leading-tight"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Final Summary
      </h2>
      <p className="text-xs sm:text-sm text-[#6B6355] mt-1.5 max-w-2xl mb-6">
        Your elevator configuration is complete. Review your selections, specify optional
        constraints, and render the design specification sheet.
      </p>

      <div className="flex flex-col divide-y divide-[#E6E0D6]">
        {fields.map((field, idx) => (
          <div key={idx} className="py-4 first:pt-0 last:pb-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#2C2822] mb-1">
              {field.label}
            </p>
            <p className="text-xs sm:text-sm text-[#6B6355] leading-relaxed">{field.desc}</p>

            {field.sub && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {field.sub.map((s, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F2EC] border border-[#E6E0D6] text-[10px] font-semibold tracking-wide text-[#6B6355] uppercase"
                  >
                    <span className="text-[#8C6239] font-bold">{s.tag}</span> {s.text}
                  </span>
                ))}
              </div>
            )}

            {field.note && (
              <p className="text-[11px] text-[#8C6239] italic mt-2">{field.note}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-[#E6E0D6] bg-[#FAF6EF] px-4 sm:px-5 py-4 flex items-start gap-2.5">
        <Lightbulb className="w-4 h-4 text-[#8C6239] mt-0.5 shrink-0" />
        <p className="text-[11px] text-[#7A705F]">
          Nothing here is required to finish browsing designs — but filling it in now saves
          you a step later when you're ready to request a quote.
        </p>
      </div>
    </div>
  );
};

const InspirationGallery = ({
  features,
  steps,
  activeStep,
  handleNavClick,
  journeyPerks,
  viewMode,
  setViewMode,
}) => {
  const activeLabel = (steps?.[activeStep]?.label || "").toLowerCase();
  const isReviewStep = activeLabel.includes("review");
  const galleryItems = isReviewStep ? [] : getGalleryItems(steps?.[activeStep]?.label);

  return (
    <>
      {/* ----------------- SECTION 2: TOP FEATURES BAR ----------------- */}
      <div className="w-full max-w-7xl mx-auto mb-4">
        <h2 className="text-sm font-bold text-[#2C2822] font-bold mb-3 text-center uppercase tracking-wider">
          What can you customize?
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-0">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center text-center gap-2 sm:border-r-2 sm:border-r-[#E6E0D6] last:border-r-0 p-2 sm:p-3"
            >
              <div className="p-2 bg-[#FBF9F5] text-[#8C6239] shrink-0">{feat.icon}</div>
              <p className="text-[10px] font-bold tracking-wider text-[#2C2822] uppercase leading-snug">
                {feat.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ----------------- SECTION 1.5: WIZARD STEPPER ----------------- */}
      <div className="w-full max-w-7xl mx-auto mb-6">
        {/* Desktop: 5 chevron buttons */}
        <nav className="hidden lg:flex w-full bg-[#f9f6f0]/80 backdrop-blur-sm rounded-xl overflow-hidden border border-[#e5dfd5] p-1 shadow-sm">
          {steps.map((step, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === steps.length - 1;

            let clipPathStyle =
              "polygon(18px 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 18px 100%, 0 50%)";
            if (isFirst) {
              clipPathStyle =
                "polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%)";
            } else if (isLast) {
              clipPathStyle = "polygon(18px 0, 100% 0, 100% 100%, 18px 100%, 0 50%)";
            }

            return (
              <button
                key={step.label}
                type="button"
                onClick={() => handleNavClick(idx)}
                className={`relative flex-1 flex items-center gap-3 px-6 py-3.5 text-left ${
                  step.active
                    ? "text-white bg-gradient-to-r from-[#b37a28] via-[#a36c1e] to-[#8c5914] shadow-md"
                    : "text-[#2b2120]"
                }`}
                style={{
                  clipPath: clipPathStyle,
                  marginLeft: isFirst ? 0 : "-14px",
                  zIndex: step.active ? 20 : steps.length - idx,
                }}
              >
                <span
                  className={`shrink-0 w-9 h-9 rounded-md flex items-center justify-center ${
                    step.active ? "bg-white/20" : "bg-transparent"
                  }`}
                >
                  <img
                    src={step.icon}
                    alt={step.shortLabel || step.label}
                    className={`object-contain w-6 h-6 ${
                      step.active ? "brightness-200" : "opacity-70"
                    }`}
                  />
                </span>
                <span className="flex flex-col leading-tight">
                  <span
                    className={`text-xs font-bold tracking-wider uppercase ${
                      step.active ? "text-white" : "text-[#1f1918]"
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span
                      className={`text-[10px] font-normal line-clamp-1 mt-0.5 ${
                        step.active ? "text-white/80" : "text-[#7a6e65]"
                      }`}
                    >
                      {step.description}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Mobile: compact icon nav */}
        <nav className="flex lg:hidden w-full items-center justify-between pt-18">
          {steps.map((step, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleNavClick(index)}
              className={`flex-1 flex flex-col items-center justify-center pt-3 pb-2.5 transition-all duration-200 border-b-2 ${
                step.active
                  ? "text-[#1f1918] bg-[#f9f6f0] border-[#b37a28]"
                  : "text-[#7a6e65] border-transparent bg-transparent"
              }`}
            >
              <img
                src={step.icon}
                alt={step.shortLabel}
                className={`object-contain w-5 h-5 mb-1 transition-all ${
                  step.active ? "brightness-100" : "opacity-40 grayscale"
                }`}
              />
              <span className="text-[10px] font-bold tracking-wider uppercase">
                {step.shortLabel}
              </span>
            </button>
          ))}
        </nav>

        {/* Progress dot-line */}
        <div className="relative flex items-center justify-between mt-6 px-12">
          <div className="absolute left-12 right-12 h-[1px] bg-[#d3cbc0] top-1/2 -translate-y-1/2" />
          <div
            className="absolute left-12 h-[2px] bg-[#b37a28] top-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
            style={{
              width: `calc(${(activeStep / (steps.length - 1)) * 100}% - ${
                (activeStep / (steps.length - 1)) * 24
              }px)`,
            }}
          />
          {steps.map((step, idx) => {
            const isActive = idx === activeStep;
            const isPassed = idx < activeStep;

            return (
              <button
                key={step.label}
                aria-label={step.label}
                onClick={() => handleNavClick(idx)}
                className="relative z-10 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 bg-[#FAF8F5]"
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-[#b37a28] ring-2 ring-[#b37a28]/30 scale-110"
                      : isPassed
                      ? "bg-[#b37a28]"
                      : "bg-white border-2 border-[#d3cbc0]"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------- SECTION 3+4: SIDEBAR + MAIN GALLERY ----------------- */}
      <div className="max-w-7xl mx-auto mb-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ---- Sidebar ---- */}
        <aside className="lg:col-span-3 bg-white border border-[#E6E0D6] rounded-xl p-5 flex flex-col gap-5 h-fit">
          <div>
            <h3
              className="text-sm font-bold uppercase tracking-wider text-[#2C2822] mb-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Your Design Journey
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C6239] mb-2">
              {activeStep + 1} of {steps.length} &bull; View 1
            </p>
            <p className="text-xs text-[#6B6355] leading-relaxed">
              Select your elevator system configuration to start building your design.
            </p>
          </div>

          <button
            className="
              w-full inline-flex items-center justify-center gap-2 rounded-sm
              bg-gradient-to-b from-[#C79A63] via-[#A67C52] to-[#7F5A34]
              px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-white
              shadow-[0_10px_25px_rgba(95,65,30,0.25)]
              transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(95,65,30,0.35)]
            "
            onClick={() => handleNavClick(Math.min(activeStep + 1, steps.length - 1))}
          >
            Next Step <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="relative rounded-md overflow-hidden bg-[#F3ECE0] aspect-[4/5]">
            <img
              src="360.png"
              alt="Elevator interior preview"
              className="w-full h-full object-center"
            />
            <button className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-black/75 transition-colors">
              <RotateCw className="w-3 h-3" /> Explore in 360°
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {journeyPerks.map((perk, idx) => (
              <div key={idx} className="flex flex-col items-center text-center gap-1.5 p-2">
                <span className="text-[#8C6239]">{perk.icon}</span>
                <span className="text-[9px] font-bold uppercase tracking-wide text-[#2C2822] leading-tight">
                  {perk.title}
                </span>
                <span className="text-[8.5px] text-[#8A8172] leading-snug">{perk.desc}</span>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-[#F3ECE0] p-3.5 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[#8C6239]">
              <Lightbulb className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Tip</span>
            </div>
            <p className="text-xs text-[#4A4436] leading-snug">
              Not sure which style fits your project?
            </p>
            <a href="#" className="text-[11px] font-bold text-[#8C6239] hover:text-[#5C4124] transition-colors inline-flex items-center gap-1">
              View Design Guide <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </aside>

        {/* ---- Main gallery / Review ---- */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          {isReviewStep ? (
            <ReviewInfoPanel />
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#8C6239] mb-1.5">
                    Design Elevator Interiors
                  </p>
                  <h2
                    className="text-xl sm:text-2xl lg:text-3xl font-medium tracking-tight text-[#2C2822] leading-tight"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Find Your Inspiration. Make It Yours.
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6B6355] mt-1.5 max-w-xl">
                    Choose a base design you love, then customize every detail to match your vision.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button className="inline-flex items-center gap-1.5 rounded-sm border border-[#E6E0D6] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#2C2822] hover:border-[#8C6239] transition-colors">
                    <Scale className="w-3.5 h-3.5 text-[#8C6239]" /> Compare (0)
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-sm border border-[#E6E0D6] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#2C2822] hover:border-[#8C6239] transition-colors">
                    Sort By: Newest <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center rounded-sm border border-[#E6E0D6] overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 transition-colors ${viewMode === "grid" ? "bg-[#8C6239] text-white" : "bg-white text-[#8C6239]"}`}
                      aria-label="Grid view"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 transition-colors ${viewMode === "list" ? "bg-[#8C6239] text-white" : "bg-white text-[#8C6239]"}`}
                      aria-label="List view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E0D6] pb-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold tracking-widest text-[#2C2822] uppercase mr-1">
                    Categories:
                  </span>
                  {categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#F5F2EC] border border-[#E6E0D6] text-[10px] sm:text-[11px] font-semibold tracking-wider text-[#6B6355] uppercase"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5F2EC] border border-[#E6E0D6] text-[10px] sm:text-[11px] font-semibold tracking-wider text-[#7F5A34] uppercase">
                  <Heart className="w-3.5 h-3.5 text-[#A17C50]" /> Saved Styles
                </div>
              </div>

              {/* Gallery grid — driven by the active step */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {galleryItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-none overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow"
                  >
                    <div className="bg-[#F3ECE0] aspect-[3/4] overflow-hidden relative">
                      <img
                        src={item.image}
                        alt={item.title || `option-${item.id}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-[#E6E0D6] bg-[#FAF6EF] px-4 sm:px-5 py-4">
                <div className="flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-[#8C6239] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#2C2822]">Don't see what you imagine?</p>
                    <p className="text-[11px] text-[#7A705F]">Start from scratch or mix elements from different designs.</p>
                  </div>
                </div>
                <button className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#1E1B18] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-white hover:bg-black transition-colors shrink-0">
                  Start From Scratch <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default InspirationGallery;