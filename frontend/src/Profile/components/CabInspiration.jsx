import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  Pencil,
  Lightbulb,
  Grid,
  Shield,
  Layers,
  FileText,
  Box,
} from "lucide-react";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";
import { ArrowRight } from "lucide-react";
import { BsBagCheck } from "react-icons/bs";
import { GiMaterialsScience } from "react-icons/gi";
import { IoStorefrontSharp } from "react-icons/io5";
import { CiGrid41 } from "react-icons/ci";
import { GiStraightPipe } from "react-icons/gi";
import { TbDeviceAirpodsCase } from "react-icons/tb";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { MdOutlineWorkspacePremium } from "react-icons/md";
import { SiPerforce } from "react-icons/si";
import { AiOutlineDeliveredProcedure } from "react-icons/ai";
import { SiMaterialdesignicons } from "react-icons/si";
import { SiCssdesignawards } from "react-icons/si";
import { FaRegLightbulb } from "react-icons/fa";
import { FaDribbbleSquare } from "react-icons/fa";
import { HiMiniPencilSquare } from "react-icons/hi2";
import { RiVoiceRecognitionFill } from "react-icons/ri";
import { FiShare2 } from "react-icons/fi";
import { PiBuildingOffice } from "react-icons/pi";
import { TbScreenShare } from "react-icons/tb";
import { FaArrowRight } from "react-icons/fa6";
import { HiOutlineCube } from "react-icons/hi2";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { HiOutlineShare } from "react-icons/hi2";
import { PiCubeTransparentLight } from "react-icons/pi";
import { PiDeviceMobileCameraLight } from "react-icons/pi";
import { PiHeadsetLight } from "react-icons/pi";
import { Link } from "react-router-dom";  
import InspirationGallery from "./Inspirationgallery";

