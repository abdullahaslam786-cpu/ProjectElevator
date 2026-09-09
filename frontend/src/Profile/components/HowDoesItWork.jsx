import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  Lightbulb,
  Pencil,
  Box,
  Calculator,
  Package,
  Users,
  Search,
  Check,
  Layers,
  FileText,
  Smartphone,
  Cloud,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { HiOutlineArrowLongRight } from "react-icons/hi2";
import { Link } from "react-router-dom";

const HowDoesItWork = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    );
  }, []);


const howItWorksSteps = [
  { image: "/howitworkssteps/registerpage.png", title: "Step 1: Login/Register", path: "/step2" },
  { image: "/howitworkssteps/profile-edit.png", title: "Step 2: Profile Update", path: "/step3" },
  { image: "/howitworkssteps/project.png", title: "Step 3: Project Creation", path: "/step4" },
  { image: "/howitworkssteps/wallpanel.png", title: "Step 4: Go To Studio", path: "/step5" },
];

  const steps = [
    {
      num: 1,
      icon: <Lightbulb className="w-7 h-7 text-[#A17C50]" />,
      title: "Get Inspired",
      desc: "Explore professionally designed concepts and find the style that inspires you."
    },
    {
      num: 2,
      icon: <Pencil className="w-7 h-7 text-[#A17C50]" />,
      title: "Design",
      desc: "Customize every detail in our 3D Design Studio. Materials, finishes, layouts and more."
    },
    {
      num: 3,
      icon: <Box className="w-7 h-7 text-[#A17C50]" />,
      title: "Panel Configuration",
      desc: "Instant 3D renderings from multiple views. Rotate, explore and compare with ease."
    },
    {
      num: 4,
      icon: <Calculator className="w-7 h-7 text-[#A17C50]" />,
      title: "Ceiling Design/Lighting/Flooring",
      desc: "Get real-time pricing as you design and explore options that fit your project."
    },
    {
      num: 5,
      icon: <Package className="w-7 h-7 text-[#A17C50]" />,
      title: "Handrails / Bumpers",
      desc: "Connect with a fabricator to request a complimentary sample box of your selected materials."
    },
    {
      num: 6,
      icon: <Users className="w-7 h-7 text-[#A17C50]" />,
      title: "Cab Pads/Drawings",
      desc: "Get connected with verified fabricators and choose the best partner to bring your design to reality."
    }
  ];

  const capabilities = [
    {
      icon: <Box className="w-6 h-6 text-[#A17C50]" />,
      title: "3D Design Studio",
      desc: "Design in real-time with interactive 3D rendering and multiple views."
    },
    {
      icon: <Layers className="w-6 h-6 text-[#A17C50]" />,
      title: "Material Library",
      desc: "Access thousands of premium materials from top brands and suppliers."
    },
    {
      icon: <FileText className="w-6 h-6 text-[#A17C50]" />,
      title: "Drawings & Specs",
      desc: "Generate shop drawings, elevations and technical specs in seconds."
    },
    {
      icon: <Calculator className="w-6 h-6 text-[#A17C50]" />,
      title: "Live Budgeting",
      desc: "See real-time pricing and explore options that fit your budget."
    },
    {
      icon: <Users className="w-6 h-6 text-[#A17C50]" />,
      title: "Supplier Network",
      desc: "Connect with verified fabricators and suppliers in your area."
    },
    {
      icon: <Smartphone className="w-6 h-6 text-[#A17C50]" />,
      title: "Mobile & AR Preview",
      desc: "Visualize your design anywhere with our mobile app."
    },
    {
      icon: <Cloud className="w-6 h-6 text-[#A17C50]" />,
      title: "Cloud Projects",
      desc: "Save, manage and collaborate on projects securely in the cloud."
    }
  ];

  return (
    <div
      ref={containerRef}
      className="w-full min-h-screen text-[#2C2822] py-8 px-4 sm:px-8 lg:px-12"
      style={{
        backgroundColor: "#FBF9F5",
        fontFamily: "'DM Sans', sans-serif"
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>

      {/* ----------------- SECTION 1 & 2: HERO & TOP STEPS CONTAINER ----------------- */}
      <div className="max-w-8xl mx-auto mt-10 mb-2 relative">
        {/* HERO IMAGE CONTAINER */}
        <div className="relative w-full h-[320px] sm:h-[280px] lg:h-[320px] rounded-b-xl overflow-hidden shadow-sm">
          <img
            src="HowWorks/howdoesitwork.png"
            alt="Elevator Interior Inspiration"
            className="w-full h-full object-cover"
          />
          {/* Left Text Overlay */}
          <div className="absolute -top-3 left-0 w-full lg:w-[70%] h-full bg-gradient-to-r from-[#FBF9F5] via-[#FBF9F5] to-transparent p-6 sm:p-10 flex flex-col justify-center">
            <div className="pl-6 flex flex-col gap-2 border-l-2 border-[#A17C50]">
              <h1
                className="text-3xl sm:text-4xl lg:text-4xl font-medium tracking-tight mb-1 text-[#2C2822]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                How It Works
              </h1>
              <p
                className="text-lg sm:text-2xl italic text-[#A17C50] mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                From Inspiration to Installation.
              </p>
              <p className="text-xs sm:text-md text-[#6B6355] max-w-md leading-relaxed">
                Our patented platform makes it simple to design, visualize, and bring
                exceptional elevator interiors to life.
              </p>
            </div>
          </div>
        </div>

        {/* STEP-BY-STEP BAR OVERLAY */}
      <div className="w-full mt-6 lg:-mt-12 relative z-20 bg-[#FBF9F5] rounded-xl shadow-md border border-[#E6E0D6] p-2 sm:p-4">

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
    {steps.map((step, idx) => (
      <div
        key={idx}
        className="flex items-start justify-between gap-2 p-2"
      >
        {/* 1. LEFT: Step Icon */}
        <div className="shrink-0 text-[#A17C50] bg bg-[#f4e4d6] rounded-full p-1.5 flex items-center justify-center">
          {step.icon}
        </div>

        {/* 2. CENTER: Main Content (Number, Title, Desc) */}
        {/* 2. CENTER: Main Content (Number, Title, Desc) */}
        {/* 2. CENTER: Main Content (Number, Title, Desc) */}
        {/* 2. CENTER: Main Content (Number, Title, Desc) */}
        {/* 2. CENTER: Main Content (Number, Title, Desc) */}
        {/* 2. CENTER: Main Content (Number, Title, Desc) */}
        <div className="flex flex-col items-center text-center flex-1 min-w-0">
          <div className="flex items-center justify-center gap-1.5 mb-1 w-full">
            <div className="w-3 h-3 rounded-full bg-[#8C623A] text-white p-1 flex items-center justify-center font-bold text-[10px] shrink-0">
              {step.num}
            </div>
            <span className="font-bold text-[16px] text-[#2C2822] truncate">
              {step.title}
            </span>
          </div>
          <p className="text-[12px] font-bold text-[#7A705F] leading-snug line-clamp-2">
            {step.desc}
          </p>
        </div>

        {/* 3. RIGHT: Arrow Icon */}
        <div className="shrink-0 text-[#A17C50]">
          <HiOutlineArrowLongRight className="w-5 h-5" />
        </div>
      </div>
    ))}
  </div>

</div>
      </div>


      {/* ----------------- SECTION 4: Ruling images ----------------- */}
 <div className="max-w-8xl mx-auto mt-10 mb-2 relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {howItWorksSteps.map((step, idx) => (
    <div key={idx} className="flex flex-col items-center">
      <Link to={step.path.trim()} className="w-full h-full block cursor-pointer">
        <img
          src={step.image}
          alt={step.title}
          className="w-full h-full object-cover transition-opacity hover:opacity-90"
        />
      </Link>
      <p className="text-[20px] font-semibold text-[#2C2822] mt-2">
        {step.title}
      </p>
    </div>
  ))}
