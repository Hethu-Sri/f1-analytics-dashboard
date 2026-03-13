import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchLatestTelemetry } from "../utils/api";
import LightsOutLoader from "../components/LightsOutLoader";

interface TelemetryEntry {
  driver_number: number;
  speed: number;
  throttle: number;
  brake: number;
  drs: number;
  x: number;
  y: number;
  z: number;
}

interface DriverTelemetry {
  number: number;
  speed: number;
  throttle: number;
  brake: number;
  drs: number;
}

export default function TelemetryPage() {
  const [drivers, setDrivers] = useState<DriverTelemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchLatestTelemetry();
        if (!Array.isArray(data) || data.length === 0) {
          setError("No active session telemetry available. Check back during a race!");
          setLoading(false);
          return;
        }

        // Group by driver and get latest entry
        const driverMap = new Map<number, TelemetryEntry>();
        data.forEach((entry: TelemetryEntry) => {
          try {
            if (!entry || typeof entry.driver_number !== "number") return;
            if (!driverMap.has(entry.driver_number)) {
              driverMap.set(entry.driver_number, entry);
            } else {
              const existing = driverMap.get(entry.driver_number)!;
              // Keep the entry with highest timestamp (latest)
              if ((entry as any).date > (existing as any).date) {
                driverMap.set(entry.driver_number, entry);
              }
            }
          } catch {
            // Skip corrupted entries
          }
        });

        if (driverMap.size === 0) {
          setError("No valid telemetry data found.");
          setLoading(false);
          return;
        }

        const telemetry = Array.from(driverMap.values())
          .filter(d => typeof d.speed === "number" && typeof d.throttle === "number" && typeof d.brake === "number")
          .sort((a, b) => (b.speed || 0) - (a.speed || 0))
          .map(d => ({
            number: d.driver_number,
            speed: Math.round(d.speed || 0),
            throttle: Math.round((d.throttle || 0) * 100),
            brake: Math.round((d.brake || 0) * 100),
            drs: d.drs || 0,
          }));

        setDrivers(telemetry);
        setError(null);
      } catch (err) {
        setError("Failed to load telemetry. " + (err instanceof Error ? err.message : "Unknown error"));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [refreshCount]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 36, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
          Live <span style={{ color: "#E10600" }}>Telemetry</span>
        </h1>
        <div style={{ height: 2, background: "#E10600", width: 60, marginBottom: 8 }} />
        <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 24 }}>
          Real-time car data from active session
        </p>
      </motion.div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <LightsOutLoader label="Fetching telemetry data" onComplete={() => {}} />
        </div>
      )}

      {error && (
        <div style={{ background: "#0f0f0f", border: "1px solid #E10600", borderRadius: 8, padding: 20, marginBottom: 24 }}>
          <p style={{ color: "#E10600", fontFamily: "'Share Tech Mono',monospace", fontSize: 12 }}>{error}</p>
          <button
            onClick={() => setRefreshCount(c => c + 1)}
            style={{
              marginTop: 12, padding: "8px 16px",
              background: "#E10600", border: "none", borderRadius: 4,
              color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12,
              fontWeight: 700, cursor: "pointer"
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && drivers.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 24 }}>
            {drivers.map((d, i) => (
              <motion.div
                key={d.number}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                style={{
                  background: "#0f0f0f",
                  border: "1px solid #1a1a1a",
                  borderRadius: 8,
                  padding: 16,
                  borderLeft: `3px solid #E10600`,
                }}
              >
                {/* Driver number */}
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 900, color: "#f0f0f0", marginBottom: 12 }}>
                  #{d.number}
                </div>

                {/* Speed */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#444", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>
                    Speed
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 700, color: "#f0f0f0" }}>
                    {d.speed} <span style={{ fontSize: 11, color: "#666" }}>km/h</span>
                  </div>
                </div>

                {/* Throttle */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#444", letterSpacing: 1, textTransform: "uppercase" }}>
                      Throttle
                    </span>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, fontWeight: 700, color: "#f0f0f0" }}>
                      {d.throttle}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        background: "#27F4D2",
                        width: `${d.throttle}%`,
                        transition: "width 200ms ease"
                      }}
                    />
                  </div>
                </div>

                {/* Brake */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#444", letterSpacing: 1, textTransform: "uppercase" }}>
                      Brake
                    </span>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, fontWeight: 700, color: "#f0f0f0" }}>
                      {d.brake}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        background: "#E10600",
                        width: `${d.brake}%`,
                        transition: "width 200ms ease"
                      }}
                    />
                  </div>
                </div>

                {/* DRS */}
                <div>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: d.drs ? "#27F4D2" : "#444", letterSpacing: 1, textTransform: "uppercase" }}>
                    DRS: {d.drs ? "🟢 OPEN" : "● CLOSED"}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <button
              onClick={() => setRefreshCount(c => c + 1)}
              style={{
                padding: "10px 24px",
                background: "#E10600", border: "none", borderRadius: 4,
                color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12,
                fontWeight: 700, cursor: "pointer", letterSpacing: 1
              }}
            >
              REFRESH TELEMETRY
            </button>
          </div>
        </motion.div>
      )}

      {!loading && !error && drivers.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#2a2a2a" }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, letterSpacing: 3, textTransform: "uppercase" }}>
            No driver telemetry available
          </div>
        </div>
      )}
    </div>
  );
}
