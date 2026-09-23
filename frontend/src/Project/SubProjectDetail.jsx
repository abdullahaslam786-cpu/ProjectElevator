import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { gsap } from "gsap";
import { HiDownload } from "react-icons/hi";
import { IoCopyOutline } from "react-icons/io5";
import { MdDeleteForever, MdOutlineModeEdit } from "react-icons/md";

import {
  deleteSubproject,
  duplicateSubproject,
} from "../redux/features/Project/projectSlice";

/* ---------- design tokens ---------- */
const BRASS = "#A17C50";
const BRASS_DARK = "#8B6942";
const INK = "#2C2822";
const MUTE = "#7A705F";

const glassCard = {
  background: "rgba(255,255,255,0.6)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: `1px solid ${BRASS}2e`,
  borderRadius: "14px",
  boxShadow: "0 10px 30px rgba(161,124,80,0.12), inset 0 1px 0 rgba(255,255,255,0.75)",
};

const eyebrow = {
  fontSize: "10.5px",
  fontWeight: 800,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: `${BRASS}bf`,
};

const fieldBox =
  "w-full px-3 py-2 text-sm rounded-md border bg-white/70 focus:outline-none focus:ring-1";

/* ---------- small building blocks ---------- */
function IconBtn({ icon, label, onClick, danger = false }) {
  const ref = useRef(null);
  return (
    <button
      ref={ref}
      onClick={onClick}
      title={label}
      onMouseEnter={() => gsap.to(ref.current, { y: -2, duration: 0.15 })}
      onMouseLeave={() => gsap.to(ref.current, { y: 0, duration: 0.15 })}
      className="flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-white/70 transition-colors"
      style={{ color: danger ? "#B03A2E" : BRASS }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span className="text-[9.5px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex items-center gap-2">
      <label style={eyebrow} className="w-[100px] shrink-0">
        {label}
      </label>
      {children}
    </div>
  );
}

function Stat({ tag, text }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex items-center justify-center font-black text-[11px] rounded"
        style={{ width: 22, height: 22, background: "white", color: BRASS, border: `1px solid ${BRASS}33` }}
      >
        {tag}
      </span>
      <span className="text-[13px]" style={{ color: INK }}>
        {text}
      </span>
    </div>
  );
}