</div>

      {/* ----------------- SECTION 5: PLATFORM CAPABILITIES ----------------- */}
      <div className="max-w-8xl mx-auto mb-2  p-2 rounded-2xl shadow ">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Text */}
          <div className="lg:col-span-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A17C50] mb-1">
              PLATFORM CAPABILITIES
            </p>
            <h2
              className="text-2xl sm:text-3xl font-medium leading-tight text-[#2C2822]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Everything You Need. All in One Platform.
            </h2>
            <p className="text-xs text-[#7A705F] mt-2 leading-relaxed">
              Powerful tools, premium resources, and industry connections—designed to
              streamline every step of your project.
            </p>
          </div>

          {/* Right Capabilities Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {capabilities.map((cap, idx) => (
              <div
                key={idx}
                className=" border-s-2 border-[#E6E0D6]  p-3 flex flex-col items-center text-center hover:shadow-md transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-[#F5F1EA] flex items-center justify-center mb-2">
                  {cap.icon}
                </div>
                <p className="text-[10px] font-bold text-[#2C2822] mb-1 leading-snug">
                  {cap.title}
                </p>
                <p className="text-[8px] text-[#7A705F] leading-tight">
                  {cap.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ----------------- SECTION 6: BOTTOM SAMPLE BOX BANNER ----------------- */}
      <div className="max-w-8xl mx-auto  border border-[#E6E0D6] rounded-2xl py-2 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Sample Box Image Preview */}
          <div className="lg:col-span-3   flex items-center justify-center overflow-hidden h-40">
            <img
              src="samplerequest.png"
              alt="Sample Box"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Center Details & Features */}
          <div className="lg:col-span-3 flex items-center justify-center">
           <div className="flex flex-col">
             <p className="text-[10px] font-bold uppercase tracking-widest text-[#A17C50] mb-0.5">
              SAMPLE BOX BY FABRICATOR
            </p>
            <h3
              className="text-xl sm:text-2xl font-medium text-[#2C2822] mb-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Provided by Your Fabricator Partner.
            </h3>
            <p className="text-xs text-[#7A705F] mb-4">
              Once you've connected with a fabricator, they will provide a complimentary
              sample box with all the materials and finishes you selected in your design.
            </p>

           </div>
          </div>



            <div className="lg:col-span-4 gap-3 text-center flex ">
              <div className="flex flex-col items-center border-s border-[#E6E0D6]">
                <Box className="w-7 h-7 text-[#A17C50] mb-1" />
                <span className="text-[9px] text-[#6B6355]">
                  Carefully selected material samples
                </span>
              </div>
              <div className="flex flex-col items-center border-s border-[#E6E0D6]">
                <Layers className="w-7 h-7 text-[#A17C50] mb-1" />
                <span className="text-[9px] text-[#6B6355]">
                  Metal finish and accessory samples
                </span>
              </div>
              <div className="flex flex-col items-center border-s border-[#E6E0D6]">
                <FileText className="w-7 h-7 text-[#A17C50] mb-1" />
                <span className="text-[9px] text-[#6B6355]">
                  Your design rendering & finish schedule
                </span>
              </div>
              <div className="flex flex-col items-center border-s border-[#E6E0D6]">
                <Package className="w-7 h-7 text-[#A17C50] mb-1" />
                <span className="text-[9px] text-[#6B6355]">
                  Shipped fast and delivered to your door
                </span>
              </div>
            </div>

          {/* Right Action Callout Box */}
          <div className="lg:col-span-2 bg-[#FBF9F5] border border-[#E6E0D6] rounded-xl p-4 flex flex-col justify-center items-center text-center">
            <Users className="w-6 h-6 text-[#A17C50] mb-2" />
            <h4 className="text-xs font-bold text-[#2C2822] mb-1">Ready to Start?</h4>
            <p className="text-[10px] text-[#7A705F] mb-3">
              Create your design and let's bring your vision to life.
            </p>
            <button className="w-full bg-[#8C6239] text-white py-2 rounded-lg text-xs font-bold tracking-wider hover:bg-[#7A542F] transition-colors flex items-center justify-center gap-1">
              START DESIGNING <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowDoesItWork;