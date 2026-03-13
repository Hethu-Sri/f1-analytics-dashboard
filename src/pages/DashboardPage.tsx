import { useState } from "react";
import { motion } from "framer-motion";
import LapTimeChart from "../components/LapTimeChart";
import TireStrategyChart from "../components/TireStrategyChart";
import LightsOutLoader from "../components/LightsOutLoader";

const SEASONS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

const RACES: Record<number, string[]> = {
  2024: ["Bahrain","Saudi Arabia","Australia","Japan","China","Miami","Monaco","Canada","Spain","Austria","United Kingdom","Hungary","Belgium","Netherlands","Italy","Azerbaijan","Singapore","United States","Mexico","Brazil","Las Vegas","Qatar","Abu Dhabi"],
  2023: ["Bahrain","Saudi Arabia","Australia","Azerbaijan","Miami","Monaco","Spain","Canada","Austria","United Kingdom","Hungary","Belgium","Netherlands","Italy","Singapore","Japan","Qatar","United States","Mexico","Brazil","Las Vegas","Abu Dhabi"],
  2022: ["Bahrain","Saudi Arabia","Australia","Emilia Romagna","Miami","Spain","Monaco","Azerbaijan","Canada","United Kingdom","Austria","France","Hungary","Belgium","Netherlands","Italy","Singapore","Japan","United States","Mexico","Brazil","Abu Dhabi"],
  2021: ["Bahrain","Emilia Romagna","Portugal","Spain","Monaco","Azerbaijan","France","Austria","United Kingdom","Hungary","Belgium","Netherlands","Italy","Russia","Turkey","United States","Mexico","Brazil","Qatar","Saudi Arabia","Abu Dhabi"],
  2020: ["Austria","Styria","Hungary","United Kingdom","Spain","Belgium","Italy","Tuscany","Russia","Eifel","Portugal","Emilia Romagna","Turkey","Bahrain","Sakhir","Abu Dhabi"],
};

// Fill older seasons with a placeholder list
for (const yr of [2019,2018,2017,2016,2015]) {
  RACES[yr] = ["Australia","Bahrain","China","Azerbaijan","Spain","Monaco","Canada","France","Austria","United Kingdom","Germany","Hungary","Belgium","Italy","Singapore","Russia","Japan","United States","Mexico","Brazil","Abu Dhabi"];
}

const DRIVERS_BY_SEASON: Record<number, {num: string, name: string}[]> = {
  2024: [{num:"1",name:"Verstappen"},{num:"11",name:"Pérez"},{num:"16",name:"Leclerc"},{num:"55",name:"Sainz"},{num:"44",name:"Hamilton"},{num:"63",name:"Russell"},{num:"4",name:"Norris"},{num:"81",name:"Piastri"}],
  2023: [{num:"1",name:"Verstappen"},{num:"11",name:"Pérez"},{num:"16",name:"Leclerc"},{num:"55",name:"Sainz"},{num:"44",name:"Hamilton"},{num:"63",name:"Russell"},{num:"14",name:"Alonso"}],
  2022: [{num:"1",name:"Verstappen"},{num:"11",name:"Pérez"},{num:"16",name:"Leclerc"},{num:"55",name:"Sainz"},{num:"44",name:"Hamilton"},{num:"63",name:"Russell"}],
};
const DEFAULT_DRIVERS = [{num:"1",name:"VER"},{num:"16",name:"LEC"},{num:"44",name:"HAM"}];

const label = (s: string) => ({ color:"#555", fontSize:10, letterSpacing:"1px", textTransform:"uppercase" as const, marginBottom:4, display:"block" });
const sel = { background:"#111", border:"1px solid #222", color:"#f0f0f0", fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, padding:"7px 10px", borderRadius:4, cursor:"pointer", width:"100%" } as const;

