// src/pages/Profile.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";

import { gsap } from "gsap";

import {
  getUserProjects,
  createProject,
  projectReset,
  duplicateProject,
  deleteProject,
} from "../redux/features/Project/projectSlice";
import {
  FilePenLine,
  PlusCircle,
  Search,
  X,
  Lightbulb,
  Box,
  HelpCircle,
  ArrowRight,
  Lock,
  Mail,
  ChevronRight,
  ChevronDown,
  Layers,
  Eye,
  ClipboardCheck,
  Copy,
  Trash2,
  User,
  LayoutGrid,
  List,
  Play,
} from "lucide-react";
import { GoArrowRight, GoBriefcase } from "react-icons/go";
import ProjectsGrid from "./components/ProjectsGrid";
import { useToast } from "../context/useToast";
import { RiUser3Line } from "react-icons/ri";
import { FaUserAlt } from "react-icons/fa";
import { FiUserCheck } from "react-icons/fi";
import { CiCirclePlus } from "react-icons/ci";

// ── Shared style tokens ────────────────────────────────────────────────────────
const ACCENT = "#A17C50";
const INK = "#241F19";

const glassCard = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(161,124,80,0.18)",
  borderRadius: "12px",
  boxShadow:
    "0 8px 32px rgba(161,124,80,0.10), inset 0 1px 0 rgba(255,255,255,0.7)",
};

const inputStyle = {
  background: "rgba(255,255,255,0.6)",
  border: "1px solid rgba(161,124,80,0.22)",
  borderRadius: "8px",
  color: "#2C2822",
  fontFamily: "inherit",
  backdropFilter: "blur(6px)",
  outline: "none",
  transition: "border-color .2s, box-shadow .2s",
};

const labelStyle = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(161,124,80,0.75)",
};

// Soft, brand-tinted card shadow used across quick-action tiles / stat pills
const tileShadow =
  "0 14px 28px -12px rgba(36,31,25,0.16), 0 2px 6px -1px rgba(36,31,25,0.06)";
const tileShadowHover =
  "0 20px 36px -14px rgba(161,124,80,0.30), 0 4px 10px -2px rgba(36,31,25,0.08)";

// ── Time-ago helper (used on project cards) ─────────────────────────────────
function timeAgo(dateInput) {
  if (!dateInput) return "recently";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "recently";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  const units = [
    ["y", 31536000],
    ["mo", 2592000],
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
  ];
  for (const [label, secs] of units) {
    const val = Math.floor(seconds / secs);
    if (val >= 1) return `${val}${label} ago`;
  }
  return "just now";
}

// ── Small reusable components ──────────────────────────────────────────────────

function SectionDot({ color }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: color || ACCENT }}
    />
  );
}

// ── Shared modal shell (backdrop + entrance animation) ─────────────────────────
function ModalShell({ isOpen, children, maxWidth = "max-w-md" }) {
  const modalRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      gsap.fromTo(
        modalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      );
      gsap.fromTo(
        contentRef.current,
        { scale: 0.94, y: 28, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: "back.out(0.7)" }
      );
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(36,31,25,0.62)", backdropFilter: "blur(8px)" }}
    >
      <div ref={contentRef} className={`relative w-full ${maxWidth}`} style={glassCard}>
        {children}
      </div>
    </div>
  );
}

