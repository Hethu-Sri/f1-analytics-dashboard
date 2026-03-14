import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LapTimeChart from "../components/LapTimeChart";
import TireStrategyChart from "../components/TireStrategyChart";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Race {
  round: string;
  name: string;
  shortName: string;
  openf1Country: string; // exact OpenF1 country_name
  jolpicaCountry: string; // for LapTimeChart `country` prop
  circuit: string;
  date: string;
  isSprint: boolean;
}

interface Driver {
  num: string;
  name: string;
  code: string;
  team: string;
  teamColor: string;
}

interface SessionStats {
  winner: string;
  fastestLap: string;
  totalLaps: number;
  driverCount: number;
}

// ─── 2026 calendar — exact OpenF1 country_name values verified ───────────────

const CALENDAR_2026: Race[] = [
  { round:"1",  name:"Australian Grand Prix",   shortName:"Australia",   openf1Country:"Australia",    jolpicaCountry:"Australia",    circuit:"Albert Park",             date:"2026-03-08", isSprint:false },
  { round:"2",  name:"Chinese Grand Prix",       shortName:"China",       openf1Country:"China",        jolpicaCountry:"China",        circuit:"Shanghai International",   date:"2026-03-15", isSprint:true  },
  { round:"3",  name:"Japanese Grand Prix",      shortName:"Japan",       openf1Country:"Japan",        jolpicaCountry:"Japan",        circuit:"Suzuka",                  date:"2026-03-29", isSprint:false },
  { round:"4",  name:"Bahrain Grand Prix",       shortName:"Bahrain",     openf1Country:"Bahrain",      jolpicaCountry:"Bahrain",      circuit:"Bahrain International",   date:"2026-04-12", isSprint:false },
  { round:"5",  name:"Saudi Arabian Grand Prix", shortName:"Saudi Arabia",openf1Country:"Saudi Arabia", jolpicaCountry:"Saudi Arabia", circuit:"Jeddah Corniche",         date:"2026-04-19", isSprint:false },
  { round:"6",  name:"Miami Grand Prix",         shortName:"Miami",       openf1Country:"United States",jolpicaCountry:"United States",circuit:"Miami International",     date:"2026-05-03", isSprint:true  },
  { round:"7",  name:"Canadian Grand Prix",      shortName:"Canada",      openf1Country:"Canada",       jolpicaCountry:"Canada",       circuit:"Circuit Gilles Villeneuve",date:"2026-05-24",isSprint:true  },
  { round:"8",  name:"Monaco Grand Prix",        shortName:"Monaco",      openf1Country:"Monaco",       jolpicaCountry:"Monaco",       circuit:"Circuit de Monaco",       date:"2026-06-07", isSprint:false },
  { round:"9",  name:"Spanish Grand Prix",       shortName:"Spain",       openf1Country:"Spain",        jolpicaCountry:"Spain",        circuit:"Barcelona-Catalunya",     date:"2026-06-14", isSprint:false },
  { round:"10", name:"Austrian Grand Prix",      shortName:"Austria",     openf1Country:"Austria",      jolpicaCountry:"Austria",      circuit:"Red Bull Ring",           date:"2026-06-28", isSprint:false },
  { round:"11", name:"British Grand Prix",       shortName:"Britain",     openf1Country:"Great Britain",jolpicaCountry:"United Kingdom",circuit:"Silverstone",            date:"2026-07-05", isSprint:true  },
  { round:"12", name:"Belgian Grand Prix",       shortName:"Belgium",     openf1Country:"Belgium",      jolpicaCountry:"Belgium",      circuit:"Spa-Francorchamps",       date:"2026-07-19", isSprint:false },
  { round:"13", name:"Hungarian Grand Prix",     shortName:"Hungary",     openf1Country:"Hungary",      jolpicaCountry:"Hungary",      circuit:"Hungaroring",             date:"2026-07-26", isSprint:false },
  { round:"14", name:"Dutch Grand Prix",         shortName:"Netherlands", openf1Country:"Netherlands",  jolpicaCountry:"Netherlands",  circuit:"Zandvoort",               date:"2026-08-23", isSprint:true  },
  { round:"15", name:"Italian Grand Prix",       shortName:"Italy",       openf1Country:"Italy",        jolpicaCountry:"Italy",        circuit:"Monza",                   date:"2026-09-06", isSprint:false },
  { round:"16", name:"Madrid Grand Prix",        shortName:"Madrid",      openf1Country:"Spain",        jolpicaCountry:"Spain",        circuit:"Street Circuit Madrid",   date:"2026-09-13", isSprint:false },
  { round:"17", name:"Azerbaijan Grand Prix",    shortName:"Azerbaijan",  openf1Country:"Azerbaijan",   jolpicaCountry:"Azerbaijan",   circuit:"Baku City Circuit",       date:"2026-09-26", isSprint:false },
  { round:"18", name:"Singapore Grand Prix",     shortName:"Singapore",   openf1Country:"Singapore",    jolpicaCountry:"Singapore",    circuit:"Marina Bay",              date:"2026-10-11", isSprint:true  },
  { round:"19", name:"United States Grand Prix", shortName:"USA",         openf1Country:"United States",jolpicaCountry:"United States",circuit:"Circuit of the Americas", date:"2026-10-25", isSprint:false },
  { round:"20", name:"Mexico City Grand Prix",   shortName:"Mexico",      openf1Country:"Mexico",       jolpicaCountry:"Mexico",       circuit:"Hermanos Rodriguez",      date:"2026-11-01", isSprint:false },
  { round:"21", name:"São Paulo Grand Prix",     shortName:"Brazil",      openf1Country:"Brazil",       jolpicaCountry:"Brazil",       circuit:"Interlagos",              date:"2026-11-08", isSprint:false },
  { round:"22", name:"Las Vegas Grand Prix",     shortName:"Las Vegas",   openf1Country:"United States",jolpicaCountry:"United States",circuit:"Las Vegas Strip",         date:"2026-11-21", isSprint:false },
  { round:"23", name:"Qatar Grand Prix",         shortName:"Qatar",       openf1Country:"Qatar",        jolpicaCountry:"Qatar",        circuit:"Lusail",                  date:"2026-11-29", isSprint:false },
  { round:"24", name:"Abu Dhabi Grand Prix",     shortName:"Abu Dhabi",   openf1Country:"Abu Dhabi",    jolpicaCountry:"Abu Dhabi",    circuit:"Yas Marina",              date:"2026-12-06", isSprint:false },
];

