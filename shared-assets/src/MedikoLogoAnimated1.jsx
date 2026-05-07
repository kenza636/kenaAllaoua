import { useState, useRef, useEffect } from "react";
import {
  FaStethoscope, FaHeartPulse, FaSyringe, FaKitMedical,
  FaHospital, FaPills, FaXRay, FaUserDoctor,
} from "react-icons/fa6";

const SEQUENCES = [
  { K: FaStethoscope, o: FaHeartPulse, label: "Stethoscope · Heart Pulse" },
  { K: FaSyringe,     o: FaKitMedical, label: "Syringe · Kit Medical"     },
  { K: FaHospital,    o: FaPills,      label: "Hospital · Pills"           },
  { K: FaXRay,        o: FaUserDoctor, label: "X-Ray · Doctor"             },
];

/**
 * Props:
 *  standalone  {boolean} – default true. When false, renders only the "MediKo"
 *                          row (no centred wrapper, no "hover the logo" hint).
 *  fontSize    {number}  – default 52. Controls the text and icon scaling.
 */
export default function MedikoLogoAnimated({ standalone = true, fontSize = 52 }) {
  const iconSize = Math.round(fontSize * 0.92);

  const [kMode,      setKMode]      = useState("letter"); // "letter" | "icon"
  const [oMode,      setOMode]      = useState("letter");
  const [currentSeq, setCurrentSeq] = useState(SEQUENCES[0]);
  const [flippingK,  setFlippingK]  = useState(false);
  const [flippingO,  setFlippingO]  = useState(false);
  const [label,      setLabel]      = useState("");

  const isAnimating = useRef(false);
  const seqIndex    = useRef(0);
  const resetTimer  = useRef(null);

  const morphTo = (seq) => {
    isAnimating.current = true;
    setCurrentSeq(seq);

    setFlippingK(true);
    setTimeout(() => setKMode("icon"),    200);
    setTimeout(() => setFlippingK(false), 500);

    setTimeout(() => {
      setFlippingO(true);
      setTimeout(() => setOMode("icon"),    200);
      setTimeout(() => {
        setFlippingO(false);
        setLabel(seq.label);
        isAnimating.current = false;
      }, 500);
    }, 120);
  };

  const resetLetters = () => {
    isAnimating.current = true;

    setFlippingK(true);
    setTimeout(() => { setKMode("letter"); setLabel(""); }, 200);
    setTimeout(() => setFlippingK(false), 500);

    setTimeout(() => {
      setFlippingO(true);
      setTimeout(() => setOMode("letter"), 200);
      setTimeout(() => {
        setFlippingO(false);
        isAnimating.current = false;
      }, 500);
    }, 120);
  };

  const handleMouseEnter = () => {
    if (isAnimating.current) return;
    clearTimeout(resetTimer.current);
    const seq = SEQUENCES[seqIndex.current % SEQUENCES.length];
    seqIndex.current += 1;
    morphTo(seq);
  };

  const handleMouseLeave = () => {
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      if (!isAnimating.current) {
        resetLetters();
      } else {
        const check = setInterval(() => {
          if (!isAnimating.current) { resetLetters(); clearInterval(check); }
        }, 60);
      }
    }, 800);
  };

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const IconK = currentSeq.K;
  const IconO = currentSeq.o;

  const flip = (active) => (active ? "medikoFlipY 0.5s ease-in-out forwards" : "none");

  const letterStyle = (flipping) => ({
    display: "inline-block",
    background: "linear-gradient(90deg,#41AD49,#0072BC)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    animation: flip(flipping),
    lineHeight: 1,
  });

  const iconStyle = (flipping) => ({
    display: "inline-block",
    lineHeight: 1,
    position: "relative",
    top: Math.round(fontSize * 0.04) + "px",
    animation: flip(flipping),
  });

  const logoRow = (
    <div
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        fontSize: fontSize + "px",
        fontWeight: 800,
        letterSpacing: "-2px",
        display: "inline-flex",
        alignItems: "center",
        cursor: "pointer",
        userSelect: "none",
        perspective: "600px",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title="Hover to animate"
    >
      <span style={{ color: "var(--color-text-primary, #0f172a)" }}>Medi</span>
      <span style={{ display: "inline-flex" }}>
        <span style={kMode === "letter" ? letterStyle(flippingK) : iconStyle(flippingK)}>
          {kMode === "letter" ? "K" : <IconK size={iconSize} className="ko-fa-icon" />}
        </span>
        <span style={oMode === "letter" ? letterStyle(flippingO) : iconStyle(flippingO)}>
          {oMode === "letter" ? "o" : <IconO size={iconSize} className="ko-fa-icon" />}
        </span>
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {logoRow}
          {label && (
            <div style={{
              fontSize: Math.round(fontSize * 0.22) + "px",
              color: "var(--color-text-tertiary, #94a3b8)",
              letterSpacing: "0.05em",
              marginTop: "3px",
              textAlign: "center",
            }}>
              {label}
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {gradientSvg}
      {styles}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "320px", flexDirection: "column", gap: "12px",
      }}>
        {logoRow}
        <div style={{
          fontSize: Math.round(fontSize * 0.22) + "px",
          color: "var(--color-text-tertiary, #94a3b8)",
          letterSpacing: "0.05em",
          minHeight: "16px",
          marginTop: "2px",
          textAlign: "center",
        }}>
          {label}
        </div>
        <div style={{
          fontSize: Math.round(fontSize * 0.25) + "px",
          color: "var(--color-text-secondary, #64748b)",
          letterSpacing: "0.03em",
          marginTop: "4px",
        }}>
          hover the logo
        </div>
      </div>
    </>
  );
}
