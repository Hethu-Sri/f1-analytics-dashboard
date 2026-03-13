import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchRaceResults } from "../utils/api";
import LightsOutLoader from "../components/LightsOutLoader";

interface RaceResult {
  raceId: string;
  raceName: string;
  date: string;
  results: Array<{
    position: string;
    points: string;
    driver: { driverId: string; code: string; givenName: string; familyName: string };
    constructor: { name: string };
  }>;
}

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

export default function ResultsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [races, setRaces] = useState<RaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRaceResults(year);
        console.log(`Received ${data?.length || 0} races from API for ${year}`);
        
        if (!Array.isArray(data) || data.length === 0) {
          setError(`No results found for ${year}. Data may not be available.`);
          setRaces([]);
          return;
        }
        
        // Transform races safely with error handling
        const processedRaces: RaceResult[] = [];
        for (const race of data) {
          try {
            processedRaces.push({
              raceId: String(race.round || race.raceName || "unknown"),
              raceName: race.raceName || "Unknown Race",
              date: race.date || "TBA",
              results: Array.isArray(race.Results) ? race.Results.map((result: any) => ({
                position: String(result.position || "?"),
                points: String(result.points || "0"),
                driver: {
                  driverId: result.Driver?.driverId || "unknown",
                  code: result.Driver?.code || "?",
                  givenName: result.Driver?.givenName || "",
                  familyName: result.Driver?.familyName || "",
                },
                constructor: {
                  name: result.Constructor?.name || "Unknown",
                },
              })) : [],
            });
          } catch (err) {
            console.warn(`Error processing race at index:`, err);
          }
        }
        
        console.log(`Processed ${processedRaces.length} valid races for display`);
        
        if (processedRaces.length === 0) {
          setError(`No valid race data found for ${year}.`);
          setRaces([]);
          return;
        }
        
        setRaces(processedRaces);
      } catch (err) {
        console.error(`Error in Results page:`, err);
        setError(`Error loading ${year} results: ` + (err instanceof Error ? err.message : "Unknown error"));
        setRaces([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [year]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 36, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
          Race <span style={{ color: "#E10600" }}>Results</span>
        </h1>
        <div style={{ height: 2, background: "#E10600", width: 60, marginBottom: 8 }} />
        <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 24 }}>
          Complete season standings
        </p>
      </motion.div>

      {/* Year selector */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        style={{
          background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 8, padding: "16px 20px", marginBottom: 32,
          display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap"
        }}
      >
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>
          Season
        </span>
        <select
          value={year}
          onChange={e => setYear(+e.target.value)}
          style={{
            background: "#111", border: "1px solid #222", color: "#f0f0f0",
            fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, padding: "7px 10px",
            borderRadius: 4, cursor: "pointer"
          }}
        >
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </motion.div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <LightsOutLoader label="Loading race results" onComplete={() => {}} />
        </div>
      )}

      {error && (
        <div style={{ background: "#0f0f0f", border: "1px solid #E10600", borderRadius: 8, padding: 20 }}>
          <p style={{ color: "#E10600", fontFamily: "'Share Tech Mono',monospace", fontSize: 12 }}>{error}</p>
        </div>
      )}

      {!loading && !error && races.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          {races.map((race, raceIdx) => (
            <motion.div
              key={race.raceId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: raceIdx * 0.03, duration: 0.3 }}
              style={{
                background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 8, padding: 20, marginBottom: 16
              }}
            >
              {/* Race header */}
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 700, color: "#f0f0f0", marginBottom: 4, letterSpacing: 1, textTransform: "uppercase" }}>
                  {race.raceName}
                </h2>
                <p style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#444", letterSpacing: 1 }}>
                  {new Date(race.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>

              {/* Results table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%", borderCollapse: "collapse",
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 11
                }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                      <th style={{ textAlign: "left", padding: "8px 0", color: "#555", fontWeight: 600, textTransform: "uppercase", fontSize: 9 }}>Position</th>
                      <th style={{ textAlign: "left", padding: "8px 0", paddingLeft: 16, color: "#555", fontWeight: 600, textTransform: "uppercase", fontSize: 9 }}>Driver</th>
                      <th style={{ textAlign: "left", padding: "8px 0", paddingLeft: 16, color: "#555", fontWeight: 600, textTransform: "uppercase", fontSize: 9 }}>Constructor</th>
                      <th style={{ textAlign: "right", padding: "8px 0", color: "#555", fontWeight: 600, textTransform: "uppercase", fontSize: 9 }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {race.results.map((result, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #0f0f0f", background: idx % 2 === 0 ? "transparent" : "#0a0a0a" }}>
                        <td style={{
                          padding: "10px 0", color: result.position === "1" ? "#E10600" : "#aaa",
                          fontWeight: result.position === "1" ? 700 : 600, fontSize: 12
                        }}>
                          {result.position}
                        </td>
                        <td style={{ padding: "10px 0", paddingLeft: 16, color: "#f0f0f0" }}>
                          {result.driver.givenName.slice(0, 1)}.{" "}{result.driver.familyName}
                        </td>
                        <td style={{ padding: "10px 0", paddingLeft: 16, color: "#aaa" }}>
                          {result.constructor.name}
                        </td>
                        <td style={{ padding: "10px 0", textAlign: "right", color: "#f0f0f0", fontWeight: 600 }}>
                          {result.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!loading && !error && races.length === 0 && (
        <div style={{
          background: "#0f0f0f", border: "2px dashed #1a1a1a", borderRadius: 8, padding: "60px 40px",
          textAlign: "center"
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 700,
            letterSpacing: 2, textTransform: "uppercase", color: "#aaa", marginBottom: 12
          }}>
            No Results Available
          </div>
          <p style={{
            fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "#555",
            letterSpacing: 1
          }}>
            {year >= 2026 ? "Data unavailable for this future season" : `No data found for ${year}`}
          </p>
        </div>
      )}
    </div>
  );
}