// Jolpica country mapping for non-2026 seasons
const JOLPICA_COUNTRY_MAP: Record<string, string> = {
  "UK": "United Kingdom", "Great Britain": "United Kingdom",
  "USA": "United States", "Abu Dhabi": "Abu Dhabi",
};

// ─── 2026 drivers static fallback (from confirmed FIA entry list) ─────────────

const DRIVERS_2026_FALLBACK: Driver[] = [
  { num:"1",  name:"Lando Norris",     code:"NOR", team:"McLaren",      teamColor:"#FF8000" },
  { num:"81", name:"Oscar Piastri",    code:"PIA", team:"McLaren",      teamColor:"#FF8000" },
  { num:"63", name:"George Russell",   code:"RUS", team:"Mercedes",     teamColor:"#27F4D2" },
  { num:"12", name:"Kimi Antonelli",   code:"ANT", team:"Mercedes",     teamColor:"#27F4D2" },
  { num:"3",  name:"Max Verstappen",   code:"VER", team:"Red Bull",     teamColor:"#3671C6" },
  { num:"6",  name:"Isack Hadjar",     code:"HAD", team:"Red Bull",     teamColor:"#3671C6" },
  { num:"16", name:"Charles Leclerc",  code:"LEC", team:"Ferrari",      teamColor:"#E8002D" },
  { num:"44", name:"Lewis Hamilton",   code:"HAM", team:"Ferrari",      teamColor:"#E8002D" },
  { num:"23", name:"Alexander Albon",  code:"ALB", team:"Williams",     teamColor:"#64C4FF" },
  { num:"55", name:"Carlos Sainz",     code:"SAI", team:"Williams",     teamColor:"#64C4FF" },
  { num:"41", name:"Arvid Lindblad",   code:"LIN", team:"Racing Bulls", teamColor:"#6692FF" },
  { num:"30", name:"Liam Lawson",      code:"LAW", team:"Racing Bulls", teamColor:"#6692FF" },
  { num:"14", name:"Fernando Alonso",  code:"ALO", team:"Aston Martin", teamColor:"#229971" },
  { num:"18", name:"Lance Stroll",     code:"STR", team:"Aston Martin", teamColor:"#229971" },
  { num:"87", name:"Oliver Bearman",   code:"BEA", team:"Haas",         teamColor:"#B6BABD" },
  { num:"31", name:"Esteban Ocon",     code:"OCO", team:"Haas",         teamColor:"#B6BABD" },
  { num:"27", name:"Nico Hülkenberg",  code:"HUL", team:"Audi",         teamColor:"#B0B0B0" },
  { num:"5",  name:"Gabriel Bortoleto",code:"BOR", team:"Audi",         teamColor:"#B0B0B0" },
  { num:"10", name:"Pierre Gasly",     code:"GAS", team:"Alpine",       teamColor:"#FF87BC" },
  { num:"43", name:"Franco Colapinto", code:"COL", team:"Alpine",       teamColor:"#FF87BC" },
  { num:"11", name:"Sergio Pérez",     code:"PER", team:"Cadillac",     teamColor:"#CC0000" },
  { num:"77", name:"Valtteri Bottas",  code:"BOT", team:"Cadillac",     teamColor:"#CC0000" },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const JOLPICA = "https://api.jolpi.ca/ergast/f1";
const OPENF1  = "https://api.openf1.org/v1";
const SEASONS = [2026,2025,2024,2023,2022,2021,2020,2019,2018,2017,2016,2015];

const TEAM_COLORS: Record<string, string> = {
  "McLaren":"#FF8000","Mercedes":"#27F4D2","Red Bull":"#3671C6",
  "Ferrari":"#E8002D","Williams":"#64C4FF","Racing Bulls":"#6692FF",
  "RB":"#6692FF","AlphaTauri":"#6692FF","Aston Martin":"#229971",
  "Haas":"#B6BABD","Haas F1 Team":"#B6BABD","Audi":"#B0B0B0",
  "Alpine":"#FF87BC","Alfa Romeo":"#C92D4B","Cadillac":"#CC0000",
  "Renault":"#FFD700","Racing Point":"#F596C8","Force India":"#FF80C7",
  "Toro Rosso":"#469BFF","Sauber":"#C92D4B",
};
function getTeamColor(name: string) {
  for (const [k,v] of Object.entries(TEAM_COLORS))
    if (name.toLowerCase().includes(k.toLowerCase())) return v;
  return "#555";
}

const FLAGS: Record<string,string> = {
  "Australia":"🇦🇺","China":"🇨🇳","Japan":"🇯🇵","Bahrain":"🇧🇭","Saudi Arabia":"🇸🇦",
  "United States":"🇺🇸","Canada":"🇨🇦","Monaco":"🇲🇨","Spain":"🇪🇸","Austria":"🇦🇹",
  "United Kingdom":"🇬🇧","Great Britain":"🇬🇧","Belgium":"🇧🇪","Hungary":"🇭🇺",
  "Netherlands":"🇳🇱","Italy":"🇮🇹","Azerbaijan":"🇦🇿","Singapore":"🇸🇬",
  "Mexico":"🇲🇽","Brazil":"🇧🇷","Qatar":"🇶🇦","Abu Dhabi":"🇦🇪",
};

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchSchedule(year: number): Promise<Race[]> {
  if (year === 2026) return CALENDAR_2026;
  try {
    const res = await fetch(`${JOLPICA}/${year}.json`);
    if (!res.ok) return [];
    const data = await res.json();
    const races: any[] = data?.MRData?.RaceTable?.Races ?? [];
    return races.map(r => {
      const rawCountry = r.Circuit?.Location?.country ?? "";
      const jolpicaCountry = JOLPICA_COUNTRY_MAP[rawCountry] ?? rawCountry;
      return {
        round: r.round,
        name: r.raceName,
        shortName: r.raceName.replace(" Grand Prix","").trim(),
        openf1Country: jolpicaCountry,
        jolpicaCountry,
        circuit: r.Circuit?.circuitName ?? "",
        date: r.date,
        isSprint: false,
      };
    });
  } catch { return []; }
}

// Fetch drivers from a SPECIFIC race round (not season-wide)
async function fetchDriversForRace(year: number, round: string): Promise<Driver[]> {
  try {
    const res = await fetch(`${JOLPICA}/${year}/${round}/results.json`);
    if (!res.ok) throw new Error("jolpica fail");
    const data = await res.json();
    const results: any[] = data?.MRData?.RaceTable?.Races?.[0]?.Results ?? [];
    if (!results.length) throw new Error("no results");
    return results.map(r => {
      const team = r.Constructor?.name ?? "Unknown";
      return {
        num: r.Driver.permanentNumber ?? r.Driver.code ?? String(r.number ?? "?"),
        name: `${r.Driver.givenName} ${r.Driver.familyName}`,
        code: r.Driver.code ?? r.Driver.familyName.slice(0,3).toUpperCase(),
        team,
        teamColor: getTeamColor(team),
      };
    });
  } catch { return []; }
}

// Per-race number: Jolpica returns Driver.permanentNumber (their chosen racing number for that season)
// e.g. 2021 Hamilton = 44, 2019 Leclerc = 16. This is correct — it IS the season number.
// For drivers without permanentNumber (very old seasons), fall back to their result entry number.

async function fetch2026Drivers(round: string): Promise<Driver[]> {
  try {
    // Try OpenF1 for the specific round session
    const sessRes = await fetch(`${OPENF1}/sessions?year=2026&session_name=Race`);
    if (!sessRes.ok) return DRIVERS_2026_FALLBACK;
    const sessions: any[] = await sessRes.json();
    // Pick session matching the round index
    const session = sessions[parseInt(round)-1] ?? sessions[0];
    if (!session) return DRIVERS_2026_FALLBACK;
    const drRes = await fetch(`${OPENF1}/drivers?session_key=${session.session_key}`);
    if (!drRes.ok) return DRIVERS_2026_FALLBACK;
    const drs: any[] = await drRes.json();
    if (!drs.length) return DRIVERS_2026_FALLBACK;
    return drs.map(d => {
      const team = d.team_name ?? "Unknown";
      return {
        num: String(d.driver_number),
        name: (d.full_name ?? `${d.first_name??""} ${d.last_name??""}`.trim())
          .toLowerCase().replace(/\b\w/g,(c:string)=>c.toUpperCase()),
        code: d.name_acronym ?? "???",
        team,
        teamColor: getTeamColor(team),
      };
    }).sort((a,b)=>+a.num - +b.num);
  } catch { return DRIVERS_2026_FALLBACK; }
}

async function fetchSessionStats(year: number, openf1Country: string): Promise<SessionStats|null> {
  try {
    const sRes = await fetch(`${OPENF1}/sessions?year=${year}&country_name=${encodeURIComponent(openf1Country)}&session_name=Race`);
    if (!sRes.ok) return null;
    const sessions = await sRes.json();
    if (!sessions.length) return null;
    const sk = sessions[0].session_key;

    const [drRes, posRes] = await Promise.all([
      fetch(`${OPENF1}/drivers?session_key=${sk}`),
      fetch(`${OPENF1}/position?session_key=${sk}&position=1`),
    ]);
    const drs = drRes.ok ? await drRes.json() : [];
    const pos = posRes.ok ? await posRes.json() : [];

    const lastPos = pos[pos.length-1];
    const winner = lastPos ? drs.find((d:any)=>d.driver_number===lastPos.driver_number) : null;
    const winnerName = winner
      ? (winner.full_name ?? `${winner.first_name} ${winner.last_name}`)
          .toLowerCase().replace(/\b\w/g,(c:string)=>c.toUpperCase())
      : "—";

    const flRes = await fetch(`${OPENF1}/laps?session_key=${sk}&limit=500`);
    const flData = flRes.ok ? await flRes.json() : [];
    const times = flData.filter((l:any)=>l.lap_duration&&l.lap_duration>60&&l.lap_duration<300).map((l:any)=>l.lap_duration as number);
    const fastest = times.length ? Math.min(...times) : 0;
    const fm = fastest ? `${Math.floor(fastest/60)}:${(fastest%60).toFixed(3).padStart(6,"0")}` : "—";
    const totalLaps = flData.length ? Math.max(...flData.map((l:any)=>l.lap_number||0)) : 0;

    return { winner: winnerName, fastestLap: fm, totalLaps, driverCount: drs.length };
  } catch { return null; }
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function Countdown({ date, large=false }: { date: string; large?: boolean }) {
  const [t, setT] = useState({ d:0,h:0,m:0,s:0 });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(date).getTime() - Date.now();
      if (diff<=0) { setT({d:0,h:0,m:0,s:0}); return; }
      setT({ d:Math.floor(diff/86400000), h:Math.floor((diff%86400000)/3600000),
             m:Math.floor((diff%3600000)/60000), s:Math.floor((diff%60000)/1000) });
    };
    tick();
    const id = setInterval(tick,1000);
    return ()=>clearInterval(id);
  },[date]);
  return (
    <div style={{display:"flex",gap:large?12:6,alignItems:"center"}}>
      {([["D",t.d],["H",t.h],["M",t.m],["S",t.s]] as const).map(([l,v])=>(
        <div key={l} style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:large?36:20,fontWeight:900,
            color:"#E10600",lineHeight:1,minWidth:large?44:28}}>
            {String(v).padStart(2,"0")}
          </div>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:large?10:8,
            color:"#444",letterSpacing:1}}>{l}</div>
        </div>
      ))}
    </div>
  );
}

