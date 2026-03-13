import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LightsOutLoaderProps {
  onComplete?: () => void;
  label?: string;
}

export default function LightsOutLoader({ onComplete, label = "Loading" }: LightsOutLoaderProps) {
  const [litCount, setLitCount] = useState(0);
  const [goingOut, setGoingOut] = useState(false);
  const [done, setDone] = useState(false);
  const TOTAL = 5;

  useEffect(() => {
    // Lights come ON one by one
    const onTimers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < TOTAL; i++) {
      onTimers.push(setTimeout(() => setLitCount(i + 1), 300 + i * 280));
    }

    // Then ALL go out together
    const outTimer = setTimeout(() => {
      setGoingOut(true);
      setTimeout(() => {
        setDone(true);
        onComplete?.();
      }, 600);
    }, 300 + TOTAL * 280 + 600);

    return () => {
      onTimers.forEach(clearTimeout);
      clearTimeout(outTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            padding: "2rem",
          }}
        >
          {/* Gantry bar */}
          <div style={{
            width: 280,
            height: 6,
            background: "#1a1a1a",
            borderRadius: 3,
            position: "relative",
            boxShadow: "0 2px 12px rgba(0,0,0,0.6)",
          }}>
            {/* Suspension wires */}
            {[40, 90, 140, 190, 240].map((x, i) => (
              <div key={i} style={{
                position: "absolute",
                left: x,
                top: 6,
                width: 1,
                height: 18,
                background: "#333",
              }} />
            ))}
          </div>

          {/* Lights row */}
          <div style={{ display: "flex", gap: 16, marginTop: -12 }}>
            {Array.from({ length: TOTAL }, (_, i) => {
              const isLit = i < litCount && !goingOut;
              return (
                <motion.div
                  key={i}
                  animate={{
                    boxShadow: isLit
                      ? "0 0 20px 6px rgba(225,6,0,0.7), 0 0 40px 10px rgba(225,6,0,0.3)"
                      : "none",
                  }}
                  transition={{ duration: 0.2 }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: isLit ? "#E10600" : "#1a0000",
                    border: `2px solid ${isLit ? "#E10600" : "#2a0000"}`,
                    position: "relative",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  {/* Inner glint */}
                  {isLit && (
                    <div style={{
                      position: "absolute",
                      top: 6, left: 8,
                      width: 8, height: 5,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.35)",
                    }} />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Label */}
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.2em",
            color: goingOut ? "transparent" : "#444",
            textTransform: "uppercase",
            transition: "color 0.3s",
          }}>
            {goingOut ? "LIGHTS OUT" : label.toUpperCase()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
