import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { to: "/",           label: "Live" },
  { to: "/history",    label: "Analysis" },
  { to: "/champions",  label: "Champions" },
  { to: "/predict",    label: "Predict" },
];

export default function Navbar() {
  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(8,8,8,0.95)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid #1a1a1a",
    }}>
      {/* Red accent top line */}
      <div style={{ height: 2, background: "#E10600" }} />

      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        height: 52,
        gap: 32,
      }}>
        {/* Logo */}
        <NavLink to="/" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28,
            background: "#E10600",
            borderRadius: 4,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700, fontSize: 13,
            color: "#fff",
            letterSpacing: 1,
          }}>F1</div>
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: 2,
            color: "#f0f0f0",
          }}>ANALYTICS</span>
        </NavLink>

        {/* Nav links */}
        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === "/"} style={{ textDecoration: "none" }}>
              {({ isActive }) => (
                <div style={{ position: "relative", padding: "6px 14px" }}>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: isActive ? "#f0f0f0" : "#555",
                    transition: "color 0.2s",
                  }}>{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      style={{
                        position: "absolute",
                        bottom: -1, left: 0, right: 0,
                        height: 2,
                        background: "#E10600",
                        borderRadius: 1,
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </div>

        {/* Live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <motion.div
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#E10600",
            }}
          />
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 10,
            letterSpacing: 2,
            color: "#E10600",
            textTransform: "uppercase",
          }}>Live</span>
        </div>
      </div>
    </nav>
  );
}