export default function DashboardPage() {
  const [season, setSeason]   = useState(2024);
  const [country, setCountry] = useState("Bahrain");
  const [d1, setD1] = useState("1");
  const [d2, setD2] = useState("16");
  const [loaded, setLoaded]   = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const drivers = DRIVERS_BY_SEASON[season] ?? DEFAULT_DRIVERS;
  const races   = RACES[season] ?? RACES[2024];

  function handleLoad() {
    setLoaded(false);
    setLoading(true);
    setLoadKey(k => k + 1);
  }

  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:"32px 24px" }}>

      {/* Page header */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>
        <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:4 }}>
          <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:36, fontWeight:900, letterSpacing:2, textTransform:"uppercase" }}>
            Race <span style={{color:"#E10600"}}>Analysis</span>
          </h1>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:"#444", letterSpacing:2 }}>
            10 SEASONS · LIVE DATA
          </span>
        </div>
        <div style={{ height:2, background:"#E10600", width:60, marginBottom:32 }} />
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.1,duration:0.4}}
        style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end", marginBottom:32,
          background:"#0f0f0f", border:"1px solid #1a1a1a", borderRadius:8, padding:"16px 20px" }}
      >
        <div style={{flex:"0 0 100px"}}>
          <span style={label("season")}>Season</span>
          <select style={sel} value={season} onChange={e=>{setSeason(+e.target.value); setCountry(RACES[+e.target.value]?.[0]??"Bahrain");}}>
            {SEASONS.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{flex:"1 1 160px"}}>
          <span style={label("race")}>Race</span>
          <select style={sel} value={country} onChange={e=>setCountry(e.target.value)}>
            {races.map(r=><option key={r} value={r}>{r} GP</option>)}
          </select>
        </div>
        <div style={{flex:"0 0 130px"}}>
          <span style={label("driver 1")}>Driver 1</span>
          <select style={sel} value={d1} onChange={e=>setD1(e.target.value)}>
            {drivers.map(d=><option key={d.num} value={d.num}>#{d.num} {d.name}</option>)}
          </select>
        </div>
        <div style={{flex:"0 0 130px"}}>
          <span style={label("driver 2")}>Driver 2</span>
          <select style={sel} value={d2} onChange={e=>setD2(e.target.value)}>
            {drivers.filter(d=>d.num!==d1).map(d=><option key={d.num} value={d.num}>#{d.num} {d.name}</option>)}
          </select>
        </div>
        <button
          onClick={handleLoad}
          style={{
            flex:"0 0 auto", padding:"8px 24px",
            background:"#E10600", border:"none", borderRadius:4,
            fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700,
            letterSpacing:2, color:"#fff", textTransform:"uppercase", cursor:"pointer",
          }}
        >
          Load Race
        </button>
      </motion.div>

      {/* Lights-out loader */}
      {loading && !loaded && (
        <div style={{ display:"flex", justifyContent:"center", padding:"40px 0" }}>
          <LightsOutLoader label="Loading Race Data" onComplete={() => { setLoaded(true); setLoading(false); }} />
        </div>
      )}

      {/* Charts */}
      {loaded && (
        <motion.div key={loadKey} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>

          {/* Lap times */}
          <div style={{ marginBottom:40 }}>
            <SectionHeader title="Lap Times" sub="Head-to-head race pace" />
            <div style={{ background:"#0f0f0f", border:"1px solid #1a1a1a", borderRadius:8, padding:"20px 16px" }}>
              <LapTimeChart year={season} country={country} driverNumbers={[d1,d2]} />
            </div>
          </div>

          {/* Tire strategy */}
          <div>
            <SectionHeader title="Tire Strategy" sub="Full grid stint breakdown" />
            <div style={{ background:"#0f0f0f", border:"1px solid #1a1a1a", borderRadius:8, padding:"20px 16px" }}>
              <TireStrategyChart year={season} country={country} />
            </div>
          </div>

        </motion.div>
      )}

      {!loading && !loaded && (
        <div style={{ textAlign:"center", padding:"80px 0", color:"#2a2a2a" }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, letterSpacing:3, textTransform:"uppercase" }}>
            Select a race and hit Load Race
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
        <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase" }}>
          {title}
        </h2>
        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444", letterSpacing:1 }}>{sub}</span>
      </div>
      <div style={{ height:1, background:"#1a1a1a", marginTop:6 }} />
    </div>
  );
}