// ─── F1 Car loader ────────────────────────────────────────────────────────────

function F1CarLoader({ label }: { label: string }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:32,padding:"48px 0"}}>
      {/* Animated car on track */}
      <div style={{position:"relative",width:"100%",maxWidth:500,height:80,overflow:"hidden"}}>
        {/* Track lines */}
        <div style={{position:"absolute",bottom:8,left:0,right:0,height:1,background:"#1a1a1a"}} />
        <div style={{position:"absolute",bottom:16,left:0,right:0,height:1,background:"#111"}} />
        {/* Dashed centre line */}
        {Array.from({length:12},(_,i)=>(
          <div key={i} style={{position:"absolute",bottom:12,left:`${i*9}%`,width:"5%",height:1,background:"#222"}} />
        ))}
        {/* Car sweeping across */}
        <motion.div
          animate={{x:["-120px","calc(100% + 120px)"]}}
          transition={{duration:2.2,repeat:Infinity,ease:"easeInOut",repeatDelay:0.3}}
          style={{position:"absolute",bottom:8}}
        >
          {/* Speed lines */}
          <motion.div
            animate={{opacity:[0,0.6,0],scaleX:[0.3,1,0.3]}}
            transition={{duration:2.2,repeat:Infinity,ease:"easeInOut",repeatDelay:0.3}}
            style={{position:"absolute",right:"100%",top:"50%",marginTop:-1,
              width:80,height:2,background:"linear-gradient(90deg,transparent,#E10600)",
              transformOrigin:"right"}}
          />
          <svg width="180" height="56" viewBox="0 0 320 100">
            <ellipse cx="160" cy="95" rx="100" ry="4" fill="rgba(0,0,0,0.3)" />
            <rect x="18" y="28" width="36" height="5" rx="2" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
            <rect x="24" y="33" width="3" height="18" rx="1" fill="#1a1a1a" />
            <rect x="33" y="33" width="3" height="18" rx="1" fill="#1a1a1a" />
            <path d="M50 55 Q60 30 100 26 L220 26 Q260 28 275 42 L285 55 L285 70 L50 70 Z" fill="#0f0f0f" stroke="#E10600" strokeWidth="1" />
            <path d="M145 26 Q155 14 175 14 Q195 14 205 26 Z" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
            <path d="M150 24 Q162 16 178 16 Q194 16 200 24 Z" fill="#001a2a" opacity="0.8" />
            <rect x="80" y="26" width="100" height="4" fill="#E10600" />
            <rect x="80" y="66" width="100" height="3" fill="#E10600" />
            <rect x="240" y="40" width="30" height="18" rx="2" fill="#E10600" />
            <path d="M270 58 L295 56 L298 62 L270 64 Z" fill="#0f0f0f" stroke="#333" strokeWidth="0.5" />
            <path d="M273 58 L296 57" stroke="#E10600" strokeWidth="1.5" fill="none" />
            <circle cx="80" cy="72" r="16" fill="#111" stroke="#333" strokeWidth="1" />
            <circle cx="80" cy="72" r="10" fill="#0a0a0a" />
            <circle cx="80" cy="72" r="4" fill="#E10600" />
            <circle cx="240" cy="72" r="14" fill="#111" stroke="#333" strokeWidth="1" />
            <circle cx="240" cy="72" r="8" fill="#0a0a0a" />
            <circle cx="240" cy="72" r="3.5" fill="#E10600" />
            <path d="M50 70 L290 70 L290 74 Q270 76 240 76 L80 76 Q60 76 50 74 Z" fill="#080808" stroke="#1a1a1a" strokeWidth="0.5" />
            <ellipse cx="50" cy="55" rx="5" ry="8" fill="#E10600" opacity="0.2" />
          </svg>
        </motion.div>
      </div>

      {/* Lights-out style indicator */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
        <div style={{position:"relative",width:220,height:4,background:"#111",borderRadius:2}}>
          {[24,68,112,156,200].map((x,i)=>(
            <div key={i} style={{position:"absolute",left:x,top:4,width:1,height:12,background:"#1e1e1e"}} />
          ))}
        </div>
        <div style={{display:"flex",gap:10,marginTop:-4}}>
          {Array.from({length:5},(_,i)=>(
            <motion.div key={i}
              animate={{
                background:["#180000","#E10600","#180000"],
                boxShadow:["none","0 0 16px 5px rgba(225,6,0,0.65)","none"],
              }}
              transition={{duration:0.55,delay:i*0.18,repeat:Infinity,ease:"easeInOut"}}
              style={{width:26,height:26,borderRadius:"50%",border:"2px solid #2a0000"}}
            />
          ))}
        </div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#444",
          letterSpacing:"0.22em",textTransform:"uppercase"}}>{label}</div>
      </div>
    </div>
  );
}