const CabInspiration = () => {
  const containerRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState("ALL STYLES");
  const [viewMode, setViewMode] = useState("grid");

  const [steps, setSteps] = useState([
    { label: "Configurations", shortLabel: "Config", icon: "/ConfigurationNavbar/Elevator.png",  active: true  },
    { label: "Wall Panels",    shortLabel: "Walls",  icon: "/ConfigurationNavbar/Wallpanel.png", active: false },
    { label: "Handrails",      shortLabel: "Rails",  icon: "/ConfigurationNavbar/handrail.png",  active: false },
    { label: "Ceilings",       shortLabel: "Roof",   icon: "/ConfigurationNavbar/ceiling.png",   active: false },
    { label: "Review",         shortLabel: "Review", icon: "/ConfigurationNavbar/review.png",    active: false },
  ]);

  const activeStep = steps.findIndex((step) => step.active);
  const navRefs = useRef([]);

  const handleNavClick = (index) => {
    setSteps((prev) => prev.map((step, i) => ({ ...step, active: i === index })));
  };

  const handleNavMouseEnter = (index) => {
    if (window.innerWidth < 1024 || !navRefs.current[index]) return;
    gsap.to(navRefs.current[index], { scale: 1.02, duration: 0.3, ease: "power2.out" });
  };

  const handleNavMouseMove = (e, index) => {
    if (window.innerWidth < 1024 || !navRefs.current[index]) return;
    const rect = navRefs.current[index].getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    navRefs.current[index].style.setProperty("--mouse-x", `${x}%`);
    navRefs.current[index].style.setProperty("--mouse-y", `${y}%`);
  };

  const handleNavMouseLeave = (index) => {
    if (window.innerWidth < 1024 || !navRefs.current[index]) return;
    gsap.to(navRefs.current[index], { scale: 1, duration: 0.4, ease: "power2.out" });
  };

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
    );
  }, []);

  const customDesigns = [
    {
      icon: <SiCssdesignawards className="w-8 h-8 sm:w-10 sm:h-10 text-[#8C6239]" />,
      title: "Bespoke Concepts",
      desc: "Original layouts built around your brand, not a template.",
    },
    {
      icon: <SiMaterialdesignicons className="w-8 h-8 sm:w-10 sm:h-10 text-[#8C6239]" />,
      title: "Material Matching",
      desc: "Real finishes sourced to match your palette exactly.",
    },
    {
      icon: <MdOutlineWorkspacePremium className="w-8 h-8 sm:w-10 sm:h-10 text-[#8C6239]" />,
      title: "Premium Detailing",
      desc: "Hardware and trim selected for a refined final look.",
    },
    {
      icon: <SiPerforce className="w-8 h-8 sm:w-10 sm:h-10 text-[#8C6239]" />,
      title: "Code Compliance",
      desc: "Every concept checked against local elevator codes.",
    },
    {
      icon: <AiOutlineDeliveredProcedure className="w-8 h-8 sm:w-10 sm:h-10 text-[#8C6239]" />,
      title: "Fast Turnaround",
      desc: "Custom renderings delivered in days, not weeks.",
    },
  ];

  const features = [
    { icon: <Pencil className="w-8 h-8 sm:w-10 sm:h-10 text-[#8C6239]" />, title: "Wall Panels" },
    { icon: <Lightbulb className="w-8 h-8 sm:w-10 sm:h-10 text-[#8C6239]" />, title: "Lighting" },
    { icon: <Grid className="w-8 h-8 sm:w-10 sm:h-10 text-[#8C6239]" />, title: "Ceiling Design" },
    { icon: <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-[#8C6239]" />, title: "Flooring" },
    { icon: <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-[#8C6239]" />, title: "Panel Layout" },
    { icon: <GiStraightPipe className="w-8 h-8 sm:w-10 sm:h-10 text-[#8C6239]" />, title: "Handrails" },
    { icon: <CiGrid41 className="w-8 h-8 sm:w-10 sm:h-10 text-[#8C6239]" />, title: "Bumper Pods" },
    { icon: <TbDeviceAirpodsCase className="w-8 h-8 sm:w-10 sm:h-10 text-[#8C6239]" />, title: "Car Pods" },
    { icon: <MdOutlineDashboardCustomize className="w-8 h-8 sm:w-10 sm:h-10 text-[#8C6239]" />, title: "Custom Graphics" },
  ];

  // Category Filter Pills (also doubles as the 5-button set referenced in the design)
  const categories = ["ALL STYLES", "INDUSTRIAL", "HEALTHCARE", "HOSPITALITY", "CORPORATE"];

  // ---- Sidebar "design journey" quick-facts (the 3x2 icon grid) ----
  const journeyPerks = [
    { icon: <HiOutlineCube className="w-6 h-6" />, title: "3–4 VIEWS", desc: "Front, Side, Back & Perspective" },
    { icon: <HiOutlineDocumentText className="w-6 h-6" />, title: "INSTANT ESTIMATE", desc: "See pricing as you design" },
    { icon: <HiOutlineShare className="w-6 h-6" />, title: "SAVE & SHARE", desc: "Share your design with your team" },
    { icon: <PiCubeTransparentLight className="w-6 h-6" />, title: "SAMPLE BOX", desc: "Receive material samples" },
    { icon: <PiDeviceMobileCameraLight className="w-6 h-6" />, title: "TRY THE APP", desc: "Visualize in your own space" },
    { icon: <PiHeadsetLight className="w-6 h-6" />, title: "HELP CENTER", desc: "Guides & video tutorials" },
  ];

  // Elevator Concepts Cards Data (8 cards, 4 per row)
  const concepts = [
    { id: 1, title: "Silver Mesh", image: "Cab Inspiration/1.png", swatches: ["#C9C9C9", "#B99B72", "#5C5C5C", "#1E1E1E"] },
    { id: 2, title: "Urban Bronze", image: "Cab Inspiration/2.png", swatches: ["#B08A54", "#8C6239", "#3A332B", "#1E1E1E"] },
    { id: 3, title: "Marble Elegance", image: "Cab Inspiration/3.png", swatches: ["#F5F2EC", "#D8CBB4", "#C7C3BB", "#4A463F"] },
    { id: 4, title: "Graphite Edge", image: "Cab Inspiration/4.png", swatches: ["#6E6E6E", "#4A4A4A", "#9A9A9A", "#1A1A1A"] },
    { id: 5, title: "Natural Oak", image: "Cab Inspiration/5.png", swatches: ["#B9793B", "#D9A24B", "#8C6239", "#3A2E22"] },
    { id: 6, title: "Linear Grey", image: "Cab Inspiration/6.png", swatches: ["#B7B2A8", "#8C877C", "#5C574D", "#2A2822"] },
    { id: 7, title: "Midnight Blue", image: "Cab Inspiration/7.png", swatches: ["#3C4E60", "#2C3A47", "#D8CFC0", "#1A1A1A"] },
    { id: 8, title: "Onyx Luxe", image: "Cab Inspiration/8.png", swatches: ["#1E1B18", "#4A433A", "#D8CBB4", "#EAD9B8"] },
  ];

  // Stat Highlights
  const statHighlights = [
    { icon: <BsBagCheck className="text-[#8C6239] text-lg shrink-0" />, number: "600+", label: "professionally designed elevators" },
    { icon: <GiMaterialsScience className="text-[#8C6239] text-lg shrink-0" />, number: "Thousands", label: "of material combinations" },
    { icon: <FiShare2 className="text-[#8C6239] text-lg shrink-0" />, number: "Unlimited", label: "custom configurations" },
    { icon: <IoStorefrontSharp className="text-[#8C6239] text-lg shrink-0" />, number: "Compatible", label: "with all standard cabs" },
  ];

  return (
    <div
      ref={containerRef}
      className="w-full min-h-screen text-[#2C2822] py-4 px-3 sm:px-6 lg:px-10"
      style={{ backgroundColor: "#FBF9F5", fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');

        /* ── Hexagon wizard-step shape (colors unchanged: #2b2120 / #1f1918 / #dfb76c) ── */
        @media (min-width: 1024px) {
          .ci-navbar-wrapper { perspective: 1000px; width: 100%; }
          .ci-navbar { display: flex; flex-direction: row; align-items: center; justify-content: start; width: 100%; }
          .ci-step-button-container { position: relative; flex: 1; min-height: 68px; margin-right: -34px; filter: drop-shadow(0 6px 12px rgba(43,33,32,0.18)); transform-style: preserve-3d; }
          .ci-step-button-container:last-child { margin-right: 0; }
          .ci-step-button {
            position: relative; width: 100%; height: 100%; min-height: 68px; display: flex; align-items: center; justify-content: space-between;
            padding: 10px 34px 10px 52px; background: #1f1918; color: #dfb76c; opacity: 0.85; border: none; outline: none; cursor: pointer; user-select: none;
            clip-path: polygon(88% 0%, 100% 50%, 88% 100%, 0% 100%, 12% 50%, 0% 0%); transform-style: preserve-3d; transition: color 0.3s ease, opacity 0.3s ease;
          }
          .ci-step-inner-face { position: absolute; inset: 0; background: #1f1918; clip-path: polygon(88% 0%, 100% 50%, 88% 100%, 0% 100%, 12% 50%, 0% 0%); z-index: 1; pointer-events: none; transition: background 0.3s ease; }
          .ci-step-button:hover { color: #ffffff; opacity: 1; }
          .ci-step-button:hover .ci-step-inner-face { background: #2b2120; }
          .ci-step-button.active { color: #ffffff; opacity: 1; }
          .ci-step-button.active .ci-step-inner-face { background: #2b2120; }
          .ci-step-spotlight { position: absolute; inset: 0; background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(223,183,108,0.18), transparent 60%); pointer-events: none; z-index: 2; }

          .ci-bulbs-panel { display: flex; flex-direction: row; align-items: center; justify-content: space-around; width: 100%; padding: 10px 40px; background: #1f1918; margin-top: 4px; }
          .ci-bulb-container { display: flex; align-items: center; justify-content: center; flex: 1; }
          .ci-status-bulb { width: 10px; height: 10px; border-radius: 50%; background: #3a2f2c; border: 1px solid #dfb76c33; transition: all 0.4s ease; }
          .ci-status-bulb.active { background: #dfb76c; border-color: #dfb76c; box-shadow: 0 0 6px #dfb76c, 0 0 14px rgba(223,183,108,0.6); }
        }
      `}</style>

      {/* ----------------- SECTION 1: HERO HEADER ----------------- */}
      <div className="w-full bg-[#FAF8F5] rounded-b-sm overflow-hidden mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center">
          <div className="p-5 sm:p-8 lg:p-10 gap-5 flex flex-col justify-center">
            <div className="pl-3 sm:pl-5 border-l-2 border-[#A17C50] mb-4">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#8C6239] mb-1.5">
                Cab Inspiration
              </p>
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-[#2C2822] flex flex-col flex-wrap gap-x-2 leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                <span>Discover.</span>
                <span>Customize.</span>
                <span className="text-[#7F5A34]">Create.</span>
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-[#5C5446] font-medium mb-4 leading-relaxed max-w-xl">
              Explore professionally designed elevator interiors or start with a blank canvas and build something completely your own.
            </p>

            <div className="grid grid-cols-2 sm:flex  gap-x-4 gap-y-3 mb-4">
              {statHighlights.map((stat, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  {stat.icon}
                  <div className="flex flex-col text-xs text-[#2C2822] font-medium">
                    <span className="font-bold text-sm text-[#2C2822]">{stat.number}</span>
                    <span className="capitalize text-[#6B6355] leading-snug">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/profile">
              <button
                className="
                  group relative inline-flex items-center gap-2 rounded-sm
                  bg-gradient-to-b from-[#C79A63] via-[#A67C52] to-[#7F5A34]
                  px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white
                  shadow-[0_10px_25px_rgba(95,65,30,0.25)]
                  transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(95,65,30,0.35)]
                  active:translate-y-0
                "
              >
                Start Designing
              </button>
              </Link>
<Link to="/login">
                <button
                  className="
                    inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold
                    uppercase tracking-[0.15em] text-[#7F5A34] hover:text-[#5C4124] transition-colors hover:bg-[#EADBCE] hover:rounded-sm cursor-pointer
                  "
              >
                Log In <FaArrowRight />
              </button>
</Link>
            </div>
          </div>

          <div className="h-56 sm:h-64 lg:h-full w-full relative overflow-hidden bg-[#F4EFEA]">
            <img
              src="Cab Inspiration/heroinspired.png"
              alt="Cab Inspiration Preview"
              className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>
      </div>

      {/* ----------------- SECTIONS 2, 1.5, 3+4 extracted into InspirationGallery ----------------- */}
      <InspirationGallery
        features={features}
        steps={steps}
        activeStep={activeStep}
        handleNavClick={handleNavClick}
        journeyPerks={journeyPerks}
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        categories={categories}
        concepts={concepts}
      />

      {/* SECTION Create a Custom Design */}
      <div className="w-full max-w-7xl mx-auto mb-4">
        <div className="bg-[#FAF8F5] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 w-full items-stretch">
            <div className="lg:col-span-5 p-5 sm:p-8 lg:p-10 flex flex-col justify-between bg-gradient-to-b from-[#FAF8F5] to-[#F5EFE6]">
              <div>
                <h1
                  className="text-xl sm:text-2xl lg:text-3xl font-medium tracking-tight text-[#2C2822] leading-tight mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Don't see exactly what you're looking for?
                </h1>

                <p className="text-xs sm:text-sm text-[#6B6355] leading-relaxed mb-5">
                  Upload your inspiration, photos, or rough sketches. Our expert design team will bring your unique vision to life with a full custom 3D concept.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-5">
                  {customDesigns.map((design, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center text-center p-2.5 rounded-lg transition-all hover:bg-white/60"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#F3ECE0] flex items-center justify-center text-[#8C6239] mb-1.5 shrink-0">
                        {design.icon}
                      </div>
                      <h3 className="text-[10px] font-bold text-[#2C2822] leading-tight mb-1">
                        {design.title}
                      </h3>
                      <p className="text-[9px] text-[#7A705F] leading-snug">{design.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="
                  w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl
                  bg-gradient-to-b from-[#C79A63] via-[#A67C52] to-[#7F5A34]
                  px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white
                  shadow-[0_10px_25px_rgba(95,65,30,0.25)]
                  transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(95,65,30,0.35)]
                  active:translate-y-0
                "
              >
                Create a Custom Design
              </button>
            </div>

            <div className="lg:col-span-7 bg-[#EFE9DF] relative overflow-hidden min-h-[220px] sm:min-h-[280px] lg:min-h-full flex items-center justify-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#C79A63]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 w-full h-full max-h-[380px] rounded-2xl overflow-hidden border border-white/60 shadow-[0_20px_40px_rgba(44,40,34,0.12)] bg-white">
                <img
                  src="Cab Inspiration/createdCustomDesign.png"
                  alt="Custom 3D Interior Concept"
                  className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Black */}
      <div className="w-full max-w-7xl mx-auto mb-4 bg-black rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-12">
          <div className="hidden sm:block sm:col-span-3">
            <img
              src="Cab Inspiration/createblackdesign.png"
              className="w-full h-full object-cover"
              alt=""
            />
          </div>
          <div className="sm:col-span-9 flex flex-col items-center justify-center gap-2 text-center py-8 px-4">
            <h1 className="text-white text-xl sm:text-2xl">Ready to design your elevator?</h1>
            <span className="text-white text-sm sm:text-base">Join thousands of possibilities.</span>
            <button
              className="
                mt-2 group relative inline-flex items-center gap-2 rounded-sm
                bg-gradient-to-b from-[#C79A63] via-[#A67C52] to-[#7F5A34]
                px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white
                shadow-[0_10px_25px_rgba(95,65,30,0.25)]
                transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(95,65,30,0.35)]
                active:translate-y-0
              "
            >
              Start Designing
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- FOOTER ----------------- */}
      <footer className="w-full bg-[#FAF8F5] text-[#2C2822] border-t border-[#E6E0D6] pt-10 pb-8 px-3 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row flex-wrap justify-between gap-8 mb-6">
            <div className="flex-1 min-w-[220px] max-w-sm flex flex-col gap-3">
              <Link to="/"><img src="logo/logo.png" className="w-[85%] h-full" alt="" /></Link>

              <p className="text-xs text-[#7A705F] leading-relaxed">
                Transforming elevator spaces with our interactive 3D studio. High-end materials, custom configurations, and real-time visualization.
              </p>

              <div className="flex items-center gap-2.5 mt-1">
                {[
                  { icon: <FaFacebookF className="w-3.5 h-3.5" />, href: "#" },
                  { icon: <FaTwitter className="w-3.5 h-3.5" />, href: "#" },
                  { icon: <FaInstagram className="w-3.5 h-3.5" />, href: "#" },
                  { icon: <FaLinkedinIn className="w-3.5 h-3.5" />, href: "#" },
                ].map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    className="w-8 h-8 rounded-full bg-white border border-[#E6E0D6] flex items-center justify-center text-[#8C6239] hover:bg-[#8C6239] hover:text-white hover:border-[#8C6239] transition-all duration-300 shadow-sm"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-[140px] flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#2C2822]">Platform</h3>
              <ul className="flex flex-col gap-2 text-xs text-[#7A705F]">
                <li><a href="#" className="hover:text-[#8C6239] transition-colors">3D Studio Configurator</a></li>
                <li><a href="#" className="hover:text-[#8C6239] transition-colors">Material Library</a></li>
                <li><a href="#" className="hover:text-[#8C6239] transition-colors">Lighting & Ceilings</a></li>
                <li><a href="#" className="hover:text-[#8C6239] transition-colors">Panels & Layouts</a></li>
              </ul>
            </div>

            <div className="flex-1 min-w-[140px] flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#2C2822]">Resources</h3>
              <ul className="flex flex-col gap-2 text-xs text-[#7A705F]">
                <li><a href="#" className="hover:text-[#8C6239] transition-colors">Design Gallery</a></li>
                <li><a href="#" className="hover:text-[#8C6239] transition-colors">3D Renderings</a></li>
                <li><a href="#" className="hover:text-[#8C6239] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[#8C6239] transition-colors">Case Studies</a></li>
              </ul>
            </div>

            <div className="flex-1 min-w-[140px] flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#2C2822]">Company</h3>
              <ul className="flex flex-col gap-2 text-xs text-[#7A705F]">
                <li><a href="#" className="hover:text-[#8C6239] transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-[#8C6239] transition-colors">Our Team</a></li>
                <li><a href="#" className="hover:text-[#8C6239] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[#8C6239] transition-colors">Contact Us</a></li>
              </ul>
            </div>

            <div className="flex-1 min-w-[240px] max-w-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#2C2822]">Newsletter</h3>
              <p className="text-xs text-[#7A705F] leading-relaxed">
                Subscribe to get the latest 3D design trends, product updates, and interior releases.
              </p>

              <form onSubmit={(e) => e.preventDefault()} className="flex flex-col  gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E6E0D6]  text-xs text-[#2C2822] placeholder:text-[#A89F91] focus:outline-none focus:border-[#8C6239] transition-colors shadow-sm"
                  required
                />
                <button
                  type="submit"
                  className="bg-[#8C6239] text-white px-4 py-2.5  text-xs font-bold hover:bg-[#7A542F] transition-colors flex items-center justify-center gap-1 shrink-0 shadow-sm"
                >
                  <span>Subscribe</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-[#E6E0D6] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#A89F91]">
            <p>© {new Date().getFullYear()} Project Elevator. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <a href="#" className="hover:text-[#8C6239] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#8C6239] transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-[#8C6239] transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CabInspiration;