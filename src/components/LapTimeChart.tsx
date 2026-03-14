import { useEffect, useState } from "react";
import { rateLimitedFetch } from "../utils/api";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LapEntry {
  lap: number;
  [driverNum: string]: number | null;
}

interface DriverMeta {
  number: string;
  name: string;
  color: string;
}

interface LapTimeChartProps {
  /** Full year, e.g. 2024 */
  year: number;
  /** Country name to match, e.g. "Bahrain", "Monaco", "Italy" */
  country: string;
  /** Driver racing numbers as strings, e.g. ["1", "16"] */
  driverNumbers?: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = ["#E10600", "#00D2FF", "#FF8C00", "#A855F7"];
const BASE = "https://api.openf1.org/v1";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLapTime(ms: number): string {
  if (!ms || ms <= 0) return "--";
  const minutes = Math.floor(ms / 60_000);
  const seconds = ((ms % 60_000) / 1_000).toFixed(3);
  return `${minutes}:${seconds.padStart(6, "0")}`;
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchSessionKey(year: number, country: string): Promise<number> {
  const url = `${BASE}/sessions?year=${year}&country_name=${encodeURIComponent(country)}&session_name=Race`;
  const data = await rateLimitedFetch(url);
  if (!data.length) throw new Error(`No race found for ${country} ${year}. Check the country name.`);
  return data[0].session_key;
}

async function fetchLapsForDriver(
  sessionKey: number,
  driverNumber: string
): Promise<{ lap_number: number; lap_duration: number | null }[]> {
  const url = `${BASE}/laps?session_key=${sessionKey}&driver_number=${driverNumber}`;
  return rateLimitedFetch(url);
}

async function fetchDriverName(sessionKey: number, driverNumber: string): Promise<string> {
  const url = `${BASE}/drivers?session_key=${sessionKey}&driver_number=${driverNumber}`;
  const data = await rateLimitedFetch(url);
  if (!data.length) return `#${driverNumber}`;
  const d = data[0];
  // OpenF1 returns full_name in ALL CAPS e.g. "MAX VERSTAPPEN" — title-case it
  const raw = d.full_name ?? d.last_name ?? `#${driverNumber}`;
  return raw.replace(/\b\w/g, (c: string) => c.toUpperCase()).toLowerCase()
            .replace(/\b\w/g, (c: string) => c.toUpperCase());
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number | null; color?: string }>;
  label?: string | number;
  drivers: DriverMeta[];
};

function CustomTooltip({ active, payload, label, drivers }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1a1a1a", border: "1px solid #333",
      borderRadius: 6, padding: "10px 14px", fontSize: 12,
    }}>
      <p style={{ color: "#666", marginBottom: 6, fontSize: 11, textTransform: "uppercase" }}>
        Lap {label}
      </p>
      {payload.map((p) => {
        const driver = drivers.find((d) => d.number === p.dataKey);
        return (
          <div key={String(p.dataKey)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
            <span style={{ color: "#aaa", minWidth: 100 }}>{driver?.name ?? p.dataKey}</span>
            <span style={{ fontWeight: 600, color: "#f0f0f0" }}>
              {p.value != null ? formatLapTime(p.value) : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── F1 Car loader for lap times ──────────────────────────────────────────────
function LapTimesLoader() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:24, padding:"40px 0" }}>
      {/* Track */}
      <div style={{ position:"relative", width:"100%", maxWidth:480, height:72, overflow:"hidden" }}>
        <div style={{ position:"absolute", bottom:8, left:0, right:0, height:1, background:"#1a1a1a" }} />
        <div style={{ position:"absolute", bottom:14, left:0, right:0, height:1, background:"#111" }} />
        {Array.from({length:10},(_,i)=>(
          <div key={i} style={{ position:"absolute", bottom:11, left:`${i*11}%`, width:"6%", height:1, background:"#1e1e1e" }} />
        ))}
        {/* Animated car */}
        <div style={{ position:"absolute", bottom:8, animation:"f1sweep 2s ease-in-out infinite" }}>
          <style>{`
            @keyframes f1sweep { 0%{left:-140px;opacity:0} 15%{opacity:1} 85%{opacity:1} 100%{left:calc(100% + 140px);opacity:0} }
            @keyframes f1lines { 0%,100%{opacity:0;transform:scaleX(0)} 20%,80%{opacity:1;transform:scaleX(1)} }
          `}</style>
          <div style={{ position:"absolute", right:"100%", top:24, width:72, height:2,
            background:"linear-gradient(90deg,transparent,#E10600)",
            animation:"f1lines 2s ease-in-out infinite", transformOrigin:"right" }} />
          <svg width="140" height="48" viewBox="0 0 320 100" style={{display:"block"}}>
            <ellipse cx="160" cy="95" rx="100" ry="4" fill="rgba(0,0,0,0.2)" />
            <rect x="18" y="28" width="36" height="5" rx="2" fill="#1a1a1a" stroke="#222" strokeWidth="0.5" />
            <rect x="24" y="33" width="3" height="18" rx="1" fill="#1a1a1a" />
            <rect x="33" y="33" width="3" height="18" rx="1" fill="#1a1a1a" />
            <path d="M50 55 Q60 30 100 26 L220 26 Q260 28 275 42 L285 55 L285 70 L50 70 Z" fill="#111" stroke="#E10600" strokeWidth="1" />
            <path d="M145 26 Q155 14 175 14 Q195 14 205 26 Z" fill="#1a1a1a" />
            <path d="M150 24 Q162 16 178 16 Q194 16 200 24 Z" fill="#001a2a" opacity="0.8" />
            <rect x="80" y="26" width="100" height="4" fill="#E10600" />
            <rect x="80" y="66" width="100" height="3" fill="#E10600" />
            <path d="M270 58 L295 56 L298 62 L270 64 Z" fill="#111" />
            <path d="M273 58 L296 57" stroke="#E10600" strokeWidth="1.5" fill="none" />
            <circle cx="80" cy="72" r="16" fill="#111" stroke="#222" strokeWidth="1" />
            <circle cx="80" cy="72" r="10" fill="#0a0a0a" />
            <circle cx="80" cy="72" r="4" fill="#E10600" />
            <circle cx="240" cy="72" r="14" fill="#111" stroke="#222" strokeWidth="1" />
            <circle cx="240" cy="72" r="8" fill="#0a0a0a" />
            <circle cx="240" cy="72" r="3.5" fill="#E10600" />
            <ellipse cx="50" cy="55" rx="5" ry="8" fill="#E10600" opacity="0.25" />
            <ellipse cx="48" cy="55" rx="3" ry="5" fill="#ff6600" opacity="0.2" />
          </svg>
        </div>
      </div>
      {/* Lights */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
        <div style={{ position:"relative", width:220, height:4, background:"#111", borderRadius:2 }}>
          {[24,68,112,156,200].map((x,i)=>(
            <div key={i} style={{ position:"absolute", left:x, top:4, width:1, height:12, background:"#1a1a1a" }} />
          ))}
        </div>
        <div style={{ display:"flex", gap:10, marginTop:-2 }}>
          {Array.from({length:5},(_,i)=>(
            <div key={i} style={{
              width:24, height:24, borderRadius:"50%",
              border:"2px solid #2a0000",
              animation:`f1pulse 0.55s ${i*0.18}s ease-in-out infinite`,
            }} />
          ))}
          <style>{`
            @keyframes f1pulse {
              0%,100%{background:#180000;box-shadow:none}
              50%{background:#E10600;box-shadow:0 0 14px 5px rgba(225,6,0,0.6)}
            }
          `}</style>
        </div>
        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444",
          letterSpacing:"0.22em", textTransform:"uppercase" }}>Fetching Lap Data</div>
      </div>
    </div>
  );
}

export default function LapTimeChart({ year, country, driverNumbers = [] }: LapTimeChartProps) {
  const [chartData, setChartData] = useState<LapEntry[]>([]);
  const [drivers, setDrivers] = useState<DriverMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const driverKey = driverNumbers.join(","); // safe now — always an array

  useEffect(() => {
    if (!driverNumbers.length) {
      setError("No driver numbers provided.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const sessionKey = await fetchSessionKey(year, country);

        // Sequential fetches with delay to avoid 429 rate limiting
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        const allLaps: { lap_number: number; lap_duration: number | null }[][] = [];
        for (const n of driverNumbers) {
          allLaps.push(await fetchLapsForDriver(sessionKey, n));
          await delay(300);
        }

        const allNames: string[] = [];
        for (const n of driverNumbers) {
          allNames.push(await fetchDriverName(sessionKey, n));
          await delay(200);
        }

        if (cancelled) return;

        const lapMap: Record<number, LapEntry> = {};
        allLaps.forEach((laps, i) => {
          const num = driverNumbers[i];
          laps.forEach(({ lap_number, lap_duration }) => {
            if (!lapMap[lap_number]) lapMap[lap_number] = { lap: lap_number };
            // Convert seconds → ms; store raw for now (outliers filtered below)
            lapMap[lap_number][num] = lap_duration != null ? lap_duration * 1_000 : null;
          });
        });

        // Filter outliers: null any lap > 110% of that driver's median lap time
        driverNumbers.forEach((num) => {
          const times = Object.values(lapMap)
            .map(d => d[num] as number | null)
            .filter((t): t is number => t != null)
            .sort((a, b) => a - b);
          if (!times.length) return;
          const median = times[Math.floor(times.length / 2)];
          Object.values(lapMap).forEach(d => {
            const t = d[num] as number | null;
            if (t != null && t > median * 1.10) d[num] = null;
          });
        });

        setChartData(Object.values(lapMap).sort((a, b) => a.lap - b.lap));
        setDrivers(
          driverNumbers.map((num, i) => ({
            number: num,
            name: allNames[i],
            color: COLORS[i % COLORS.length],
          }))
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load lap times.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [year, country, driverKey]);

  // Dynamic Y-axis domain
  const allTimes = chartData
    .flatMap((d) => driverNumbers.map((n) => d[n] as number | null))
    .filter((t): t is number => t != null);
  const minT = allTimes.length ? Math.min(...allTimes) : 0;
  const maxT = allTimes.length ? Math.max(...allTimes) : 0;
  const pad = (maxT - minT) * 0.08;
  const yMin = Math.floor((minT - pad) / 1_000) * 1_000;
  const yMax = Math.ceil((maxT + pad) / 1_000) * 1_000;

  if (loading) return <LapTimesLoader />;
  if (year < 2018) return (
    <div style={{ padding:"2rem", textAlign:"center" }}>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:700,
        color:"#555", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>
        Lap data unavailable
      </div>
      <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#333", letterSpacing:1 }}>
        OpenF1 lap timing data starts from the 2018 season
      </div>
    </div>
  );
  if (error)   return <p style={{ color: "#E10600", padding: "2rem" }}>{error}</p>;

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
        {drivers.map((d) => (
          <div key={d.number} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#ccc" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, display: "inline-block" }} />
            {d.name}
          </div>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="lap"
            tick={{ fontSize: 11, fill: "#666" }}
            label={{ value: "Lap", position: "insideBottomRight", offset: -8, fill: "#555", fontSize: 11 }}
          />
          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={formatLapTime}
            tick={{ fontSize: 11, fill: "#666" }}
            width={72}
          />
          <Tooltip content={<CustomTooltip drivers={drivers} />} />
          {drivers.map((d) => (
            <Line
              key={d.number}
              type="monotone"
              dataKey={d.number}
              stroke={d.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              connectNulls={true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