// ─── Race calendar strip ──────────────────────────────────────────────────────

function CalendarStrip({ races, selected, onSelect }: {
  races: Race[]; selected: Race|null; onSelect: (r:Race)=>void;
}) {
  const today = new Date();
  const nextRace = races.find(r=>new Date(r.date)>=today);
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if (!nextRace||!stripRef.current) return;
    const idx = races.findIndex(r=>r.round===nextRace.round);
    const el = stripRef.current.children[idx] as HTMLElement;
    el?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
  },[races]);

  return (
    <div ref={stripRef} style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:6,
      scrollbarWidth:"none",msOverflowStyle:"none"} as any}>
      {races.map(race=>{
        const past = new Date(race.date)<today;
        const isNext = race.round===nextRace?.round;
        const isSel = selected?.round===race.round;
        const flag = FLAGS[race.openf1Country]??FLAGS[race.jolpicaCountry]??"🏁";
        return (
          <motion.button key={race.round} onClick={()=>onSelect(race)}
            whileHover={{y:-3,scale:1.03}} whileTap={{scale:0.96}}
            style={{
              flexShrink:0,padding:"8px 10px",cursor:"pointer",
              background:isSel?"#E10600":isNext?"#120000":"#0f0f0f",
              border:`1px solid ${isSel?"#E10600":isNext?"#5a0000":"#1a1a1a"}`,
              borderRadius:6,textAlign:"center",minWidth:64,
              transition:"all 0.15s",
            }}>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:7,
              color:isSel?"rgba(255,255,255,0.6)":isNext?"#E10600":"#333",letterSpacing:1,marginBottom:3}}>
              R{race.round}
            </div>
            <div style={{fontSize:14,marginBottom:2}}>{flag}</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:10,fontWeight:700,
              color:isSel?"#fff":past?"#666":"#f0f0f0",letterSpacing:0.3,lineHeight:1.1}}>
              {race.shortName}
            </div>
            {race.isSprint&&(
              <div style={{fontSize:6,color:isSel?"rgba(255,255,255,0.7)":"#A855F7",
                fontFamily:"'Share Tech Mono',monospace",letterSpacing:0.3,marginTop:2}}>⚡SPR</div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [season, setSeason]         = useState(2026);
  const [races, setRaces]           = useState<Race[]>([]);
  const [drivers, setDrivers]       = useState<Driver[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race|null>(null);
  const [d1, setD1]                 = useState("");
  const [d2, setD2]                 = useState("");
  const [loadingMeta, setLoadingMeta]   = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [stats, setStats]           = useState<SessionStats|null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [chartKey, setChartKey]     = useState(0);

  const today = new Date();

  // Load schedule on season change
  useEffect(()=>{
    setLoadingMeta(true);
    setRaces([]); setDrivers([]); setSelectedRace(null);
    setShowCharts(false); setStats(null); setD1(""); setD2("");

    fetchSchedule(season).then(sched=>{
      setRaces(sched);
      const pastRaces = sched.filter(r=>new Date(r.date)<today);
      const auto = pastRaces.length ? pastRaces[pastRaces.length-1] : sched[0] ?? null;
      if (auto) setSelectedRace(auto);
    }).finally(()=>setLoadingMeta(false));
  },[season]);

  // Load drivers when race is selected (per-race drivers)
  useEffect(()=>{
    if (!selectedRace) return;
    setDrivers([]); setD1(""); setD2(""); setShowCharts(false);
    const isPast = new Date(selectedRace.date)<today;
    if (!isPast && season!==2026) return; // future non-2026: no data

    setLoadingDrivers(true);
    const load = season===2026
      ? fetch2026Drivers(selectedRace.round)
      : fetchDriversForRace(season, selectedRace.round);

    load.then(drs=>{
      setDrivers(drs);
      if (drs.length>=2){ setD1(drs[0].num); setD2(drs[1].num); }
      else if (drs.length===1) { setD1(drs[0].num); }
    }).finally(()=>setLoadingDrivers(false));
  },[selectedRace, season]);

  // Fetch session stats when past race selected
  useEffect(()=>{
    if (!selectedRace) return;
    const isPast = new Date(selectedRace.date)<today;
    setStats(null);
    if (!isPast) return;
    setStatsLoading(true);
    fetchSessionStats(season, selectedRace.openf1Country)
      .then(setStats).finally(()=>setStatsLoading(false));
  },[selectedRace, season]);

  const handleLoad = useCallback(()=>{
    if (!selectedRace||new Date(selectedRace.date)>=today) return;
    setShowCharts(false);
    setLoadingCharts(true);
    setChartKey(k=>k+1);
    setTimeout(()=>{ setLoadingCharts(false); setShowCharts(true); }, 3000);
  },[selectedRace]);

  const isFuture = selectedRace ? new Date(selectedRace.date)>=today : false;
  const nextRace = races.find(r=>new Date(r.date)>=today);
  const d1Data = drivers.find(d=>d.num===d1);
  const d2Data = drivers.find(d=>d.num===d2);
  const completedCount = races.filter(r=>new Date(r.date)<today).length;

  const selStyle:React.CSSProperties = {
    background:"#111",border:"1px solid #1e1e1e",color:"#f0f0f0",
    fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,
    padding:"8px 10px",borderRadius:5,cursor:"pointer",width:"100%",
  };
  const lblStyle:React.CSSProperties = {
    fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"#555",
    letterSpacing:1,textTransform:"uppercase",marginBottom:5,display:"block",
  };

  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"28px 24px 60px"}}>

      {/* Header */}
      <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:0.4}}>
        <div style={{display:"flex",alignItems:"baseline",gap:14,marginBottom:4,flexWrap:"wrap"}}>
          <h1 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:34,fontWeight:900,
            letterSpacing:2,textTransform:"uppercase"}}>
            Race <span style={{color:"#E10600"}}>Analysis</span>
          </h1>
          {!loadingMeta&&completedCount>0&&(
            <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#444",letterSpacing:2}}>
              {completedCount}/{races.length} RACES COMPLETE
            </span>
          )}
        </div>
        <div style={{height:2,background:"#E10600",width:56,marginBottom:24}} />
      </motion.div>

      {/* Season pills */}
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:20}}>
        {SEASONS.map(y=>(
          <button key={y} onClick={()=>setSeason(y)} style={{
            padding:"5px 13px",
            background:season===y?"#E10600":"#0f0f0f",
            border:`1px solid ${season===y?"#E10600":"#1a1a1a"}`,
            borderRadius:4,fontFamily:"'Barlow Condensed',sans-serif",
            fontSize:13,fontWeight:700,color:season===y?"#fff":"#444",
            cursor:"pointer",transition:"all 0.15s",
          }}>{y}</button>
        ))}
      </div>

      {/* Next race countdown banner */}
      {nextRace&&season===2026&&(
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
          style={{background:"#0f0f0f",border:"1px solid #1a1a1a",borderLeft:"3px solid #E10600",
            borderRadius:8,padding:"14px 20px",marginBottom:18,
            display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"#555",letterSpacing:2,marginBottom:3}}>
              NEXT RACE · R{nextRace.round}
            </div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,color:"#f0f0f0"}}>
              {FLAGS[nextRace.openf1Country]??""} {nextRace.name}
            </div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"#555",marginTop:2}}>
              {nextRace.circuit} · {new Date(nextRace.date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}
              {nextRace.isSprint&&<span style={{color:"#A855F7",marginLeft:8}}>⚡ SPRINT WEEKEND</span>}
            </div>
          </div>
          <Countdown date={nextRace.date} />
        </motion.div>
      )}

      {/* Calendar strip */}
      {!loadingMeta&&races.length>0&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.1,duration:0.4}}
          style={{marginBottom:18}}>
          <span style={lblStyle}>Select race</span>
          <CalendarStrip races={races} selected={selectedRace} onSelect={r=>{
            setSelectedRace(r); setShowCharts(false);
          }} />
        </motion.div>
      )}

      {/* Season loading */}
      {loadingMeta&&(
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 0"}}>
          {Array.from({length:5},(_,i)=>(
            <motion.div key={i}
              animate={{background:["#1a0000","#E10600","#1a0000"]}}
              transition={{duration:0.8,delay:i*0.15,repeat:Infinity}}
              style={{width:10,height:10,borderRadius:"50%",border:"1px solid #2a0000"}} />
          ))}
          <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#444",letterSpacing:2,marginLeft:4}}>
            LOADING SEASON
          </span>
        </div>
      )}

      {/* Race panel */}
      <AnimatePresence mode="wait">
        {selectedRace&&(
          <motion.div key={`${season}-${selectedRace.round}`}
            initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}}
            transition={{duration:0.25}}>

            {/* Race info card */}
            <div style={{background:"#0f0f0f",border:"1px solid #1a1a1a",borderRadius:8,padding:"18px 20px",marginBottom:14}}>
              {/* Title */}
              <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                <div style={{fontSize:30}}>{FLAGS[selectedRace.openf1Country]??FLAGS[selectedRace.jolpicaCountry]??"🏁"}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,
                    color:"#f0f0f0",letterSpacing:0.5,lineHeight:1}}>
                    {selectedRace.name}
                    {selectedRace.isSprint&&<span style={{fontSize:12,color:"#A855F7",marginLeft:10,
                      fontFamily:"'Share Tech Mono',monospace",letterSpacing:1}}>⚡ SPRINT</span>}
                  </div>
                  <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"#555",marginTop:4}}>
                    R{selectedRace.round} · {selectedRace.circuit} · {new Date(selectedRace.date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}
                  </div>
                </div>

                {/* Stats badges */}
                {statsLoading&&(
                  <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"#333",marginLeft:"auto"}}>
                    Fetching session data…
                  </div>
                )}
                {stats&&!statsLoading&&(
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginLeft:"auto"}}>
                    {[
                      {l:"Winner",v:stats.winner.split(" ").pop()??stats.winner,c:"f0f0f0"},
                      {l:"Fastest Lap",v:stats.fastestLap,c:"A855F7"},
                      {l:"Laps",v:stats.totalLaps?String(stats.totalLaps):"—",c:"888"},
                    ].map(s=>(
                      <div key={s.l} style={{background:"#111",border:"1px solid #1a1a1a",borderRadius:5,padding:"8px 12px",minWidth:80}}>
                        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:"#444",letterSpacing:1,marginBottom:3}}>{s.l.toUpperCase()}</div>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:`#${s.c}`}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Driver pickers */}
              <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
                {/* D1 */}
                <div style={{flex:"0 0 200px"}}>
                  <span style={lblStyle}>Driver 1</span>
                  {loadingDrivers
                    ? <div style={{height:36,background:"#111",borderRadius:5,border:"1px solid #1e1e1e",
                        display:"flex",alignItems:"center",paddingLeft:10}}>
                        <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"#333"}}>Loading drivers…</span>
                      </div>
                    : <select style={selStyle} value={d1} onChange={e=>setD1(e.target.value)}>
                        {drivers.map(d=>(
                          <option key={d.num} value={d.num}>#{d.num} {d.name}</option>
                        ))}
                      </select>
                  }
                  {d1Data&&<div style={{height:2,background:d1Data.teamColor,borderRadius:1,marginTop:3}} />}
                </div>

                {/* D2 */}
                <div style={{flex:"0 0 200px"}}>
                  <span style={lblStyle}>Driver 2</span>
                  {loadingDrivers
                    ? <div style={{height:36,background:"#111",borderRadius:5,border:"1px solid #1e1e1e",
                        display:"flex",alignItems:"center",paddingLeft:10}}>
                        <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"#333"}}>Loading drivers…</span>
                      </div>
                    : <select style={selStyle} value={d2} onChange={e=>setD2(e.target.value)}>
                        <option value="">None</option>
                        {drivers.filter(d=>d.num!==d1).map(d=>(
                          <option key={d.num} value={d.num}>#{d.num} {d.name}</option>
                        ))}
                      </select>
                  }
                  {d2Data&&<div style={{height:2,background:d2Data.teamColor,borderRadius:1,marginTop:3}} />}
                </div>

                {/* Load button */}
                <motion.button
                  whileHover={!isFuture?{scale:1.03}:{}}
                  whileTap={!isFuture?{scale:0.97}:{}}
                  onClick={handleLoad}
                  disabled={isFuture||loadingCharts||loadingDrivers}
                  style={{
                    padding:"9px 28px",
                    background:isFuture?"#0f0f0f":"#E10600",
                    border:`1px solid ${isFuture?"#1a1a1a":"#E10600"}`,
                    borderRadius:5,fontFamily:"'Barlow Condensed',sans-serif",
                    fontSize:14,fontWeight:700,letterSpacing:2,
                    color:isFuture?"#333":"#fff",
                    textTransform:"uppercase",
                    cursor:isFuture?"not-allowed":"pointer",
                    transition:"all 0.15s",
                  }}>
                  {isFuture?"Awaiting Race":loadingCharts?"Preparing…":"Load Race"}
                </motion.button>
              </div>
            </div>

            {/* Future race card */}
            {isFuture&&(
              <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                style={{background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:8,
                  padding:"40px 24px",textAlign:"center"}}>
                <div style={{fontSize:32,marginBottom:12}}>
                  {FLAGS[selectedRace.openf1Country]??FLAGS[selectedRace.jolpicaCountry]??"🏁"}
                </div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,
                  color:"#555",letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>
                  Race Incoming
                </div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,
                  color:"#f0f0f0",letterSpacing:1,marginBottom:4}}>
                  {selectedRace.name}
                </div>
                <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#444",
                  letterSpacing:1,marginBottom:20}}>
                  {selectedRace.circuit} · {new Date(selectedRace.date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}
                </div>
                <Countdown date={selectedRace.date} large />
              </motion.div>
            )}

            {/* F1 Car loader while charts fetch */}
            {loadingCharts&&<F1CarLoader label="Fetching Race Data" />}

            {/* Charts */}
            {showCharts&&!isFuture&&!loadingCharts&&(
              <motion.div key={chartKey}
                initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>

                {season < 2018 && (
                  <div style={{background:"#0f0f0f",border:"1px solid #2a2a2a",borderLeft:"3px solid #555",
                    borderRadius:6,padding:"10px 16px",marginBottom:16,
                    fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#555",letterSpacing:1}}>
                    ⚠ Lap timing data (OpenF1) is available from 2018 onwards. Tire strategy data may also be limited.
                  </div>
                )}
                <div style={{marginBottom:28}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,
                      letterSpacing:1.5,textTransform:"uppercase"}}>Lap Times</h2>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      {d1Data&&<span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,
                        color:d1Data.teamColor,letterSpacing:1}}>■ {d1Data.code}</span>}
                      {d2Data&&<span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,
                        color:d2Data.teamColor,letterSpacing:1}}>■ {d2Data.code}</span>}
                    </div>
                  </div>
                  <div style={{height:1,background:"#1a1a1a",marginBottom:12}} />
                  <div style={{background:"#0f0f0f",border:"1px solid #1a1a1a",borderRadius:8,padding:"16px 12px"}}>
                    <LapTimeChart
                      year={season}
                      country={selectedRace.openf1Country}
                      driverNumbers={[d1,d2].filter(Boolean)}
                    />
                  </div>
                </div>

                <div>
                  <h2 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,
                    letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Tire Strategy</h2>
                  <div style={{height:1,background:"#1a1a1a",marginBottom:12}} />
                  <div style={{background:"#0f0f0f",border:"1px solid #1a1a1a",borderRadius:8,padding:"16px 12px"}}>
                    <TireStrategyChart year={season} country={selectedRace.openf1Country} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Idle state */}
            {!showCharts&&!isFuture&&!loadingCharts&&(
              <div style={{textAlign:"center",padding:"40px 0",
                fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,
                letterSpacing:3,textTransform:"uppercase",color:"#2a2a2a"}}>
                Select drivers and hit Load Race
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