// ── Create Project Modal ───────────────────────────────────────────────────────
function CreateProjectModal({ isOpen, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({ name: "", company: "" });

  useEffect(() => {
    if (isOpen) setFormData({ name: "", company: "" });
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, e);
  };

  return (
    <ModalShell isOpen={isOpen}>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderBottom: "1px solid rgba(161,124,80,0.12)" }}>
        <div className="flex items-center gap-2">
          <SectionDot />
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#2C2822" }}>
            Create New Project
          </h3>
        </div>
        <button onClick={onClose} className="transition-opacity hover:opacity-60" style={{ color: "rgba(161,124,80,0.6)" }}>
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        <div>
          <label style={labelStyle} className="block mb-1.5">Project Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={inputStyle}
            className="w-full px-3 py-2.5 text-sm"
            placeholder="e.g. Residential Tower Lift"
            onFocus={(e) => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px rgba(161,124,80,0.1)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(161,124,80,0.22)"; e.target.style.boxShadow = "none"; }}
            required
          />
        </div>
        <div>
          <label style={labelStyle} className="block mb-1.5">Company Name *</label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            style={inputStyle}
            className="w-full px-3 py-2.5 text-sm"
            placeholder="e.g. ABC Elevators Pvt Ltd"
            onFocus={(e) => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px rgba(161,124,80,0.1)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(161,124,80,0.22)"; e.target.style.boxShadow = "none"; }}
            required
          />
        </div>

        <div className="flex gap-3 pt-3">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white rounded-lg disabled:opacity-50 transition-all"
            style={{ backgroundColor: ACCENT, boxShadow: "0 6px 20px -4px rgba(161,124,80,0.4), inset 0 1px 0 rgba(255,255,255,0.2)" }}
          >
            {isLoading ? "Creating…" : "Create Project"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
            style={{ background: "rgba(161,124,80,0.08)", color: "rgba(161,124,80,0.7)", border: "1px solid rgba(161,124,80,0.2)" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Confirm Modal (replaces window.confirm — used for Delete) ─────────────────
function ConfirmModal({ isOpen, title, message, confirmLabel = "Confirm", onConfirm, onCancel, danger = true }) {
  return (
    <ModalShell isOpen={isOpen}>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderBottom: "1px solid rgba(161,124,80,0.12)" }}>
        <div className="flex items-center gap-2">
          <SectionDot color={danger ? "#B3452F" : ACCENT} />
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#2C2822" }}>
            {title}
          </h3>
        </div>
        <button onClick={onCancel} className="transition-opacity hover:opacity-60" style={{ color: "rgba(161,124,80,0.6)" }}>
          <X size={18} />
        </button>
      </div>

      <div className="p-4 pb-1">
        <p className="text-xs leading-relaxed" style={{ color: "#7A705F" }}>{message}</p>
      </div>

      <div className="flex gap-3 p-4 pt-3">
        <button
          onClick={onConfirm}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white rounded-lg transition-all"
          style={{ backgroundColor: danger ? "#B3452F" : ACCENT, boxShadow: "0 6px 20px -4px rgba(161,124,80,0.4), inset 0 1px 0 rgba(255,255,255,0.2)" }}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
          style={{ background: "rgba(161,124,80,0.08)", color: "rgba(161,124,80,0.7)", border: "1px solid rgba(161,124,80,0.2)" }}
        >
          Cancel
        </button>
      </div>
    </ModalShell>
  );
}

// ── Duplicate Modal (replaces window.prompt) ────────────────────────────────
function DuplicateModal({ isOpen, initialName, onConfirm, onCancel }) {
  const [name, setName] = useState(initialName || "");

  useEffect(() => {
    setName(initialName || "");
  }, [initialName, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) onConfirm(name.trim());
  };

  return (
    <ModalShell isOpen={isOpen}>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderBottom: "1px solid rgba(161,124,80,0.12)" }}>
        <div className="flex items-center gap-2">
          <SectionDot />
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#2C2822" }}>
            Duplicate Project
          </h3>
        </div>
        <button onClick={onCancel} className="transition-opacity hover:opacity-60" style={{ color: "rgba(161,124,80,0.6)" }}>
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        <div>
          <label style={labelStyle} className="block mb-1.5">New Project Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            className="w-full px-3 py-2.5 text-sm"
            placeholder="e.g. Residential Tower Lift (Copy)"
            autoFocus
            required
            onFocus={(e) => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = "0 0 0 3px rgba(161,124,80,0.1)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(161,124,80,0.22)"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white rounded-lg transition-all"
            style={{ backgroundColor: ACCENT, boxShadow: "0 6px 20px -4px rgba(161,124,80,0.4), inset 0 1px 0 rgba(255,255,255,0.2)" }}
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
            style={{ background: "rgba(161,124,80,0.08)", color: "rgba(161,124,80,0.7)", border: "1px solid rgba(161,124,80,0.2)" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Quick-action tile (top row of the main column) ──────────────────────────
function QuickActionTile({ icon: Icon, title, subtitle, onClick }) {
  const ref = useRef(null);
  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => gsap.to(ref.current, { y: -3, boxShadow: tileShadowHover, duration: 0.22 })}
      onMouseLeave={() => gsap.to(ref.current, { y: 0, boxShadow: tileShadow, duration: 0.22 })}
      className="flex items-center gap-3 text-left rounded-lg bg-[#FAF7F2] p-3 w-full h-full"
      style={{ fontFamily: "inherit", boxShadow: tileShadow, border: "1px solid rgba(230,224,214,0.9)" }}
    >
      <span
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ color: "#9F6E20",  }}
      >
        <Icon size={30} strokeWidth={1.7} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold" style={{ color: "#2C2822" }}>{title}</span>
        <span className="block text-[10px] truncate" style={{ color: "#9A8F7C" }}>{subtitle}</span>
      </span>
      <GoArrowRight size={16} color="#B8AD98" className="flex-shrink-0" />
    </button>
  );
}

// ── Single project card (matches the reference image's card layout) ─────────
function ProjectCard({ project, onOpen, onEdit, onDuplicate, onDelete, layout = "grid" }) {
  const isList = layout === "list";
  return (
    <div
      className={`bg-white border border-[#E6E0D6] rounded-lg overflow-hidden transition-shadow hover:shadow-md ${isList ? "flex items-center" : "flex flex-col"}`}
    >
      <div
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
        className={`relative cursor-pointer overflow-hidden flex items-center justify-center flex-shrink-0 ${isList ? "w-20 h-16" : "h-20 w-full"}`}
        style={{ background: "linear-gradient(135deg, #2C2822, #4A4032)" }}
      >
        <Box size={20} className="text-white/25" />
        <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
      </div>

      <div className={`p-2 flex flex-col gap-0.5 flex-1 min-w-0 ${isList ? "flex-row items-center justify-between" : ""}`}>
        <div className="min-w-0">
          <h4 onClick={onOpen} className="text-xs font-bold cursor-pointer truncate" style={{ color: "#2C2822" }}>
            {project.name}
          </h4>
          <p className="text-[10px] truncate" style={{ color: "#9A8F7C" }}>{project.company}</p>
          {!isList && <p className="text-[9px] mb-1" style={{ color: "#B8AD98" }}>Modified {timeAgo(project.createdAt)}</p>}
        </div>

        <div className={`flex items-center gap-3 ${isList ? "" : "mt-auto pt-2 border-t"}`} style={!isList ? { borderColor: "#F0EAE1" } : {}}>
          {isList && <span className="text-[9px] mr-1 whitespace-nowrap" style={{ color: "#B8AD98" }}>{timeAgo(project.createdAt)}</span>}
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit" className="transition-colors" style={{ color: "#9A8F7C" }}>
            <FilePenLine size={13} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} title="Duplicate" className="transition-colors" style={{ color: "#9A8F7C" }}>
            <Copy size={13} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete" className={`transition-colors ${isList ? "" : "ml-auto"}`} style={{ color: "#9A8F7C" }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stat pill for the My Projects header ─────────────────────────────────────
function StatPill({ value, label }) {
  return (
    <div
      className="flex-1 min-w-[70px] rounded-md bg-[#F1EAE2] px-3 py-1 text-center border border-[#E6E0D6]"
      style={{ boxShadow: "0 6px 16px -8px rgba(36,31,25,0.12)" }}
    >
      <p className="text-sm font-bold leading-none" style={{ color: "#2C2822" }}>{value}</p>
      <p className="text-[8px] font-bold uppercase tracking-wider mt-1" style={{ color: "#B8AD98" }}>{label}</p>
    </div>
  );
}

// ── Main Profile Component ─────────────────────────────────────────────────────
const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const containerRef = useRef(null);
  const headerRef = useRef(null);

  const {
    projects,
    projectLoading,
    projectSuccess,
    projectError,
    projectMessage,
    lastCreatedSubprojectId,
  } = useSelector((state) => state.project);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState("date");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [viewLayout, setViewLayout] = useState("grid"); // "grid" | "list"
  const [expandedProjects, setExpandedProjects] = useState(false);

  // ── modal-driven state for delete/duplicate (replaces window.confirm/prompt) ──
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [duplicateTarget, setDuplicateTarget] = useState(null);

  // ── Fetch on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(getUserProjects());
  }, [dispatch]);

  // ── Entrance animation ─────────────────────────────────────────────────────
  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: "power2.out" }
    ).fromTo(headerRef.current,
      { opacity: 0, y: -16 },
      { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" },
      "-=0.2"
    );
  }, []);

  // ── Toast + reset + redirect ───────────────────────────────────────────────
  useEffect(() => {
    if (projectSuccess) {
      toast.success(projectMessage || "Operation successful");

      if (projectMessage?.toLowerCase().includes("created") && lastCreatedSubprojectId) {
        const subId = lastCreatedSubprojectId;
        dispatch(projectReset());
        navigate(`/design/${subId}`); // ✅ subproject id, NOT project id
        return;
      }

      dispatch(projectReset());
    }

    if (projectError) {
      toast.error(projectMessage || "Something went wrong");
      dispatch(projectReset());
    }
  }, [projectSuccess, projectError, projectMessage, lastCreatedSubprojectId, navigate, dispatch]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateProject = (formData, e) => {
    e?.preventDefault();
    if (!formData.name.trim() || !formData.company.trim()) {
      return toast.error("Project name and company are required");
    }
    dispatch(createProject(formData));
    setShowCreateModal(false);
  };

  const handleDelete = (projectId) => setDeleteTarget(projectId);

  const confirmDelete = () => {
    if (deleteTarget) dispatch(deleteProject(deleteTarget));
    setDeleteTarget(null);
  };

  const handleDuplicate = (projectId) => {
    const found = projects.find((p) => p._id === projectId);
    setDuplicateTarget({ id: projectId, name: `${found?.name || ""} (Copy)` });
  };

  const confirmDuplicate = (newName) => {
    if (duplicateTarget) dispatch(duplicateProject({ id: duplicateTarget.id, newName }));
    setDuplicateTarget(null);
  };

  const handleEdit = () => toast.info("Edit project name/company — coming soon");

  // ── Client-side filter & sort ──────────────────────────────────────────────
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (sortMode === "az") return a.name.localeCompare(b.name);
        if (sortMode === "za") return b.name.localeCompare(a.name);
        if (sortMode === "date") return new Date(b.createdAt) - new Date(a.createdAt);
        return 0;
      });
  }, [projects, searchTerm, sortMode]);

  // ── Header stats (falls back gracefully if fields are absent) ──────────────
  const stats = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter((p) => p.status === "completed" || p.completed).length;
    const archived = projects.filter((p) => p.status === "archived" || p.archived).length;
    const inProgress = Math.max(total - completed - archived, 0);
    return { total, inProgress, completed, archived };
  }, [projects]);

  const sortOptions = [
    { key: "date", label: "Last Modified" },
    { key: "az", label: "Name A → Z" },
    { key: "za", label: "Name Z → A" },
  ];
  const currentSortLabel = sortOptions.find((s) => s.key === sortMode)?.label || "Sort";

  // ── Quick-action tiles (top of the main 8-col area) ─────────────────────────
  const quickActions = [
    { icon: Lightbulb, title: "Get Inspired", subtitle: "Explore ideas & designs", onClick: () => toast.info("Get Inspired — coming soon") },
    { icon: PlusCircle, title: "Start New Project", subtitle: "Create a new design", onClick: () => setShowCreateModal(true) },
    { icon: Box, title: "Sample Box", subtitle: "Order material samples", onClick: () => toast.info("Sample Box — coming soon") },
    { icon: HelpCircle, title: "Help Center", subtitle: "Guides & support", onClick: () => toast.info("Help Center — coming soon") },
  ];

  // ── The 4 steps shown in the hero banner ─────────────────────────────────────
  const guideSteps = [
    { icon: Box, title: "CHOOSE CONFIGURATION", description: "Select your base elevator layout" },
    { icon: Layers, title: "CUSTOMIZE DETAILS", description: "Pick materials, panels, handrails & more" },
    { icon: Eye, title: "REVIEW IN 3D", description: "See your design in realistic 3D" },
    { icon: ClipboardCheck, title: "SAVE & SHARE", description: "Download, share or request a quote" },
  ];

  return (
    <div
      ref={containerRef}
      className="h-screen w-full relative overflow-hidden flex flex-col"
      style={{
        backgroundColor: "#F7F4ED",
        fontFamily: "'DM Sans', sans-serif",
        opacity: 0,
        paddingTop: "40px",   /* clear fixed navbar */
        paddingBottom: "10px", /* clear fixed footer */
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        input::placeholder { color: rgba(120,106,88,0.4); }
        .projects-scroll::-webkit-scrollbar { width: 6px; }
        .projects-scroll::-webkit-scrollbar-track { background: transparent; }
        .projects-scroll::-webkit-scrollbar-thumb { background: rgba(161,124,80,0.25); border-radius: 999px; }
        .projects-scroll::-webkit-scrollbar-thumb:hover { background: rgba(161,124,80,0.4); }
      `}</style>

      {/* Ambient glow blobs */}
      <div className="fixed top-0 left-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(161,124,80,0.07) 0%, transparent 70%)", zIndex: 0 }} />
      <div className="fixed bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(161,124,80,0.05) 0%, transparent 70%)", zIndex: 0 }} />

      <div ref={headerRef} className="relative z-10 flex-1 min-h-0 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-9 pb-5.5 flex flex-col">

        {/* ── Main layout: sidebar (4 cols) + everything else (8 cols) ── */}
        <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">

          {/* ══════════════════ Sidebar — 4 cols ══════════════════ */}
          <div className="lg:w-[320px] w-full flex-shrink-0 flex flex-col gap-2 min-h-0">

            {/* My Account — dark card, matches the reference image */}
            <div className="bg-[#1B1B1B] text-white p-3 relative overflow-hidden flex flex-col rounded-lg border border-white/10 flex-shrink-0" style={{ boxShadow: tileShadow }}>
              <div className="absolute -right-10 -bottom-10 w-44 h-14 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(161,124,80,0.14) 0%, transparent 70%)" }} />

              <div className="relative z-10 flex flex-col">
                <div className="flex items-center justify-between mb-2.5 pb-2.5 border-b border-white/10">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/90">
                    <FiUserCheck size={24} color="#A17C50" />
                    My Account
                  </span>
               <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-[#2A3B2A]/15 text-[#8AAB88] border border-[#8AAB88]">
  Active
</span>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <img
                    src="/123.jpg"
                    alt="Profile"
                    className="w-40 h-50 object-cover rounded-lg border border-white/15 flex-shrink-0"
                  />
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-lg font-medium text-white/85 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Welcome back,
                    </h3>
                    <p className="text-xl text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Alex!</p>
                    <p className="text-[11px] text-white/50 mt-1">Let's create something extraordinary.</p>
                  </div>
                </div>

                <div className="flex flex-col  mb-4">
                  <Link to="/profile-edit" className="flex items-center gap-3 p-2  border-b border-[#A17C50]  hover:bg-white/10 transition-colors group/row">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{  color: "#C9AA82" }}>
                      <RiUser3Line size={20} color="#A17C50"  />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold">Edit Profile</span>
                      <span className="block text-[10px] text-white/45">Manage your personal information</span>
                    </span>
                    <ChevronRight size={14} className="text-[#A17C50] group-hover/row:text-[#C9AA82] group-hover/row:translate-x-0.5 transition-all" />
                  </Link>
                  <Link to="/profile-edit" className="flex items-center gap-3 p-2  border-b border-[#A17C50] hover:bg-white/10 transition-colors group/row">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{  color: "#C9AA82" }}>
                      <Lock size={20} color="#A17C50"  />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold">Security &amp; Password</span>
                      <span className="block text-[10px] text-white/45">Update your login credentials</span>
                    </span>
                    <ChevronRight size={14} className="text-[#A17C50] group-hover/row:text-[#C9AA82] group-hover/row:translate-x-0.5 transition-all" />
                  </Link>
                  <Link to="/profile-edit" className="flex items-center gap-3 p-2  border-b border-[#A17C50] hover:bg-white/10 transition-colors group/row">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{  color: "#C9AA82" }}>
                      <Mail size={20}  color="#A17C50" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold">Contact Information</span>
                      <span className="block text-[10px] text-white/45">Update your contact details</span>
                    </span>
                    <ChevronRight size={14} className="text-[#A17C50] group-hover/row:text-[#C9AA82] group-hover/row:translate-x-0.5 transition-all" />
                  </Link>
                </div>

                <Link
                  to="/profile-edit"
                  className="inline-flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-[#A17C50] text-[#A17C50] hover:bg-white/10 transition-colors"
                >
                  View Account Details
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Create New Project — sits below My Account, same column */}
            <div
              className="bg-white border border-[#E6E0D6] p-4 flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-transform hover:scale-[1.01] rounded-lg flex-1 min-h-0"
              onClick={() => setShowCreateModal(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setShowCreateModal(true)}
              style={{ boxShadow: tileShadow }}
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ borderColor: "rgba(161,124,80,0.4)" }}>
                <CiCirclePlus  size={46} style={{ color: ACCENT }} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#2C2822" }}>
                  Start a New Project
                </p>
                <p className="text-[11px] leading-relaxed max-w-[220px]" style={{ color: "#9A8F7C" }}>
                  Click to create a new elevator interior design from scratch
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white rounded-lg transition-all"
                style={{ backgroundColor: ACCENT, boxShadow: "0 6px 20px -4px rgba(161,124,80,0.4), inset 0 1px 0 rgba(255,255,255,0.2)" }}
              >
                Create New Project
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* ══════════════════ Main content — 8 cols ══════════════════ */}
          <div className="flex-1 min-w-0 flex flex-col gap-2 min-h-0">

            {/* Quick-action tiles — shadowed cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
              {quickActions.map((action) => (
                <QuickActionTile key={action.title} {...action} />
              ))}
            </div>

            {/* Hero — Quick Start Guide (compact) */}
            <div
              className="relative overflow-hidden rounded-lg border border-[#E2D8C7] flex-shrink-0"
              style={{ 
  background: "radial-gradient(circle at center, #F1EAE2 0%, #C6BAAE 100%)", 
  boxShadow: tileShadow 
}}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch" style={{ height: "298px" }}>

                {/* Left Content Area */}
                <div className="lg:col-span-7 px-4 py-8 flex flex-col justify-center gap-8  min-w-0">
                  <div className="mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest block mb-0.5 text-[#A47C45]">
                      Quick start guide
                    </span>
                    <h2 className="text-sm sm:text-2xl font-bold leading-snug text-[#24201D]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      Design your elevator in 4 easy steps
                    </h2>
                    <p className="text-[11px] text-[#24201D] leading-tighter mt-1" style={{ maxWidth: "400px" }}>
                      From concept to completion --- bring your vision to life.
                    </p>
                  </div>

                  {/* Steps Row */}
                  <div className="relative flex items-start justify-between">
  {/* Dashed Connecting Line (Stretched absolute background line) */}
  <div className="absolute top-[34px] left-[10%] right-[10%] border-t-2 border-dashed border-[#C5B7A2]/70 z-0" />

  {guideSteps.map((step, i) => (
    <div key={step.title} className="flex flex-col items-center text-center flex-1 px-2 z-10">
      
      {/* Number Badge */}
      <div className="w-6 h-6 rounded-full bg-[#A47C45] text-white text-[11px] font-bold flex items-center justify-center mb-2 shadow-sm ">
        {i + 1}
      </div>

      {/* Icon Container with subtle background tile */}
      <div className="w-12 h-12 rounded-lg bg-white/40 border border-[#A47C45]/20 flex items-center justify-center mb-2 text-[#A47C45] shadow-xs backdrop-blur-xs">
        <step.icon size={24} strokeWidth={1.8} />
      </div>

      {/* Full Step Title */}
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#24201D] mb-1 leading-snug">
        {step.title}
      </p>

      {/* Full Step Description */}
      <p className="text-[10px] text-[#736859] leading-tight max-w-[130px]">
        {step.description}
      </p>

    </div>
  ))}
</div>
                </div>

                {/* Right Image Container */}
                <div
                  onClick={() => navigate("/how-does-it-work")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && navigate("/how-does-it-work")}
                  className="lg:col-span-5 relative overflow-hidden group cursor-pointer h-full"
                >
                  <img
                    src="/ProfileImage.png"
                    alt="Elevator preview"
                    className="w-full h-[300px] object-center transition-transform duration-700 ease-out"
                  />
                  <div className="absolute bottom-8 right-2">
                   <button
                type="button"
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-md bg-[#1E1B18]/90 hover:bg-[#1E1B18] text-white text-[11px] font-bold tracking-widest uppercase shadow-lg backdrop-blur-sm transition-all"
              >
                <div className="w-4 h-4 rounded-full border border-white/60 flex items-center justify-center">
                  <Play size={8} className="fill-white translate-x-[0.5px]" color="#A47C45"/>
                </div>
                WATCH 10 STEPS TUTORIAL
              </button>
                  </div>
                </div>
              </div>
            </div>

            {/* My Projects — header (fixed) + scrollable card area */}
            <div className="bg-[#F8F5F0] border border-[#E6E0D6] rounded-lg flex-1 min-h-0 flex flex-col overflow-hidden" style={{ boxShadow: tileShadow }}>

  {/* Fixed Header Container */}
  <div className="px-4 py-2 sm:px-4  flex-shrink-0" >
    
    {/* ROW 1: Title & Controls */}
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-2">
      
      {/* Top Left: Title & Subtitle */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <GoBriefcase className="text-[15px]" style={{ color: ACCENT }} />
          <h2 className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: "#2C2822" }}>
            My Projects
          </h2>
        </div>
        <p className="text-[11px]" style={{ color: "#7A705F" }}>
          Access your projects or continue where you left off.
        </p>
      </div>

      {/* Top Right: Search + Sort + View Switcher */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        
        {/* Search Input */}
        <div className="relative w-48 sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#A17C50" }} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-lg border border-[#E6E0D6] outline-none shadow-xs placeholder-[#B0A595]"
          />
        </div>

        {/* Sort Menu */}
        <div className="relative flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A17C50]">
            SORT BY
          </span>
          <button
            onClick={() => setSortMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-white border border-[#E6E0D6] rounded-lg text-[#2C2822]"
          >
            {currentSortLabel}
            <ChevronDown size={12} className={`transition-transform ${sortMenuOpen ? "rotate-180" : ""}`} />
          </button>
          
          {sortMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-20 bg-white rounded-lg border border-[#E6E0D6] py-1 z-20 shadow-lg"
            >
              {sortOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setSortMode(opt.key); setSortMenuOpen(false); }}
                  className="w-full text-left px-3 py-1 text-[9px] hover:bg-[#F7F4ED] transition-colors"
                  style={{ color: sortMode === opt.key ? ACCENT : "#4A4032", fontWeight: sortMode === opt.key ? 700 : 500 }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid / List Layout Switcher */}
        <div className="flex items-center bg-white p-0.5 rounded-lg border border-[#E6E0D6]">
          <button
            onClick={() => setViewLayout("grid")}
            className={`p-1.5 rounded-md transition-all ${viewLayout === "grid" ? "text-white shadow-xs" : "text-[#A17C50]/60 hover:text-[#A17C50]"}`}
            style={{ background: viewLayout === "grid" ? ACCENT : "transparent" }}
            title="Grid view"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewLayout("list")}
            className={`p-1.5 rounded-md transition-all ${viewLayout === "list" ? "text-white shadow-xs" : "text-[#A17C50]/60 hover:text-[#A17C50]"}`}
            style={{ background: viewLayout === "list" ? ACCENT : "transparent" }}
            title="List view"
          >
            <List size={15} />
          </button>
        </div>

      </div>
    </div>

    {/* ROW 2: Stat Pills Grid (Below header controls) */}
    <div className="flex items-center justify-between gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
        <StatPill value={stats.total} label="TOTAL" />
        <StatPill value={stats.inProgress} label="IN PROGRESS" />
        <StatPill value={stats.completed} label="COMPLETED" />
        <StatPill value={stats.archived} label="ARCHIVED" />
      </div>

      {/* View All / Expand Option */}
      {filteredProjects.length > 0 && (
        <button
          onClick={() => setExpandedProjects((v) => !v)}
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest hover:opacity-70 whitespace-nowrap pl-3"
          style={{ color: ACCENT  }}
        >
          {expandedProjects ? "Show Less" : "View All"}
          <ChevronRight size={12} className={`transition-transform ${expandedProjects ? "rotate-90" : ""}`} />
        </button>
      )}
    </div>

  </div>

  {/* Scrollable Project Cards Region */}
  <div
    className="projects-scroll px-3 sm:px-3 flex-1 min-h-0 overflow-y-auto"
    style={{ maxHeight: expandedProjects ? "560px" : "320px", transition: "max-height .35s ease" }}
  >
    {projectLoading ? (
      <p className="text-xs text-center py-8 text-[#9A8F7C]">Loading projects…</p>
    ) : filteredProjects.length === 0 ? (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <p className="text-xs font-semibold text-[#2C2822]">No projects found</p>
        <p className="text-[11px] text-[#9A8F7C]">
          {searchTerm ? "Try a different search term." : "Create your first project to get started."}
        </p>
      </div>
    ) : (
      <div className={viewLayout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3" : "flex flex-col gap-2"}>
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project._id}
            project={project}
            layout={viewLayout}
            onOpen={() => navigate(`/project/${project._id}`)}
            onEdit={() => handleEdit(project._id)}
            onDuplicate={() => handleDuplicate(project._id)}
            onDelete={() => handleDelete(project._id)}
          />
        ))}
      </div>
    )}
  </div>

</div>
          </div>
        </div>
      </div>

      {/* ── Create Project Modal ── */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
        isLoading={projectLoading}
      />

      {/* ── Delete Confirm Modal (replaces window.confirm) ── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Project"
        message={`Are you sure you want to delete "${projects.find((p) => p._id === deleteTarget)?.name || "this project"}"? This will delete all its designs too. This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Duplicate Modal (replaces window.prompt) ── */}
      <DuplicateModal
        isOpen={!!duplicateTarget}
        initialName={duplicateTarget?.name}
        onConfirm={confirmDuplicate}
        onCancel={() => setDuplicateTarget(null)}
      />
    </div>
  );
};

export default Profile;