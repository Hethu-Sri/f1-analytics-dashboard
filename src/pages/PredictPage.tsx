import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LightsOutLoader from "../components/LightsOutLoader";

interface DriverPrediction {
  number: string;
  name: string;
  team: string;
  teamColor: string;
  currentPoints: number;
  projectedPoints: number;
  winProbability: number;
  trend: "up" | "down" | "stable";
  recentForm: number[]; // last 5 race finishes
}

const TEAM_COLORS: Record<string, string> = {
  "Red Bull Racing": "#3671C6",
  "Ferrari": "#E8002D",
  "Mercedes": "#27F4D2",
  "McLaren": "#FF8000",
  "Aston Martin": "#229971",
  "Alpine": "#FF87BC",
  "Williams": "#64C4FF",
  "RB": "#6692FF",
  "Haas F1 Team": "#B6BABD",
  "Kick Sauber": "#52E252",
};

// Points by finishing position
const PTS = [25,18,15,12,10,8,6,4,2,1,0,0,0,0,0,0,0,0,0,0];

async function fetchStandings() {
  // Use Jolpica (Ergast replacement) for current standings
  const res = await fetch("https://api.jolpi.ca/ergast/f1/2024/driverStandings.json");
  if (!res.ok) throw new Error("Standings fetch failed");
  const data = await res.json();
  return data.MRData.StandingsTable.StandingsLists[0].DriverStandings as any[];
}

async function fetchRecentResults(driverId: string) {
  const res = await fetch(`https://api.jolpi.ca/ergast/f1/2024/drivers/${driverId}/results.json?limit=5&offset=15`);
  if (!res.ok) return [5,5,5,5,5];
  const data = await res.json();
  const races = data.MRData.RaceTable.Races;
  return races.map((r: any) => parseInt(r.Results[0]?.position ?? "20")).slice(-5);
}

function computeWinProbabilities(predictions: Omit<DriverPrediction,"winProbability">[]): DriverPrediction[] {
  const maxPts = Math.max(...predictions.map(d => d.projectedPoints));
  const raw = predictions.map(d => {
    const gap = maxPts - d.projectedPoints;
    const score = Math.exp(-gap / 40);
    return score;
  });
  const total = raw.reduce((a,b) => a+b, 0);
  return predictions.map((d, i) => ({
    ...d,
    winProbability: Math.round((raw[i] / total) * 100),
  }));
}

