import { useState, useRef, useEffect } from "react";
import {
  FaStethoscope, FaHeartPulse, FaSyringe, FaKitMedical,
  FaHospital, FaPills, FaXRay, FaUserDoctor,
} from "react-icons/fa6";

const ICONS = [
  FaStethoscope,
  FaHeartPulse,
  FaSyringe,
  FaKitMedical,
  FaHospital,
  FaPills,
  FaXRay,
  FaUserDoctor,
];

/* Extra left margin applied to the icon only — keeps "Medi" anchored */
const ICON_GAP = 6;

/**
 * Props:
 *  standalone  {boolean} – default true. When false, renders only the logo row.
 *  fontSize    {number}  – default 52.
 */
export default function MedikoLogoAnimated({ standalone = true, fontSize = 52 }) {
  const iconSize = Math.round(fontSize * 1.05);

  const [mode,     setMode]     = useState("letter");
  const [flipping, setFlipping] = useState(false);
  const [iconIdx,  setIconIdx]  = useState(0);
  const [slotW,    setSlotW]    = useState(null);

  const koRef      = useRef(null);
  const isAnim     = useRef(false);
  const nextIdx    = useRef(0);
  const resetTimer = useRef(null);

  /* Measure the real "ko" text width once, then lock slot to it + ICON_GAP */
  useEffect(() => {
    if (koRef.current) setSlotW(koRef.current.offsetWidth);
  }, []);

  const flipTo = (toMode, onSwap) => {
    if (isAnim.current) return;
    isAnim.current = true;
    setFlipping(true);
    setTimeout(() => { onSwap(); setMode(toMode); }, 220);
    setTimeout(() => { setFlipping(false); isAnim.current = false; }, 500);
  };

  const handleMouseEnter = () => {
    if (isAnim.current) return;
    clearTimeout(resetTimer.current);
    if (mode === "letter") {
      const idx = nextIdx.current % ICONS.length;
      nextIdx.current += 1;
      flipTo("icon", () => setIconIdx(idx));
    }
  };

  const handleMouseLeave = () => {
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      if (mode === "icon") flipTo("letter", () => {});
    }, 600);
  };

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const Icon = ICONS[iconIdx];

  const gradientText = {
    background: "linear-gradient(90deg,#41AD49,#0072BC)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    display: "inline-block",
    letterSpacing: "-1px",
    lineHeight: 1,
    whiteSpace: "nowrap",
  };

  /*
   * Slot width = measured "ko" width + ICON_GAP
   * so when the icon shows with marginLeft: ICON_GAP, the slot
   * is exactly wide enough and "Medi" never shifts.
   */
  const slotStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "flex-start",
    width: slotW ? (slotW + ICON_GAP) + "px" : "auto",
    overflow: "visible",
    flexShrink: 0,
    animation: flipping ? "medikoFlipY 0.5s ease-in-out forwards" : "none",
    transformStyle: "preserve-3d",
  };

  const gradientSvg = (
    <svg width="0" height="0" style={{ position: "absolute", overflow: "hidden" }}>
      <defs>
        <linearGradient id="koGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#41AD49" />
          <stop offset="100%" stopColor="#0072BC" />
        </linearGradient>
      </defs>
    </svg>
  );

  const styles = (
    <style>{`
      @keyframes medikoFlipY {
        0%   { transform: rotateY(0deg);  opacity: 1; }
        40%  { transform: rotateY(90deg); opacity: 0; }
        60%  { transform: rotateY(90deg); opacity: 0; }
        100% { transform: rotateY(0deg);  opacity: 1; }
      }
      .ko-icon-grad path { fill: url(#koGrad); }
    `}</style>
  );

  const logoRow = (
    <div
      style={{
        fontFamily:    "'Segoe UI', sans-serif",
        fontSize:      fontSize + "px",
        fontWeight:    800,
        letterSpacing: "-1px",
        display:       "inline-flex",
        alignItems:    "center",
        cursor:        "pointer",
        userSelect:    "none",
        perspective:   "700px",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* "Medi" — static, never moves */}
      <span style={{ color: "var(--color-text-primary, #0f172a)" }}>
        Medi
      </span>

      {/* slot — fixed width keeps "Medi" anchored regardless of content */}
      <span style={slotStyle}>
        {mode === "letter" ? (
          <span ref={koRef} style={gradientText}>
            ko
          </span>
        ) : (
          <Icon
            size={iconSize}
            className="ko-icon-grad"
            style={{ display: "block", flexShrink: 0, marginLeft: ICON_GAP + "px" }}
          />
        )}
      </span>
    </div>
  );

  if (!standalone) {
    return (
      <>
        {gradientSvg}
        {styles}
        {logoRow}
      </>
    );
  }

  return (
    <>
      {gradientSvg}
      {styles}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        minHeight:      "320px",
        flexDirection:  "column",
        gap:            "20px",
      }}>
        {logoRow}
        <div style={{
          fontSize:      "13px",
          color:         "var(--color-text-secondary, #64748b)",
          letterSpacing: "0.02em",
        }}>
          hover the logo
        </div>
      </div>
    </>
  );
}
