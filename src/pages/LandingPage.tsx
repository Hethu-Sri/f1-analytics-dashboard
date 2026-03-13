import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const TOTAL_LIGHTS = 5;

export default function LandingPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"idle" | "lighting" | "out" | "go">("idle");
  const [litCount, setLitCount] = useState(0);
  const [carSpeed, setCarSpeed] = useState(false);

  const startSequence = () => {
    if (phase !== "idle") return;
    setPhase("lighting");

    // Light up 5 lights one by one
    for (let i = 0; i < TOTAL_LIGHTS; i++) {
      setTimeout(() => setLitCount(i + 1), i * 300);
    }

    // All out — LIGHTS OUT AND AWAY WE GO
    setTimeout(() => {
      setPhase("out");
      setCarSpeed(true);
      setTimeout(() => {
        setPhase("go");
        setTimeout(() => navigate("/dashboard"), 600);
      }, 800);
    }, TOTAL_LIGHTS * 300 + 400);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(225,6,0,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(225,6,0,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
      }} />

      {/* Track line */}
      <div style={{
        position: "absolute",
        bottom: "30%",
        left: 0, right: 0,
        height: 1,
        background: "linear-gradient(90deg, transparent, #2a2a2a 20%, #2a2a2a 80%, transparent)",
      }} />
      <div style={{
        position: "absolute",
        bottom: "30%",
        left: 0, right: 0,
        height: 1,
        marginBottom: -40,
        background: "linear-gradient(90deg, transparent, #1a1a1a 20%, #1a1a1a 80%, transparent)",
      }} />

      {/* Main content */}
      <AnimatePresence>
        {phase !== "go" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 48, zIndex: 1 }}
          >
            {/* Title */}
            <div style={{ textAlign: "center" }}>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "clamp(52px, 10vw, 96px)",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  lineHeight: 0.95,
                  color: "#f0f0f0",
                  textTransform: "uppercase",
                }}
              >
                F1
                <span style={{ color: "#E10600" }}> Analytics</span>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 11,
                  letterSpacing: "0.3em",
                  color: "#444",
                  marginTop: 12,
                  textTransform: "uppercase",
                }}
              >
                2015 — 2025 · Live Data · Race Intelligence
              </motion.p>
            </div>

            {/* F1 Car SVG */}
            <motion.div
              animate={carSpeed ? {
                x: [0, 600],
                opacity: [1, 1, 0],
              } : {}}
              transition={{ duration: 0.5, ease: [0.4, 0, 1, 1] }}
              style={{ position: "relative" }}
            >
              <F1CarSVG />
              {/* Speed lines when car launches */}
              {carSpeed && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  style={{
                    position: "absolute",
                    left: -200, top: "50%",
                    width: 200, height: 2,
                    background: "linear-gradient(90deg, transparent, #E10600)",
                    transformOrigin: "right",
                  }}
                />
              )}
            </motion.div>

            {/* Lights panel + start button */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              {/* Gantry */}
              <div style={{ position: "relative" }}>
                <div style={{
                  width: 220, height: 5,
                  background: "#1a1a1a",
                  borderRadius: 3,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }} />
                {[24, 62, 100, 138, 176].map((x, i) => (
                  <div key={i} style={{
                    position: "absolute",
                    left: x, top: 5,
                    width: 1, height: 16,
                    background: "#2a2a2a",
                  }} />
                ))}
              </div>

              {/* Lights */}
              <div style={{ display: "flex", gap: 14, marginTop: -8 }}>
                {Array.from({ length: TOTAL_LIGHTS }, (_, i) => {
                  const isLit = i < litCount && phase !== "out";
                  return (
                    <motion.div
                      key={i}
                      animate={{
                        boxShadow: isLit
                          ? "0 0 24px 8px rgba(225,6,0,0.8), 0 0 48px 16px rgba(225,6,0,0.3)"
                          : "none",
                        scale: isLit ? 1.05 : 1,
                      }}
                      transition={{ duration: 0.15 }}
                      style={{
                        width: 32, height: 32,
                        borderRadius: "50%",
                        background: isLit ? "#E10600" : "#180000",
                        border: `2px solid ${isLit ? "#ff2200" : "#2a0000"}`,
                        transition: "background 0.1s, border-color 0.1s",
                        position: "relative",
                      }}
                    >
                      {isLit && (
                        <div style={{
                          position: "absolute", top: 5, left: 7,
                          width: 7, height: 4, borderRadius: "50%",
                          background: "rgba(255,255,255,0.4)",
                        }} />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* CTA Button */}
              <AnimatePresence mode="wait">
                {phase === "idle" && (
                  <motion.button
                    key="btn"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                    onClick={startSequence}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      marginTop: 8,
                      padding: "12px 40px",
                      background: "#E10600",
                      border: "none",
                      borderRadius: 4,
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 16,
                      fontWeight: 700,
                      letterSpacing: 3,
                      color: "#fff",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    Start Engine
                  </motion.button>
                )}
                {phase === "lighting" && (
                  <motion.div
                    key="wait"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 11,
                      letterSpacing: "0.25em",
                      color: "#444",
                      textTransform: "uppercase",
                      marginTop: 8,
                    }}
                  >
                    Prepare to race...
                  </motion.div>
                )}
                {phase === "out" && (
                  <motion.div
                    key="go"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 32,
                      fontWeight: 900,
                      letterSpacing: "0.15em",
                      color: "#E10600",
                      textTransform: "uppercase",
                      marginTop: 8,
                    }}
                  >
                    LIGHTS OUT
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function F1CarSVG() {
  return (
    <motion.svg
      width="320" height="100" viewBox="0 0 320 100"
      animate={{ y: [0, -2, 0, -1, 0] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Shadow */}
      <ellipse cx="160" cy="95" rx="100" ry="4" fill="rgba(0,0,0,0.4)" />

      {/* Rear wing */}
      <rect x="18" y="28" width="36" height="5" rx="2" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
      <rect x="24" y="33" width="3" height="18" rx="1" fill="#1a1a1a" />
      <rect x="33" y="33" width="3" height="18" rx="1" fill="#1a1a1a" />

      {/* Main body */}
      <path d="M50 55 Q60 30 100 26 L220 26 Q260 28 275 42 L285 55 L285 70 L50 70 Z"
        fill="#0f0f0f" stroke="#E10600" strokeWidth="1" />

      {/* Cockpit */}
      <path d="M145 26 Q155 14 175 14 Q195 14 205 26 Z"
        fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
      {/* Visor */}
      <path d="M150 24 Q162 16 178 16 Q194 16 200 24 Z"
        fill="#001a2a" opacity="0.8" />
      <path d="M152 22 Q164 17 178 17 Q190 18 198 22"
        fill="none" stroke="rgba(0,200,255,0.15)" strokeWidth="1" />

      {/* Red livery stripes */}
      <rect x="80" y="26" width="100" height="4" fill="#E10600" />
      <rect x="80" y="66" width="100" height="3" fill="#E10600" />
      <path d="M60 55 L80 30 L80 70 Z" fill="#E10600" opacity="0.7" />

      {/* Number plate */}
      <rect x="240" y="40" width="30" height="18" rx="2" fill="#E10600" />
      <text x="255" y="52" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif"
        fontWeight="700" fontSize="11" fill="white">1</text>

      {/* Front wing */}
      <path d="M270 58 L295 56 L298 62 L270 64 Z"
        fill="#0f0f0f" stroke="#333" strokeWidth="0.5" />
      <path d="M273 58 L296 57" stroke="#E10600" strokeWidth="1.5" fill="none" />

      {/* Rear wheel */}
      <circle cx="80" cy="72" r="16" fill="#111" stroke="#333" strokeWidth="1" />
      <circle cx="80" cy="72" r="10" fill="#0a0a0a" />
      <circle cx="80" cy="72" r="4" fill="#E10600" />
      {[0,60,120,180,240,300].map(a => (
        <line key={a}
          x1={80 + 5 * Math.cos(a * Math.PI/180)}
          y1={72 + 5 * Math.sin(a * Math.PI/180)}
          x2={80 + 9 * Math.cos(a * Math.PI/180)}
          y2={72 + 9 * Math.sin(a * Math.PI/180)}
          stroke="#333" strokeWidth="1.5"
        />
      ))}

      {/* Front wheel */}
      <circle cx="240" cy="72" r="14" fill="#111" stroke="#333" strokeWidth="1" />
      <circle cx="240" cy="72" r="8" fill="#0a0a0a" />
      <circle cx="240" cy="72" r="3.5" fill="#E10600" />
      {[0,60,120,180,240,300].map(a => (
        <line key={a}
          x1={240 + 4.5 * Math.cos(a * Math.PI/180)}
          y1={72 + 4.5 * Math.sin(a * Math.PI/180)}
          x2={240 + 7.5 * Math.cos(a * Math.PI/180)}
          y2={72 + 7.5 * Math.sin(a * Math.PI/180)}
          stroke="#333" strokeWidth="1.5"
        />
      ))}

      {/* Floor / diffuser */}
      <path d="M50 70 L290 70 L290 74 Q270 76 240 76 L80 76 Q60 76 50 74 Z"
        fill="#080808" stroke="#1a1a1a" strokeWidth="0.5" />

      {/* DRS / exhaust glow */}
      <ellipse cx="50" cy="55" rx="5" ry="8" fill="#E10600" opacity="0.15" />
      <ellipse cx="48" cy="55" rx="3" ry="5" fill="#ff6600" opacity="0.2" />
    </motion.svg>
  );
}
