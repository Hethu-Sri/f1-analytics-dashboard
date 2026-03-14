import { useEffect, useState } from "react";
import { rateLimitedFetch } from "../utils/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stint {
  driver_number: number;
  stint_number: number;
  lap_start: number;
  lap_end: number;
  compound: string;
  tyre_age_at_start: number;
}

interface DriverRow {
  number: string;
  name: string;
  stints: Stint[];
}

interface TireStrategyChartProps {
  year: number;
  country: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE = "https://api.openf1.org/v1";

const COMPOUND_COLORS: Record<string, string> = {
  SOFT:       "#E8002D",
  MEDIUM:     "#FFF200",
  HARD:       "#FFFFFF",
  INTERMEDIATE: "#39B54A",
  WET:        "#0067FF",
  UNKNOWN:    "#888888",
};

const COMPOUND_TEXT: Record<string, string> = {
  SOFT: "#fff",
  MEDIUM: "#111",
  HARD: "#111",
  INTERMEDIATE: "#fff",
  WET: "#fff",
  UNKNOWN: "#fff",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchSessionKey(year: number, country: string): Promise<number> {
  const url = `${BASE}/sessions?year=${year}&country_name=${encodeURIComponent(country)}&session_name=Race`;
  const data = await rateLimitedFetch(url);
  if (!data.length) throw new Error(`No race found for ${country} ${year}`);
  return data[0].session_key;
}

async function fetchStints(sessionKey: number): Promise<Stint[]> {
  const url = `${BASE}/stints?session_key=${sessionKey}`;
  return rateLimitedFetch(url);
}

async function fetchDrivers(sessionKey: number): Promise<Record<string, string>> {
  const url = `${BASE}/drivers?session_key=${sessionKey}`;
  let data: any[];
  try { data = await rateLimitedFetch(url); } catch { return {}; }
  const map: Record<string, string> = {};
  data.forEach((d: { driver_number: number; full_name?: string; last_name?: string; name_acronym?: string }) => {
    const raw = d.full_name ?? d.last_name ?? String(d.driver_number);
    // Title-case the name
    map[String(d.driver_number)] = raw
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  });
  return map;
}

async function fetchRaceResults(sessionKey: number): Promise<string[]> {
  const url = `${BASE}/position?session_key=${sessionKey}&position<=20`;
  let data: any[];
  try { data = await rateLimitedFetch(url); } catch { return []; }
  // Get final position order - dedupe by driver keeping last entry
  const seen = new Map<string, number>();
  data.forEach((d: { driver_number: number; position: number }) => {
    seen.set(String(d.driver_number), d.position);
  });
  return [...seen.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([num]) => num);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TireStrategyChart({ year, country }: TireStrategyChartProps) {
  const [rows, setRows] = useState<DriverRow[]>([]);
  const [totalLaps, setTotalLaps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const sessionKey = await fetchSessionKey(year, country);

        const [stints, nameMap, order] = await Promise.all([
          fetchStints(sessionKey),
          fetchDrivers(sessionKey),
          fetchRaceResults(sessionKey),
        ]);

        if (cancelled) return;

        const maxLap = Math.max(...stints.map(s => s.lap_end ?? 0));
        setTotalLaps(maxLap);

        // Group stints by driver
        const byDriver: Record<string, Stint[]> = {};
        stints.forEach(s => {
          const key = String(s.driver_number);
          if (!byDriver[key]) byDriver[key] = [];
          byDriver[key].push(s);
        });

        // Build rows sorted by finishing position
        const driverNums = order.length
          ? order.filter(n => byDriver[n])
          : Object.keys(byDriver).sort((a, b) => parseInt(a) - parseInt(b));

        const builtRows: DriverRow[] = driverNums.slice(0, 20).map(num => ({
          number: num,
          name: nameMap[num] ?? `#${num}`,
          stints: (byDriver[num] ?? []).sort((a, b) => a.stint_number - b.stint_number),
        }));

        setRows(builtRows);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load strategy.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [year, country]);

  if (year < 2018) return (
    <div style={{ padding:"1.5rem", textAlign:"center" }}>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:700,
        color:"#555", letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>
        Tire data unavailable
      </div>
      <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#333", letterSpacing:1 }}>
        Stint data is available from 2018 onwards via OpenF1
      </div>
    </div>
  );
  if (loading) return <p style={{ color: "#aaa", padding: "1rem" }}>Loading tire strategy…</p>;
  if (error)   return <p style={{ color: "#E10600", padding: "1rem" }}>{error}</p>;
  if (!rows.length) return <p style={{ color: "#aaa", padding: "1rem" }}>No strategy data found.</p>;

  const ROW_H = 28;
  const LABEL_W = 140;
  const BAR_AREA = 820;

  return (
    <div style={{ fontFamily: "sans-serif", overflowX: "auto" }}>

      {/* Compound legend */}
      <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
        {Object.entries(COMPOUND_COLORS).filter(([k]) => k !== "UNKNOWN").map(([compound, color]) => (
          <div key={compound} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#aaa" }}>
            <span style={{
              width: 14, height: 14, borderRadius: 3,
              background: color,
              border: compound === "HARD" ? "1px solid #555" : "none",
              display: "inline-block"
            }} />
            {compound[0] + compound.slice(1).toLowerCase()}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ position: "relative", minWidth: LABEL_W + BAR_AREA }}>

        {/* Lap number axis */}
        <div style={{
          display: "flex", marginLeft: LABEL_W,
          marginBottom: 4, width: BAR_AREA,
        }}>
          {[1, 10, 20, 30, 40, 50, totalLaps].map(lap => (
            <span key={lap} style={{
              position: "absolute",
              left: LABEL_W + ((lap - 1) / (totalLaps - 1)) * BAR_AREA,
              fontSize: 10, color: "#555",
              transform: "translateX(-50%)",
            }}>
              {lap}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          {rows.map((row, i) => (
            <div key={row.number} style={{
              display: "flex", alignItems: "center",
              height: ROW_H,
              borderBottom: "1px solid #1a1a1a",
              background: i % 2 === 0 ? "transparent" : "#0d0d0d",
            }}>
              {/* Driver name */}
              <div style={{
                width: LABEL_W, minWidth: LABEL_W,
                fontSize: 12, color: "#aaa",
                paddingRight: 10, textAlign: "right",
                whiteSpace: "nowrap", overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                <span style={{ color: "#555", marginRight: 6, fontSize: 11 }}>
                  {i + 1}
                </span>
                {row.name}
              </div>

              {/* Stint bars */}
              <div style={{ position: "relative", width: BAR_AREA, height: ROW_H - 4 }}>
                {row.stints.map(stint => {
                  const compound = (stint.compound ?? "UNKNOWN").toUpperCase();
                  const color = COMPOUND_COLORS[compound] ?? COMPOUND_COLORS.UNKNOWN;
                  const textColor = COMPOUND_TEXT[compound] ?? "#fff";
                  const lapEnd = stint.lap_end ?? totalLaps;
                  const left = ((stint.lap_start - 1) / (totalLaps - 1)) * BAR_AREA;
                  const width = Math.max(((lapEnd - stint.lap_start) / (totalLaps - 1)) * BAR_AREA, 4);
                  const laps = lapEnd - stint.lap_start + 1;

                  return (
                    <div
                      key={stint.stint_number}
                      title={`${compound} — Laps ${stint.lap_start}–${lapEnd} (${laps} laps, age ${stint.tyre_age_at_start})`}
                      style={{
                        position: "absolute",
                        left, width: width - 2,
                        top: 3, height: ROW_H - 10,
                        background: color,
                        borderRadius: 3,
                        border: compound === "HARD" ? "1px solid #555" : "none",
                        display: "flex", alignItems: "center",
                        justifyContent: "center",
                        cursor: "default",
                        overflow: "hidden",
                      }}
                    >
                      {width > 28 && (
                        <span style={{ fontSize: 9, fontWeight: 600, color: textColor, letterSpacing: "0.3px" }}>
                          {compound[0]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
