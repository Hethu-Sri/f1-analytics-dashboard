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

  if (loading) return <p style={{ color: "#aaa", padding: "2rem" }}>Loading lap times…</p>;
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