export default function PredictPage() {
  const [drivers, setDrivers] = useState<DriverPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [racesLeft, setRacesLeft] = useState(6);

  useEffect(() => {
    async function load() {
      try {
        const standings = await fetchStandings();
        const top10 = standings.slice(0, 10);

        const withForm = await Promise.all(
          top10.map(async (s: any, i: number) => {
            await new Promise(r => setTimeout(r, i * 150));
            const form = await fetchRecentResults(s.Driver.driverId);
            const currentPts = parseFloat(s.points);
            // Project: avg points per race * races left + current
            const avgPts = form.map((p: number) => PTS[p-1] ?? 0).reduce((a:number,b:number)=>a+b,0) / form.length;
            const projected = Math.round(currentPts + avgPts * racesLeft);
            const trend = (form[form.length-1] < form[0]
              ? "up"
              : form[form.length-1] > form[0]
              ? "down"
              : "stable") as DriverPrediction["trend"];
            const team = s.Constructors[0]?.name ?? "Unknown";
            return {
              number: s.Driver.permanentNumber ?? "?",
              name: `${s.Driver.givenName} ${s.Driver.familyName}`,
              team,
              teamColor: TEAM_COLORS[team] ?? "#555",
              currentPoints: currentPts,
              projectedPoints: projected,
              trend,
              recentForm: form,
            } as Omit<DriverPrediction, "winProbability">;
          })
        ) as Omit<DriverPrediction, "winProbability">[];

        const withProb = computeWinProbabilities(withForm);
        setDrivers(withProb.sort((a,b) => b.winProbability - a.winProbability));
      } catch(e) {
        setError(e instanceof Error ? e.message : "Failed to load predictions");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [racesLeft]);

  const maxProj = drivers.length ? Math.max(...drivers.map(d=>d.projectedPoints)) : 1;

  return (
    <div style={{maxWidth:1200, margin:"0 auto", padding:"32px 24px"}}>

      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>
        <h1 style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:36, fontWeight:900, letterSpacing:2, textTransform:"uppercase", marginBottom:4}}>
          Championship <span style={{color:"#E10600"}}>Predictor</span>
        </h1>
        <div style={{height:2, background:"#E10600", width:60, marginBottom:8}} />
        <p style={{fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444", letterSpacing:2, textTransform:"uppercase", marginBottom:24}}>
          Based on 2024 standings · Projected win probability
        </p>
      </motion.div>

      {/* Races left slider */}
      <div style={{background:"#0f0f0f", border:"1px solid #1a1a1a", borderRadius:8, padding:"16px 20px", marginBottom:32, display:"flex", gap:20, alignItems:"center", flexWrap:"wrap"}}>
        <span style={{fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#555", letterSpacing:1, textTransform:"uppercase", whiteSpace:"nowrap"}}>Races remaining</span>
        <input type="range" min={1} max={24} value={racesLeft} onChange={e=>setRacesLeft(+e.target.value)}
          style={{flex:1, accentColor:"#E10600", minWidth:120}} />
        <span style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:24, fontWeight:700, color:"#E10600", minWidth:32}}>{racesLeft}</span>
        <span style={{fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#333", letterSpacing:1}}>
          MODEL: Avg recent pts × remaining races
        </span>
      </div>

      {loading && (
        <div style={{display:"flex",justifyContent:"center",padding:"40px 0"}}>
          <LightsOutLoader label="Running prediction model" onComplete={()=>{}} />
        </div>
      )}

      {error && <p style={{color:"#E10600", fontFamily:"'Share Tech Mono',monospace", fontSize:12}}>{error}</p>}

      {!loading && !error && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.4}}>
          {drivers.map((d, i) => (
            <motion.div
              key={d.number}
              initial={{opacity:0, x:-20}}
              animate={{opacity:1, x:0}}
              transition={{delay:i*0.05, duration:0.35}}
              style={{
                display:"grid",
                gridTemplateColumns:"32px 40px 1fr 80px 80px 60px",
                gap:16,
                alignItems:"center",
                background:"#0f0f0f",
                border:"1px solid #1a1a1a",
                borderRadius:8,
                padding:"14px 20px",
                marginBottom:8,
                borderLeft:`3px solid ${d.teamColor}`,
              }}
            >
              {/* Position */}
              <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:700, color: i===0?"#E10600":"#333"}}>
                {i+1}
              </div>

              {/* Number */}
              <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:"#444"}}>
                #{d.number}
              </div>

              {/* Name + projected bar */}
              <div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:700, color:"#f0f0f0", marginBottom:4}}>
                  {d.name}
                  <span style={{fontSize:11, color:"#444", marginLeft:8, fontWeight:400}}>{d.team}</span>
                </div>
                <div style={{height:3, background:"#1a1a1a", borderRadius:2, overflow:"hidden"}}>
                  <motion.div
                    initial={{width:0}}
                    animate={{width:`${(d.projectedPoints/maxProj)*100}%`}}
                    transition={{duration:0.8, ease:[0.16,1,0.3,1], delay:i*0.05+0.3}}
                    style={{height:"100%", background:d.teamColor, borderRadius:2}}
                  />
                </div>
              </div>

              {/* Current pts */}
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#444", letterSpacing:1, marginBottom:2}}>CURRENT</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:700, color:"#888"}}>{d.currentPoints}</div>
              </div>

              {/* Projected pts */}
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#444", letterSpacing:1, marginBottom:2}}>PROJECTED</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:700, color:"#f0f0f0"}}>{d.projectedPoints}</div>
              </div>

              {/* Win probability */}
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#444", letterSpacing:1, marginBottom:2}}>WIN %</div>
                <div style={{
                  fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:900,
                  color: d.winProbability > 50 ? "#E10600" : d.winProbability > 20 ? "#f0f0f0" : "#444",
                }}>{d.winProbability}%</div>
              </div>
            </motion.div>
          ))}

          {/* Disclaimer */}
          <p style={{fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#2a2a2a", letterSpacing:1, textTransform:"uppercase", marginTop:24, textAlign:"center"}}>
            Model uses exponential decay on points gap from leader · Not financial or sporting advice
          </p>
        </motion.div>
      )}
    </div>
  );
}