/* ---------- main component ---------- */
const SubProjectDetail = ({ subproject, projectId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const currentProjectId = useSelector((state) => state.project.currentProjectId);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
    );
  }, []);

  if (!subproject) {
    return <div className="p-2 text-center text-gray-500 text-xs">No design selected</div>;
  }

  const handleDelete = () => {
    if (window.confirm("Delete this design? This cannot be undone.")) {
      dispatch(deleteSubproject({ projectId, subId: subproject._id }));
    }
  };

  const handleDuplicate = () => {
    const newName = prompt("New elevator name:", `${subproject.elevatorName} (Copy)`);
    if (newName && newName.trim()) {
      dispatch(
        duplicateSubproject({
          projectId,
          subId: subproject._id,
          newElevatorName: newName.trim(),
        })
      );
    }
  };

  const handleEdit = () => navigate(`/design/${subproject._id}`);

  return (
    <div
      ref={cardRef}
      style={glassCard}
      className="w-full h-[65vh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-3.5 shrink-0"
        style={{ borderBottom: `1px solid ${BRASS}1f`, background: "rgba(255,255,255,0.5)" }}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <img
            src="/123456.jpg"
            alt="Elevator preview"
            className="w-14 h-14 rounded-lg object-cover shrink-0"
            style={{ border: `1px solid ${BRASS}33` }}
          />
          <div className="min-w-0">
            <p
              className="text-xl leading-tight truncate"
              style={{ fontFamily: "'Playfair Display', serif", color: INK }}
            >
              {subproject.elevatorName}
            </p>
            <span
              className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
              style={{ background: `${BRASS}1a`, color: BRASS }}
            >
              {subproject.status || "In Progress"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
  {/* Primary Highlighted & Animated Edit Button */}
  <button
    type="button"
    onClick={handleEdit}
    className="relative group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-semibold text-xs transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md animate-pulse hover:animate-none"
    style={{ background: BRASS }}
    title="Edit Subproject"
  >
    <MdOutlineModeEdit className="text-lg transition-transform duration-300 group-hover:rotate-12" />
    <span>Edit</span>
    
    {/* Subtle pulsing outer ring glow */}
    <span 
      className="absolute -inset-0.5 rounded-lg opacity-40 blur-xs animate-ping pointer-events-none"
      style={{ background: BRASS }}
    />
  </button>

  {/* Secondary Action Buttons */}
  <IconBtn icon={<IoCopyOutline className="text-sm" />} label="Copy" onClick={handleDuplicate} />
  <IconBtn icon={<MdDeleteForever className="text-sm" />} label="Delete" onClick={handleDelete} danger />

  {/* Divider */}
  <div className="w-px h-8 mx-1" style={{ background: `${BRASS}22` }} />

  {/* Date Timestamps */}
  <div className="text-right text-[10.5px] leading-tight" style={{ color: MUTE }}>
    <p>Created {new Date(subproject.createdAt).toLocaleDateString()}</p>
    <p>Modified {new Date(subproject.updatedAt).toLocaleDateString()}</p>
  </div>
</div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-4">
          {/* Column 1 — Specifications */}
          <div className="flex flex-col gap-3.5">
            <p style={eyebrow} className="pb-0.5" >Specifications</p>

            <Field label="Configuration">
              <p className="text-sm" style={{ color: INK }}>{subproject.configuration || "N/A"}</p>
            </Field>
            <Field label="Frame style">
              <p className="text-sm" style={{ color: INK }}>Minimal</p>
            </Field>
            <Field label="Lightplane">
              <p className="text-sm" style={{ color: INK }}>Panel A · N &nbsp;/&nbsp; Panel B · N</p>
            </Field>

            <div
              className="rounded-lg p-3.5 mt-1"
              style={{ background: `${BRASS}0d`, border: `1px solid ${BRASS}26` }}
            >
              <p style={eyebrow} className="mb-2">Cab dimensions</p>
              <div className="grid grid-cols-2 gap-y-2.5">
                <Stat tag="D1" text="Depth" />
                <Stat tag="W1" text="Width" />
                <Stat tag="H1" text="Shell height" />
                <Stat tag="H2" text="Ceiling height" />
              </div>
              <button
                className="mt-3 w-full text-white font-bold py-2 text-[11px] uppercase tracking-widest rounded-md transition-colors"
                style={{ background: BRASS }}
                onMouseEnter={(e) => (e.currentTarget.style.background = BRASS_DARK)}
                onMouseLeave={(e) => (e.currentTarget.style.background = BRASS)}
              >
                Edit dimensions
              </button>
            </div>
          </div>

          {/* Column 2 — Order details */}
          <div className="flex flex-col gap-3.5 lg:border-l lg:pl-8" style={{ borderColor: `${BRASS}1f` }}>
            <p style={eyebrow} className="pb-0.5">Order details</p>

            <Field label="Opening *">
              <select className={fieldBox} style={{ borderColor: `${BRASS}33` }}>
                <option>Front</option>
              </select>
            </Field>
            <Field label="Quantity *">
              <input type="number" defaultValue={1} className={fieldBox} style={{ borderColor: `${BRASS}33` }} />
            </Field>
            <Field label="Job type">
              <select className={fieldBox} style={{ borderColor: `${BRASS}33` }}>
                <option>Select an option</option>
              </select>
            </Field>
            <Field label="Elevator type">
              <select className={fieldBox} style={{ borderColor: `${BRASS}33` }}>
                <option>Select an option</option>
              </select>
            </Field>
            <Field label="Shell material">
              <select className={fieldBox} style={{ borderColor: `${BRASS}33` }}>
                <option>Select an option</option>
              </select>
            </Field>
            <Field label="Manufacturer">
              <select className={fieldBox} style={{ borderColor: `${BRASS}33` }}>
                <option>Select an option</option>
              </select>
            </Field>
          </div>

          {/* Column 3 — Downloads & notes */}
          <div className="flex flex-col gap-3.5 lg:border-l lg:pl-8" style={{ borderColor: `${BRASS}1f` }}>
            <p style={eyebrow} className="pb-0.5">Downloads</p>
            <div className="flex flex-wrap gap-2">
              {["Overview PDF", "Design JPG", "Advance download"].map((label) => (
                <button
                  key={label}
                  className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide px-3 py-2 rounded-md transition-colors"
                  style={{ color: BRASS, background: `${BRASS}12`, border: `1px solid ${BRASS}26` }}
                >
                  <HiDownload style={{ fontSize: 14 }} />
                  {label}
                </button>
              ))}
            </div>

            <p style={eyebrow} className="pb-0.5 pt-1">Comments</p>
            <textarea
              rows={4}
              className="w-full px-3 py-2 text-sm rounded-md border bg-white/70 resize-none focus:outline-none focus:ring-1"
              style={{ borderColor: `${BRASS}33` }}
              placeholder="Additional notes..."
            />

            <p className="text-[11px] leading-relaxed mt-auto pt-2" style={{ color: MUTE }}>
              Status moves from <span style={{ color: BRASS, fontWeight: 700 }}>In Progress</span> to{" "}
              <span style={{ color: BRASS, fontWeight: 700 }}>Complete</span> at Step Five: Review.
              <br />
              <span className="text-red-500">*</span> Required for an Advanced Download request.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubProjectDetail;