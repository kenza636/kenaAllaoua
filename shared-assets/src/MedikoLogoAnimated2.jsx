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

/**
 * Props:
 *  standalone  {boolean} – default true. When false, renders only the logo row.
 *  fontSize    {number}  – default 52. Controls text and icon scaling.
 */
export default function MedikoLogoAnimated({ standalone = true, fontSize = 52 }) {
  const iconSize = Math.round(fontSize * 1.1);

  const [mode,     setMode]     = useState("letter"); // "letter" | "icon"
  const [flipping, setFlipping] = useState(false);
  const [iconIdx,  setIconIdx]  = useState(0);

  const isAnimating = useRef(false);
  const nextIdx     = useRef(0);
  const resetTimer  = useRef(null);

  const flipTo = (toMode, onSwap) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    setFlipping(true);
    setTimeout(() => {
      onSwap();
      setMode(toMode);
    }, 220);
    setTimeout(() => {
      setFlipping(false);
      isAnimating.current = false;
    }, 500);
  };

  const handleMouseEnter = () => {
    if (isAnimating.current) return;
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
      if (mode === "icon") {
        flipTo("letter", () => {});
      }
    }, 600);
  };

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const Icon = ICONS[iconIdx];

  /* Fixed width for the "ko" slot so "Medi" never moves */
  const koSlotWidth = Math.round(fontSize * 1.4) + "px";

  const gradientText = {
    background: "linear-gradient(90deg, #41AD49, #0072BC)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  const animStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: koSlotWidth,
    animation: flipping ? "medikoFlipY 0.5s ease-in-out forwards" : "none",
    transformStyle: "preserve-3d",
  };

  const logoRow = (
    <div
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        fontSize: fontSize + "px",
        fontWeight: 800,
        letterSpacing: 0,
        display: "inline-flex",
        alignItems: "center",
        cursor: "pointer",
        userSelect: "none",
        perspective: "700px",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* "Medi" — anchored, never moves */}
      <span style={{ color: "var(--color-text-primary, #0f172a)", letterSpacing: "-1px" }}>
        Medi
      </span>

      {/* "ko" slot — fixed width, flips as one unit */}
      <span style={animStyle}>
        {mode === "letter" ? (
          <span style={{ ...gradientText, letterSpacing: "-2px", lineHeight: 1 }}>
            ko
          </span>
        ) : (
          <Icon size={iconSize} className="ko-fa-icon" />
        )}
      </span>
    </div>
  );

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
      .ko-fa-icon path { fill: url(#koGrad); }
    `}</style>
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "320px",
        flexDirection: "column",
        gap: "16px",
      }}>
        {logoRow}
        <div style={{
          fontSize: "13px",
          color: "var(--color-text-secondary, #64748b)",
          letterSpacing: "0.03em",
        }}>
          hover the logo
        </div>
      </div>
    </>
  );
}
