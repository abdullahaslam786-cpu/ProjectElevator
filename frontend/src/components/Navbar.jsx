import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { IoIosMenu } from "react-icons/io";

import {
  ChevronRight,
  Home as HomeIcon,
  Palette,
  UserCircle,
  Edit3,
  HelpCircle,
  LogIn,
  UserPlus,
  LogOut,
} from "lucide-react";
import { FaFacebookF, FaInstagram, FaPinterestP } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { userReset } from "../redux/features/Register/registerSlice";
import { CiMenuKebab } from "react-icons/ci";
const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navRef = useRef(null);
  const logoRef = useRef(null);
  const actionsRef = useRef(null);
  const sidebarRef = useRef(null);
  const overlayRef = useRef(null);
  const hamburgerRef = useRef(null);
  const isAnimating = useRef(false);
const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // 1. Determine Auth State from Redux or LocalStorage fallback
  const { user } = useSelector((state) => state.register);
  const isLoggedIn = !!user || !!localStorage.getItem("token");

  // 2. Pull the active/current project id from the project slice.
  // NOTE: adjust "currentProjectId" below to match whatever key your
  // projectSlice.js actually uses (e.g. state.project.selectedProjectId,
  // state.project.activeProject?._id, etc). Optional chaining keeps this
  // from throwing if the shape is slightly different.
  const currentProjectId = useSelector(
    (state) => state.project?.currentProjectId
  );

  // 3. Dynamic Menu Filtering based on Auth State
  const menuItems = [
    { id: "home", label: "Home", icon: <HomeIcon size={16} />, path: "/" },
    // Only visible when logged in
    ...(isLoggedIn
      ? [
          { id: "profile", label: "My Studio", icon: <UserCircle size={16} />, path: "/profile" },
          // Only show "Project" link if we actually have a real project id.
          // This avoids linking to a literal "/project/:id" that goes nowhere.
          ...(currentProjectId
            ? [
                {
                  id: "profile-edit",
                  label: "Project",
                  icon: <Edit3 size={16} />,
                  path: `/project/${currentProjectId}`,
                },
              ]
            : []),
        ]
      : []),
    { id: "how-does-it-work", label: "How Does It Work", icon: <HelpCircle size={16} />, path: "/how-does-it-work" },
    { id: "cab-inspiration", label: "Get Inspired", icon: <Palette size={16} />, path: "/cab-inspiration" },
    // Only visible when logged out
    ...(!isLoggedIn
      ? [
          // { id: "login", label: "Login", icon: <LogIn size={16} />, path: "/login" },
          // { id: "register", label: "Register", icon: <UserPlus size={16} />, path: "/register" },
        ]
      : []),
  ];

  // Entrance animation + scroll listener
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(navRef.current, { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 })
      .fromTo(logoRef.current, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, "-=0.4")
      .fromTo(actionsRef.current, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4 }, "-=0.2");

    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sidebar open logic
  const openSidebar = () => {
    if (isAnimating.current || sidebarOpen) return;
    isAnimating.current = true;
    setSidebarOpen(true);

    gsap.set(overlayRef.current, { display: "block" });
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.3 });
    gsap.fromTo(
      sidebarRef.current,
      { x: "100%" },
      {
        x: "0%",
        duration: 0.45,
        ease: "power3.out",
        onComplete: () => {
          isAnimating.current = false;
        },
      }
    );

    const bars = hamburgerRef.current.children;
    gsap.to(bars[0], { rotate: 45, y: 8, duration: 0.3 });
    gsap.to(bars[1], { opacity: 0, duration: 0.2 });
    gsap.to(bars[2], { rotate: -45, y: -8, duration: 0.3 });
  };

  // Sidebar close logic
  const closeSidebar = () => {
    if (isAnimating.current || !sidebarOpen) return;
    isAnimating.current = true;

    gsap.to(sidebarRef.current, { x: "100%", duration: 0.4, ease: "power3.in" });
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        gsap.set(overlayRef.current, { display: "none" });
        setSidebarOpen(false);
        isAnimating.current = false;
      },
    });

    const bars = hamburgerRef.current.children;
    gsap.to(bars[0], { rotate: 0, y: 0, duration: 0.3 });
    gsap.to(bars[1], { opacity: 1, duration: 0.2 });
    gsap.to(bars[2], { rotate: 0, y: 0, duration: 0.3 });
  };
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Logout / Auth action handler
  const handleAuthAction = () => {
    if (isLoggedIn) {
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      dispatch(userReset());
      if (sidebarOpen) closeSidebar();
      navigate("/login", { replace: true });
    } else {
      if (sidebarOpen) closeSidebar();
      navigate("/login");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@300;400;500;600;700&display=swap');

        :root {
          --gold:       #B08C4C;
          --gold-light: #D4AF72;
          --gold-dark:  #8B6D35;
          --cream:      #F5F0E8;
          --dark:       #1A1610;
          --text-muted: #8A7A5A;
          --white:      #FFFFFF;
        }

        /* ── NAVBAR ── */
        .meds-navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          font-family: 'Jost', sans-serif;
          transition: background 0.4s ease, box-shadow 0.4s ease;
          padding: 0 2.5rem;
         background: linear-gradient(
  90deg,
  rgba(250,248,244,1) 0%,
  rgba(241,234,223,1) 30%,
  rgba(210,194,172,1) 60%,
  rgba(138,115,96,1) 100%
);
          backdrop-filter: blur(18px) saturate(140%);
          -webkit-backdrop-filter: blur(18px) saturate(140%);
        }
        .meds-navbar.scrolled {
          background: linear-gradient(110deg, rgba(205,182,148,0.94) 0%, rgba(233,219,194,0.9) 48%, rgba(211,191,157,0.94) 100%);
          backdrop-filter: blur(20px) saturate(150%);
          -webkit-backdrop-filter: blur(20px) saturate(150%);
          box-shadow: 0 2px 40px rgba(176,140,76,0.14);
        }

        .meds-nav-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
          gap: 1.75rem;
        }

        /* ── LOGO ── */
        .meds-logo {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
          flex-shrink: 0;
        }
        .meds-logo-text { display: flex; flex-direction: column; line-height: 1.15; }
        .meds-logo-main {
          font-family: 'Jost', sans-serif;
          font-size: 1.02rem;
          font-weight: 700;
          color: var(--dark);
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .meds-logo-sub {
          font-size: 0.55rem;
          color: var(--text-muted);
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-weight: 400;
          margin-top: 3px;
        }
        .meds-logo-img {
          height: 38px;
          width: auto;
          object-fit: contain;
        }

        /* ── DESKTOP NAV LINKS (pushed to the right) ── */
        .meds-nav-links {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          list-style: none;
          margin: 0 0 0 auto;
          padding: 0;
        }
        .meds-nav-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.5rem 0.85rem;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--dark);
          text-decoration: none;
          border: none;
          background: none;
          font-family: 'Jost', sans-serif;
          transition: color 0.2s ease;
          white-space: nowrap;
          border-radius: 6px;
          cursor: pointer;
        }
        .meds-nav-link::after {
          content: '';
          position: absolute;
          left: 0.85rem;
          right: 0.85rem;
          bottom: 0.28rem;
          height: 1.5px;
          background: var(--gold);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.25s ease;
        }
        .meds-nav-link:hover { color: var(--gold-dark); }
        .meds-nav-link.active { color: var(--dark); }
        .meds-nav-link.active::after,
        .meds-nav-link:hover::after { transform: scaleX(1); }

        /* ── RIGHT ACTIONS ── */
        .meds-nav-actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-shrink: 0;
        }

        .meds-btn-demo {
          padding: 0.55rem 1.3rem;
          background: var(--gold);
          color: var(--white);
          border: 1px solid var(--gold);
          font-family: 'Jost', sans-serif;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          white-space: nowrap;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: background 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          border-radius: 999px;
        }
        .meds-btn-demo:hover {
          background: var(--gold-dark);
          border-color: var(--gold-dark);
          box-shadow: 0 6px 24px rgba(176,140,76,0.35);
        }

        .meds-btn-signin {
          padding: 0.52rem 1.25rem;
          background: transparent;
          color:black;
          border: 1.5px solid black;
          font-family: 'Jost', sans-serif;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          white-space: nowrap;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.2s ease;
          border-radius: 999px;
        }
        .meds-btn-signin:hover {
          border-color:black;
          background: rgba(176,140,76,0.08);
          color: black;
        }
        .meds-btn-signin svg { transition: transform 0.2s ease; }
        .meds-btn-signin:hover svg { transform: translateX(2px); }

        /* ── FABRICATOR / SUPPLIER ADMIN PILLS ── */
        .meds-btn-admin {
          padding: 0.48rem 1.05rem;
          background: transparent;
          color: var(--dark);
          border: 1.5px solid rgba(176,140,76,0.45);
          font-family: 'Jost', sans-serif;
          font-size: 0.66rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          white-space: nowrap;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          transition: all 0.2s ease;
        }
        .meds-btn-admin:hover {
          border-color: var(--gold);
          color: var(--gold-dark);
          background: rgba(176,140,76,0.08);
        }

        /* ── HAMBURGER ── */
        .meds-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 8px;
          background: none;
          border: none;
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .meds-hamburger:hover { background: rgba(176,140,76,0.08); }
        .meds-hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: var(--dark);
          transform-origin: center;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .meds-nav-links, .meds-btn-demo, .meds-btn-signin, .meds-btn-admin { display: none !important; }
          .meds-hamburger { display: flex; }
        }

        /* ── OVERLAY ── */
        .meds-overlay {
          position: fixed;
          inset: 0;
          background: rgba(26,22,16,0.5);
          z-index: 200;
          opacity: 0;
          display: none;
          backdrop-filter: blur(4px);
        }

        /* ── SIDEBAR ── */
        .meds-sidebar {
          position: fixed;
          top: 0; right: 0;
          width: min(360px, 88vw);
          height: 100dvh;
          background: var(--cream);
          z-index: 201;
          transform: translateX(100%);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .meds-sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 1.8rem;
          border-bottom: 1px solid rgba(176,140,76,0.2);
          flex-shrink: 0;
        }
        .meds-sidebar-close {
          width: 36px; height: 36px;
          border: 1px solid rgba(176,140,76,0.3);
          background: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          border-radius: 4px;
          color: var(--dark);
        }
        .meds-sidebar-close:hover {
          border-color: var(--gold);
          background: rgba(176,140,76,0.08);
          color: var(--gold);
        }

        .meds-sidebar-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem 1.8rem;
          border-bottom: 1px solid rgba(176,140,76,0.15);
          text-decoration: none;
          transition: background 0.2s;
        }
        .meds-sidebar-user:hover { background: rgba(176,140,76,0.05); }
        .meds-avatar {
          width: 44px; height: 44px;
          border-radius: 50%;
          border: 1.5px solid var(--gold);
          background: rgba(176,140,76,0.1);
          display: flex; align-items: center; justify-content: center;
          color: var(--gold); flex-shrink: 0;
        }
        .meds-user-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem; font-weight: 600;
          color: var(--dark); letter-spacing: 0.02em;
        }
        .meds-user-role {
          font-size: 0.68rem; color: var(--gold);
          text-transform: uppercase; letter-spacing: 0.15em; font-weight: 500;
        }

        .meds-sidebar-nav { padding: 0.75rem 0; flex: 1; }
        .meds-sidebar-section-label {
          font-size: 0.6rem; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--gold); padding: 0.75rem 1.8rem 0.35rem;
        }
        .meds-sidebar-link {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.7rem 1.8rem;
          font-family: 'Jost', sans-serif; font-size: 0.83rem; font-weight: 500;
          color: var(--dark); text-decoration: none; letter-spacing: 0.04em;
          transition: color 0.2s, background 0.2s;
          border-bottom: 1px solid rgba(176,140,76,0.08);
        }
        .meds-sidebar-link:hover { color: var(--gold); background: rgba(176,140,76,0.05); }
        .meds-sidebar-link.active {
          color: var(--gold); background: rgba(176,140,76,0.07);
          border-left: 2px solid var(--gold);
          padding-left: calc(1.8rem - 2px);
        }
        .meds-sidebar-link-icon { display: flex; align-items: center; gap: 0.7rem; }
        .meds-sidebar-link-icon-wrap {
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px; background: rgba(176,140,76,0.1);
          color: var(--gold-dark); flex-shrink: 0; transition: background 0.2s;
        }
        .meds-sidebar-link:hover .meds-sidebar-link-icon-wrap,
        .meds-sidebar-link.active .meds-sidebar-link-icon-wrap {
          background: var(--gold); color: var(--white);
        }
        .meds-sidebar-chevron {
          color: rgba(138,122,90,0.4);
          transition: color 0.2s, transform 0.2s; flex-shrink: 0;
        }
        .meds-sidebar-link:hover .meds-sidebar-chevron,
        .meds-sidebar-link.active .meds-sidebar-chevron {
          color: var(--gold); transform: translateX(2px);
        }

        .meds-sidebar-cta {
          padding: 1rem 1.8rem;
          display: flex; flex-direction: column; gap: 0.6rem;
          border-top: 1px solid rgba(176,140,76,0.15);
          flex-shrink: 0;
        }
        .meds-sidebar-cta .meds-btn-demo  { width: 100%; justify-content: center; padding: 0.8rem; }
        .meds-sidebar-cta .meds-btn-signin { width: 100%; justify-content: center; padding: 0.72rem; }

        /* Dynamic toggleable action state styles */
        .meds-sidebar-auth-action {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 0.75rem 1.8rem;
          font-family: 'Jost', sans-serif; font-size: 0.83rem; font-weight: 500;
          letter-spacing: 0.04em; 
          border: none; 
          cursor: pointer; transition: background 0.2s, color 0.2s; text-align: left;
        }
        .meds-sidebar-auth-action.logout-mode {
          color: #993C1D; background: rgba(216,90,48,0.06); border-top: 1px solid rgba(216,90,48,0.15);
        }
        .meds-sidebar-auth-action.logout-mode:hover { background: rgba(216,90,48,0.12); color: #D85A30; }
        
        .meds-sidebar-auth-action.login-mode {
          color: var(--dark); background: rgba(176,140,76,0.06); border-top: 1px solid rgba(176,140,76,0.15);
        }
        .meds-sidebar-auth-action.login-mode:hover { background: rgba(176,140,76,0.12); color: var(--gold); }

        .meds-auth-icon-wrap {
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px; flex-shrink: 0; transition: background 0.2s;
        }
        .logout-mode .meds-auth-icon-wrap { color: #993C1D; background: rgba(216,90,48,0.12); }
        .login-mode .meds-auth-icon-wrap { color: var(--dark); background: rgba(176,140,76,0.15); }

        .meds-sidebar-footer {
          padding: 0.85rem 1.8rem;
          border-top: 1px solid rgba(176,140,76,0.15);
          display: flex; justify-content: space-between; align-items: center;
          flex-shrink: 0; background: rgba(245,240,232,0.8); backdrop-filter: blur(4px);
        }
        .meds-footer-copy { font-size: 0.65rem; color: var(--text-muted); font-family: 'Jost', sans-serif; letter-spacing: 0.04em; }
        .meds-footer-version { font-size: 0.58rem; color: rgba(138,122,90,0.6); margin-top: 2px; }
        .meds-social-links { display: flex; gap: 0.5rem; }
        .meds-social-btn {
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px; border: 1px solid rgba(176,140,76,0.25);
          background: rgba(176,140,76,0.06); color: var(--text-muted);
          text-decoration: none; transition: all 0.2s;
        }
        .meds-social-btn:hover { border-color: var(--gold); color: var(--gold); background: rgba(176,140,76,0.12); }

        /* ── MAIN FOOTER ── */
        .meds-main-footer {
          position: fixed; bottom: 0; left: 0; right: 0;
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.2rem 2.5rem;
          background: #58595B; z-index: 40;
          font-family: 'Jost', sans-serif;
        }
        .meds-footer-text {
          font-size: 0.7rem; color: rgba(245,240,232,0.8);
          text-decoration: none; letter-spacing: 0.04em; transition: color 0.2s;
        }
        .meds-footer-text:hover { color: var(--gold-light); }
        .meds-footer-social { display: flex; gap: 1rem; }
        .meds-footer-icon {
          color: rgba(245,240,232,0.7); text-decoration: none; transition: color 0.2s;
        }
        .meds-footer-icon:hover { color: var(--gold-light); }

        @media (max-width: 480px) {
          .meds-navbar { padding: 0 1.2rem; }
          .meds-main-footer { padding: 0.4rem 1.2rem; }
        }
      `}</style>

      {/* ══ NAVBAR ══ */}
      <nav ref={navRef} className={`meds-navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="meds-nav-inner">
          {/* Logo */}
          <Link ref={logoRef} to="/" className="meds-logo">
            <img
              src="/logo/logo.png"
              alt="EDS"
              className="meds-logo-img"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div className="meds-logo-text" style={{ display: "none" }}>
              <span className="meds-logo-main">EDS</span>
              <span className="meds-logo-sub">My Elevator Design Studio</span>
            </div>
          </Link>

          {/* Desktop Center Links */}
          <ul className="meds-nav-links">
            {menuItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`meds-nav-link ${location.pathname === item.path ? "active" : ""}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right Actions Desktop */}
          <div ref={actionsRef} className="meds-nav-actions">
            {isLoggedIn ? (
              <button onClick={handleAuthAction} className="meds-btn-signin">
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className="meds-btn-signin">
                  Login
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </Link>
                {/* <Link to="/register" className="meds-btn-demo">
                  Get Started
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </Link> */}
              </>
            )}


<div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 cursor-pointer hover:bg-[#8c623a]/10 transition-colors duration-200 focus:outline-none flex items-center justify-center"
        aria-label="Toggle Navigation Menu"
      >
        <CiMenuKebab size={42} color="#8c623a" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg border border-[#E6E0D6] z-50 overflow-hidden">
          <div className="py-1">
            <Link
              to="/dashboard_fabricator"
              onClick={() => setIsOpen(false)}
              className="block px-5 py-3 text-sm font-medium text-[#2C2822] hover:bg-[#FAF8F5] hover:text-[#8c623a] transition-colors duration-150 border-b border-[#F0EAE1]"
            >
              Fabricator Admin
            </Link>

            <Link
              to="/supplier/dashboard"
              onClick={() => setIsOpen(false)}
              className="block px-5 py-3 text-sm font-medium text-[#2C2822] hover:bg-[#FAF8F5] hover:text-[#8c623a] transition-colors duration-150"
            >
              Supplier Admin
            </Link>
          </div>
        </div>
      )}
    </div>

            {/* Hamburger Button */}
            <button
              ref={hamburgerRef}
              className="meds-hamburger"
              onClick={openSidebar}
              aria-label="Open menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* ══ OVERLAY ══ */}
      <div ref={overlayRef} className="meds-overlay" onClick={closeSidebar} />

      {/* ══ SIDEBAR ══ */}
      <div ref={sidebarRef} className="meds-sidebar">
        {/* Header */}
        <div className="meds-sidebar-header">
          <Link to="/" className="meds-logo" onClick={closeSidebar}>
            <svg width="34" height="34" viewBox="0 0 42 42" fill="none">
              <rect x="1" y="1" width="40" height="40" rx="2" stroke="#B08C4C" strokeWidth="1.5" />
              <rect x="7" y="8" width="10" height="26" rx="1" fill="#B08C4C" fillOpacity="0.15" stroke="#B08C4C" strokeWidth="1.2" />
              <rect x="16" y="8" width="10" height="26" rx="1" fill="#B08C4C" fillOpacity="0.08" stroke="#B08C4C" strokeWidth="0.8" />
              <rect x="25" y="8" width="10" height="26" rx="1" fill="#B08C4C" fillOpacity="0.15" stroke="#B08C4C" strokeWidth="1.2" />
              <line x1="7" y1="21" x2="35" y2="21" stroke="#B08C4C" strokeWidth="1" />
            </svg>
            <div className="meds-logo-text">
              <span className="meds-logo-main" style={{ fontSize: "1.2rem" }}>EDS</span>
              <span className="meds-logo-sub">My Elevator Design Studio</span>
            </div>
          </Link>
          <button className="meds-sidebar-close" onClick={closeSidebar} aria-label="Close menu">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="2" y1="2" x2="14" y2="14" />
              <line x1="14" y1="2" x2="2" y2="14" />
            </svg>
          </button>
        </div>

        {/* User profile card (only if logged in) */}
        {isLoggedIn && (
          <Link to="/profile" className="meds-sidebar-user" onClick={closeSidebar}>
            <div className="meds-avatar"><UserCircle size={22} /></div>
            <div>
              <div className="meds-user-name">Welcome, Designer</div>
              <div className="meds-user-role">Premium Member</div>
            </div>
          </Link>
        )}

        {/* Dynamic Sidebar Links */}
        <nav className="meds-sidebar-nav">
          <div className="meds-sidebar-section-label">Navigation</div>
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              onClick={closeSidebar}
              className={`meds-sidebar-link ${location.pathname === item.path ? "active" : ""}`}
            >
              <div className="meds-sidebar-link-icon">
                <div className="meds-sidebar-link-icon-wrap">{item.icon}</div>
                <span>{item.label}</span>
              </div>
              <ChevronRight size={14} className="meds-sidebar-chevron" />
            </Link>
          ))}
        </nav>

        {/* Conditional Action Control Button (Login / Logout text variant) */}
        <button
          onClick={handleAuthAction}
          className={`meds-sidebar-auth-action ${isLoggedIn ? "logout-mode" : "login-mode"}`}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <div className="meds-auth-icon-wrap">
              {isLoggedIn ? <LogOut size={16} /> : <LogIn size={16} />}
            </div>
            <span>{isLoggedIn ? "Logout" : "Login"}</span>
          </div>
          <ChevronRight size={14} style={{ color: isLoggedIn ? "#993C1D" : "var(--gold)", flexShrink: 0 }} />
        </button>

        {/* Footer */}
        <div className="meds-sidebar-footer">
          <div>
            <div className="meds-footer-copy">My Elevator Design Studio</div>
            <div className="meds-footer-version">Version 2.1.0</div>
          </div>
          <div className="meds-social-links">
            <a href="#" className="meds-social-btn" aria-label="Facebook"><FaFacebookF size={12} /></a>
            <a href="#" className="meds-social-btn" aria-label="Instagram"><FaInstagram size={12} /></a>
            <a href="#" className="meds-social-btn" aria-label="Pinterest"><FaPinterestP size={12} /></a>
          </div>
        </div>
      </div>

      {/* ══ MAIN FOOTER ══ */}
      <footer className="meds-main-footer">
        <Link to="/" className="meds-footer-text">My Elevator Design Studio</Link>
        <div className="meds-footer-social">
          <a href="#" className="meds-footer-icon" aria-label="Facebook"><FaFacebookF size={14} /></a>
          <a href="#" className="meds-footer-icon" aria-label="Instagram"><FaInstagram size={14} /></a>
          <a href="#" className="meds-footer-icon" aria-label="Pinterest"><FaPinterestP size={14} /></a>
        </div>
      </footer>
    </>
  );
};

export default Navbar;