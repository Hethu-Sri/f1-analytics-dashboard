import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────

const JOLPICA = "https://api.jolpi.ca/ergast/f1";

const TEAM_COLORS: Record<string, string> = {
  "McLaren":      "#FF8000",
  "Mercedes":     "#27F4D2",
  "Red Bull":     "#3671C6",
  "Ferrari":      "#E8002D",
  "Williams":     "#64C4FF",
  "Racing Bulls": "#6692FF",
  "RB":           "#6692FF",
  "AlphaTauri":   "#6692FF",
  "Aston Martin": "#229971",
  "Haas":         "#B6BABD",
  "Haas F1 Team": "#B6BABD",
  "Audi":         "#B0B0B0",
  "Alpine":       "#FF87BC",
  "Cadillac":     "#CC0000",
  "Alfa Romeo":   "#C92D4B",
  "Renault":      "#FFD700",
  "Racing Point": "#F596C8",
};

function getTeamColor(name: string): string {
  for (const [k, v] of Object.entries(TEAM_COLORS))
    if (name.toLowerCase().includes(k.toLowerCase())) return v;
  return "#555";
}

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

const GRID_2026 = [
  { num:"1",  name:"Lando Norris",     code:"NOR", flag:"🇬🇧", team:"McLaren",      nationality:"British"      },
  { num:"81", name:"Oscar Piastri",    code:"PIA", flag:"🇦🇺", team:"McLaren",      nationality:"Australian"   },
  { num:"63", name:"George Russell",   code:"RUS", flag:"🇬🇧", team:"Mercedes",     nationality:"British"      },
  { num:"12", name:"Kimi Antonelli",   code:"ANT", flag:"🇮🇹", team:"Mercedes",     nationality:"Italian"      },
  { num:"3",  name:"Max Verstappen",   code:"VER", flag:"🇳🇱", team:"Red Bull",     nationality:"Dutch"        },
  { num:"6",  name:"Isack Hadjar",     code:"HAD", flag:"🇫🇷", team:"Red Bull",     nationality:"French"       },
  { num:"16", name:"Charles Leclerc",  code:"LEC", flag:"🇲🇨", team:"Ferrari",      nationality:"Monégasque"   },
  { num:"44", name:"Lewis Hamilton",   code:"HAM", flag:"🇬🇧", team:"Ferrari",      nationality:"British"      },
  { num:"23", name:"Alexander Albon",  code:"ALB", flag:"🇹🇭", team:"Williams",     nationality:"Thai"         },
  { num:"55", name:"Carlos Sainz",     code:"SAI", flag:"🇪🇸", team:"Williams",     nationality:"Spanish"      },
  { num:"41", name:"Arvid Lindblad",   code:"LIN", flag:"🇬🇧", team:"Racing Bulls", nationality:"British"      },
  { num:"30", name:"Liam Lawson",      code:"LAW", flag:"🇳🇿", team:"Racing Bulls", nationality:"New Zealander" },
  { num:"14", name:"Fernando Alonso",  code:"ALO", flag:"🇪🇸", team:"Aston Martin", nationality:"Spanish"      },
  { num:"18", name:"Lance Stroll",     code:"STR", flag:"🇨🇦", team:"Aston Martin", nationality:"Canadian"     },
  { num:"87", name:"Oliver Bearman",   code:"BEA", flag:"🇬🇧", team:"Haas",         nationality:"British"      },
  { num:"31", name:"Esteban Ocon",     code:"OCO", flag:"🇫🇷", team:"Haas",         nationality:"French"       },
  { num:"27", name:"Nico Hülkenberg",  code:"HUL", flag:"🇩🇪", team:"Audi",         nationality:"German"       },
  { num:"5",  name:"Gabriel Bortoleto",code:"BOR", flag:"🇧🇷", team:"Audi",         nationality:"Brazilian"    },
  { num:"10", name:"Pierre Gasly",     code:"GAS", flag:"🇫🇷", team:"Alpine",       nationality:"French"       },
  { num:"43", name:"Franco Colapinto", code:"COL", flag:"🇦🇷", team:"Alpine",       nationality:"Argentine"    },
  { num:"11", name:"Sergio Pérez",     code:"PER", flag:"🇲🇽", team:"Cadillac",     nationality:"Mexican"      },
  { num:"77", name:"Valtteri Bottas",  code:"BOT", flag:"🇫🇮", team:"Cadillac",     nationality:"Finnish"      },
];

// ─── Wikipedia photos ─────────────────────────────────────────────────────────

const photoCache: Record<string, string> = {};
async function getPhoto(name: string): Promise<string> {
  if (photoCache[name]) return photoCache[name];
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/ /g,"_"))}`,
      { headers: { "Api-User-Agent": "F1Analytics/1.0" } }
    );
    if (!res.ok) return "";
    const data = await res.json();
    const url = (data.thumbnail?.source ?? "").replace(/\/\d+px-/, "/300px-");
    photoCache[name] = url;
    return url;
  } catch { return ""; }
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, v => Math.round(v).toString());
  useEffect(() => {
    const t = setTimeout(() => spring.set(value), delay * 1000);
    return () => clearTimeout(t);
  }, [value, delay]);
  return <motion.span>{display}</motion.span>;
}

// ─── Driver avatar ────────────────────────────────────────────────────────────

function Avatar({ name, team, size = 44 }: { name: string; team: string; size?: number }) {
  const [photo, setPhoto] = useState(photoCache[name] ?? "");
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);
  const color = getTeamColor(team);
  const initials = name.split(" ").map(n => n[0]).join("").slice(0,2);

  useEffect(() => {
    mounted.current = true;
    if (!photo) getPhoto(name).then(u => { if (mounted.current && u) setPhoto(u); });
    return () => { mounted.current = false; };
  }, [name]);

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
      background: `${color}18`, border: `1.5px solid ${color}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {photo && !failed
        ? <img src={photo} alt={name} onError={() => setFailed(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top center" }} />
        : <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize: size*0.3,
            fontWeight:900, color }}>{initials}</span>
      }
    </div>
  );
}

// ─── Loading animation — 5 pulsing lights ────────────────────────────────────

function F1Loader({ label }: { label: string }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, padding:"60px 0" }}>
      <div style={{ position:"relative", width:300, height:6, background:"#111", borderRadius:3 }}>
        {[28,76,124,172,220].map((x,i) => (
          <div key={i} style={{ position:"absolute", left:x, top:6, width:1, height:16, background:"#222" }} />
        ))}
      </div>
      <div style={{ display:"flex", gap:12, marginTop:-8 }}>
        {Array.from({length:5}, (_,i) => (
          <motion.div key={i}
            animate={{ background:["#1a0000","#E10600","#1a0000"],
              boxShadow:["none","0 0 18px 6px rgba(225,6,0,0.6)","none"] }}
            transition={{ duration:1, delay:i*0.18, repeat:Infinity, ease:"easeInOut" }}
            style={{ width:28, height:28, borderRadius:"50%", border:"2px solid #2a0000" }}
          />
        ))}
      </div>
      <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444",
        letterSpacing:"0.25em", textTransform:"uppercase" }}>{label}</div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DriverStanding {
  pos: number; driverId: string; code: string; name: string;
  nationality: string; team: string; points: number; wins: number; num: string; flag?: string;
}
interface TeamStanding { pos:number; name:string; points:number; wins:number; }
interface RaceResult {
  round: string; raceName: string; date: string; circuit: string; country: string;
  results: { pos:string; name:string; team:string; time:string; pts:string; fastest:boolean }[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function loadDrivers(year: number): Promise<DriverStanding[]> {
  const res = await fetch(`${JOLPICA}/${year}/driverStandings.json`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? []).map((s: any) => ({
    pos: +s.position, driverId: s.Driver.driverId,
    code: s.Driver.code ?? s.Driver.familyName.slice(0,3).toUpperCase(),
    name: `${s.Driver.givenName} ${s.Driver.familyName}`,
    nationality: s.Driver.nationality,
    team: s.Constructors?.[0]?.name ?? "—",
    points: parseFloat(s.points), wins: +s.wins,
    num: s.Driver.permanentNumber ?? "?",
  }));
}

async function loadTeams(year: number): Promise<TeamStanding[]> {
  const res = await fetch(`${JOLPICA}/${year}/constructorStandings.json`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? []).map((s: any) => ({
    pos: +s.position, name: s.Constructor.name, points: parseFloat(s.points), wins: +s.wins,
  }));
}

async function loadRaces(year: number): Promise<RaceResult[]> {
  let offset = 0; const limit = 100; const all: Record<string, any> = {};
  while (true) {
    const res = await fetch(`${JOLPICA}/${year}/results.json?limit=${limit}&offset=${offset}`);
    if (!res.ok) break;
    const data = await res.json();
    const total = parseInt(data?.MRData?.total ?? "0", 10);
    const races: any[] = data?.MRData?.RaceTable?.Races ?? [];
    races.forEach((r: any) => {
      if (!all[r.round]) all[r.round] = r;
      else all[r.round].Results = [...(all[r.round].Results??[]), ...(r.Results??[])];
    });
    offset += limit;
    if (offset >= total || !races.length) break;
  }
  return Object.values(all)
    .filter((r:any) => Array.isArray(r.Results) && r.Results.length)
    .sort((a:any,b:any) => +a.round - +b.round)
    .map((r: any) => ({
      round: r.round, raceName: r.raceName,
      date: r.date, circuit: r.Circuit?.circuitName ?? "",
      country: r.Circuit?.Location?.country ?? "",
      results: (r.Results ?? []).map((res: any) => ({
        pos: res.position, name: `${res.Driver?.givenName} ${res.Driver?.familyName}`,
        team: res.Constructor?.name ?? "—",
        time: res.Time?.time ?? res.status ?? "—",
        pts: res.points,
        fastest: res.FastestLap?.rank === "1",
      })),
    }));
}

// ─── Races tab ────────────────────────────────────────────────────────────────

const MEDAL: Record<string, string> = { "1":"🥇","2":"🥈","3":"🥉" };

function RacesTab({ year }: { year: number }) {
  const [races, setRaces] = useState<RaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string|null>(null);

  useEffect(() => {
    setRaces([]); setLoading(true); setExpanded(null);
    loadRaces(year).then(r => {
      setRaces(r);
      if (r.length) setExpanded(r[r.length-1].round);
    }).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <F1Loader label="Loading race results" />;
  if (!races.length) return (
    <div style={{ textAlign:"center", padding:"60px 0" }}>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:700,
        color:"#2a2a2a", letterSpacing:3, textTransform:"uppercase" }}>No results yet this season</div>
    </div>
  );

  const winners = new Set(races.map(r => r.results[0]?.name));

  return (
    <div>
      {/* Season summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:8, marginBottom:24 }}>
        {[{label:"Races",val:races.length},{label:"Different winners",val:winners.size},{label:"Latest",val:races[races.length-1]?.raceName.replace(" Grand Prix","") ?? "—"}].map(s=>(
          <div key={s.label} style={{ background:"#0f0f0f", border:"1px solid #1a1a1a", borderRadius:6, padding:"12px 16px" }}>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#444", letterSpacing:1, marginBottom:4 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:typeof s.val==="string"?14:26, fontWeight:900, color:"#f0f0f0", lineHeight:1.2 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Race list */}
      {races.map((race, idx) => {
        const isOpen = expanded === race.round;
        const winner = race.results[0];
        const winnerColor = winner ? getTeamColor(winner.team) : "#333";
        const dt = new Date(race.date);
        return (
          <motion.div key={race.round}
            initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
            transition={{delay:idx*0.02, duration:0.25}} style={{marginBottom:5}}>
            {/* Header */}
            <motion.button
              onClick={() => setExpanded(isOpen ? null : race.round)}
              whileHover={{ background:"#161616" }}
              style={{
                width:"100%", textAlign:"left", cursor:"pointer",
                background: isOpen ? "#141414" : "#0f0f0f",
                border:"1px solid #1a1a1a",
                borderLeft:`3px solid ${isOpen ? winnerColor : "#1a1a1a"}`,
                borderRadius: isOpen ? "8px 8px 0 0" : 8,
                padding:"12px 18px",
                display:"grid",
                gridTemplateColumns:"44px 1fr auto 120px 80px",
                gap:12, alignItems:"center",
                transition:"border-color 0.2s, background 0.2s",
              }}
            >
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444" }}>R{race.round}</span>
              <div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:700,
                  color:"#f0f0f0", letterSpacing:0.5 }}>{race.raceName}</div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#555", marginTop:2 }}>
                  {race.circuit} · {race.country}
                </div>
              </div>
              {winner && (
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <Avatar name={winner.name} team={winner.team} size={28} />
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, color:"#888" }}>
                    {winner.name.split(" ").pop()}
                  </span>
                </div>
              )}
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#555", textAlign:"right" }}>
                {dt.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
              </div>
              <div style={{ textAlign:"right", fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#444" }}>
                {isOpen ? "▲ CLOSE" : "▼ RESULTS"}
              </div>
            </motion.button>

            {/* Expanded results */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
                  exit={{height:0,opacity:0}} transition={{duration:0.3, ease:[0.16,1,0.3,1]}}
                  style={{overflow:"hidden"}}
                >
                  <div style={{ background:"#0a0a0a", border:"1px solid #1a1a1a", borderTop:"none",
                    borderRadius:"0 0 8px 8px", overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse",
                      fontFamily:"'Share Tech Mono',monospace", fontSize:11 }}>
                      <thead>
                        <tr style={{ borderBottom:"1px solid #1a1a1a" }}>
                          {["","Driver","Constructor","Time / Status","Pts"].map((h,i)=>(
                            <th key={i} style={{ textAlign:i>=3?"right":"left", padding:"9px 16px",
                              color:"#333", fontWeight:600, fontSize:9, letterSpacing:1, textTransform:"uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {race.results.map((r,i)=>(
                          <motion.tr key={i}
                            initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}}
                            transition={{delay:i*0.015, duration:0.2}}
                            style={{ borderBottom:"1px solid #111",
                              background: i%2===0?"transparent":"#080808" }}
                          >
                            <td style={{ padding:"9px 16px", color:r.pos==="1"?"#E10600":"#444",
                              fontWeight:700, fontSize:14, minWidth:40 }}>
                              {MEDAL[r.pos] ?? r.pos}
                            </td>
                            <td style={{ padding:"9px 16px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <Avatar name={r.name} team={r.team} size={26} />
                                <span style={{ color:"#f0f0f0", fontWeight:600 }}>{r.name}</span>
                                {r.fastest && <span title="Fastest lap" style={{ fontSize:9, color:"#A855F7",
                                  background:"#A855F711", border:"1px solid #A855F755",
                                  borderRadius:3, padding:"1px 5px", letterSpacing:1 }}>⚡FL</span>}
                              </div>
                            </td>
                            <td style={{ padding:"9px 16px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <div style={{ width:3, height:14, borderRadius:1,
                                  background:getTeamColor(r.team), flexShrink:0 }} />
                                <span style={{ color:"#666" }}>{r.team}</span>
                              </div>
                            </td>
                            <td style={{ padding:"9px 16px", textAlign:"right", color:"#555" }}>{r.time}</td>
                            <td style={{ padding:"9px 16px", textAlign:"right", color:parseFloat(r.pts)>0?"#f0f0f0":"#2a2a2a", fontWeight:700 }}>{r.pts}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Drivers tab ──────────────────────────────────────────────────────────────

function DriversTab({ year, grid }: { year: number; grid: typeof GRID_2026 }) {
  const [standings, setStandings] = useState<DriverStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number|null>(null);

  useEffect(() => {
    setStandings([]); setLoading(true);
    loadDrivers(year).then(setStandings).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <F1Loader label="Loading driver standings" />;

  const displayList = standings.length ? standings : (year===2026 ? grid.map((d,i)=>({
    pos:i+1, driverId:d.code.toLowerCase(), code:d.code, name:d.name,
    nationality:d.nationality, team:d.team, points:0, wins:0, num:d.num, flag:d.flag,
  })) : []);

  if (!displayList.length) return (
    <div style={{ textAlign:"center", padding:"60px 0", fontFamily:"'Barlow Condensed',sans-serif",
      fontSize:20, color:"#2a2a2a", letterSpacing:3 }}>No standings data available</div>
  );

  const maxPts = Math.max(...displayList.map(d=>d.points), 1);
  const leader = displayList[0];

  return (
    <div>
      {/* Leader hero card */}
      {standings.length > 0 && (
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
          style={{ background:"#0f0f0f", border:`1px solid ${getTeamColor(leader.team)}44`,
            borderLeft:`4px solid ${getTeamColor(leader.team)}`,
            borderRadius:8, padding:"18px 24px", marginBottom:20,
            display:"grid", gridTemplateColumns:"auto 1fr auto", gap:20, alignItems:"center" }}>
          <Avatar name={leader.name} team={leader.team} size={64} />
          <div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#555",
              letterSpacing:2, marginBottom:4 }}>CHAMPIONSHIP LEADER</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:28, fontWeight:900,
              color:"#f0f0f0", letterSpacing:1 }}>{leader.name}</div>
            <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:12, color:"#666", marginTop:2 }}>
              <span style={{ color:getTeamColor(leader.team) }}>●</span> {leader.team}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#555", letterSpacing:2, marginBottom:4 }}>POINTS</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:52, fontWeight:900,
              color:"#E10600", lineHeight:1 }}>
              <AnimatedNumber value={leader.points} delay={0.3} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div style={{ display:"grid", gridTemplateColumns:"44px 44px 56px 1fr 140px 100px 44px 60px",
        gap:8, padding:"8px 16px", marginBottom:4 }}>
        {["POS","#","","DRIVER","NATIONALITY","TEAM","W","PTS"].map((h,i)=>(
          <div key={i} style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9,
            color:"#333", letterSpacing:1, textTransform:"uppercase",
            textAlign:i>=6?"right":"left" }}>{h}</div>
        ))}
      </div>

      {displayList.map((d, i) => {
        const color = getTeamColor(d.team);
        const gridEntry = grid.find(g=>g.code===d.code||g.name===d.name);
        const flag = gridEntry?.flag ?? d.flag ?? "🏁";
        const gap = leader.points - d.points;
        const isHovered = hoveredIdx === i;

        return (
          <motion.div key={d.driverId}
            initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}}
            transition={{delay:i*0.03, duration:0.3}}
            onMouseEnter={()=>setHoveredIdx(i)} onMouseLeave={()=>setHoveredIdx(null)}
            style={{
              display:"grid", gridTemplateColumns:"44px 44px 56px 1fr 140px 100px 44px 60px",
              gap:8, alignItems:"center", padding:"10px 16px",
              background: isHovered ? "#141414" : "transparent",
              borderBottom:"1px solid #0f0f0f",
              borderLeft:`3px solid ${isHovered ? color : "transparent"}`,
              transition:"background 0.15s, border-color 0.15s",
              cursor:"default", position:"relative",
            }}
          >
            {/* Pos */}
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:900,
              color:d.pos<=3?"#E10600":"#2a2a2a" }}>{d.pos}</div>

            {/* Num */}
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color }}>
              #{d.num}
            </div>

            {/* Avatar */}
            <Avatar name={d.name} team={d.team} size={42} />

            {/* Name + bar */}
            <div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:700,
                color:"#f0f0f0", letterSpacing:0.3, marginBottom:4 }}>{d.name}</div>
              <div style={{ position:"relative", height:2, background:"#111", borderRadius:1, width:"100%" }}>
                <motion.div
                  initial={{width:0}}
                  animate={{width:`${(d.points/maxPts)*100}%`}}
                  transition={{duration:0.8, ease:[0.16,1,0.3,1], delay:i*0.025+0.2}}
                  style={{ position:"absolute", height:"100%", background:color, borderRadius:1 }}
                />
              </div>
              {d.pos > 1 && d.points > 0 && (
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:"#333", marginTop:2 }}>
                  -{gap} PTS
                </div>
              )}
            </div>

            {/* Nationality */}
            <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:12, color:"#555" }}>
              {flag} {d.nationality}
            </div>

            {/* Team */}
            <div style={{ display:"flex", alignItems:"center", gap:5, overflow:"hidden" }}>
              <div style={{ width:3, height:14, borderRadius:1, background:color, flexShrink:0 }} />
              <span style={{ fontFamily:"'Barlow',sans-serif", fontSize:12, color:"#666",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.team}</span>
            </div>

            {/* Wins */}
            <div style={{ textAlign:"right", fontFamily:"'Barlow Condensed',sans-serif",
              fontSize:17, fontWeight:700, color:d.wins>0?"#f0f0f0":"#2a2a2a" }}>
              {d.wins}
            </div>

            {/* Points */}
            <div style={{ textAlign:"right", fontFamily:"'Barlow Condensed',sans-serif",
              fontSize:20, fontWeight:900, color:d.pos<=3?"#E10600":"#f0f0f0" }}>
              {d.points}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Teams tab ────────────────────────────────────────────────────────────────

function TeamsTab({ year }: { year: number }) {
  const [teams, setTeams] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTeams([]); setLoading(true);
    loadTeams(year).then(setTeams).finally(() => setLoading(false));
  }, [year]);

  if (loading) return <F1Loader label="Loading constructor standings" />;
  if (!teams.length) return (
    <div style={{ textAlign:"center", padding:"60px 0", fontFamily:"'Barlow Condensed',sans-serif",
      fontSize:20, color:"#2a2a2a", letterSpacing:3 }}>No constructor standings yet</div>
  );

  const maxPts = Math.max(...teams.map(t=>t.points), 1);
  const leader = teams[0];

  return (
    <div>
      {/* Horizontal bar chart */}
      <div style={{ background:"#0f0f0f", border:"1px solid #1a1a1a", borderRadius:8,
        padding:"20px 24px", marginBottom:24 }}>
        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#444",
          letterSpacing:2, marginBottom:14 }}>POINTS DISTRIBUTION</div>
        {teams.map((t, i) => {
          const color = getTeamColor(t.name);
          const pct = (t.points / maxPts) * 100;
          return (
            <div key={t.name} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <div style={{ width:80, fontFamily:"'Barlow Condensed',sans-serif", fontSize:12,
                fontWeight:700, color:"#888", textAlign:"right", flexShrink:0,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {t.name.split(" ")[0]}
              </div>
              <div style={{ flex:1, height:8, background:"#111", borderRadius:4, overflow:"hidden" }}>
                <motion.div
                  initial={{width:0}}
                  animate={{width:`${pct}%`}}
                  transition={{duration:1, ease:[0.16,1,0.3,1], delay:i*0.06+0.1}}
                  style={{ height:"100%", background:color, borderRadius:4 }}
                />
              </div>
              <div style={{ width:44, fontFamily:"'Barlow Condensed',sans-serif", fontSize:14,
                fontWeight:700, color:"#f0f0f0", textAlign:"right", flexShrink:0 }}>
                {t.points}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table rows */}
      {teams.map((t, i) => {
        const color = getTeamColor(t.name);
        const gap = leader.points - t.points;
        return (
          <motion.div key={t.name}
            initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
            transition={{delay:i*0.05, duration:0.3}}
            style={{
              display:"grid", gridTemplateColumns:"48px 1fr 48px 80px",
              gap:16, alignItems:"center",
              background: i===0 ? "#0f0f0f" : "transparent",
              border: i===0 ? `1px solid ${color}33` : "none",
              borderLeft:`4px solid ${i<3?color:"#111"}`,
              borderRadius:i===0?8:0,
              padding:`${i===0?16:10}px 18px`,
              marginBottom:i===0?12:0,
              borderBottom:i>0?"1px solid #0f0f0f":"none",
            }}>
            {/* Pos */}
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:24, fontWeight:900,
              color:i<3?"#E10600":"#2a2a2a" }}>{t.pos}</div>

            {/* Team */}
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <div style={{ width:4, height:18, borderRadius:1, background:color }} />
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:i===0?20:16,
                  fontWeight:700, color:"#f0f0f0" }}>{t.name}</span>
              </div>
              {i>0 && t.points > 0 && (
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#333",
                  paddingLeft:12 }}>-{gap} PTS from leader</div>
              )}
            </div>

            {/* Wins */}
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:"#444",
                letterSpacing:1, marginBottom:2 }}>WINS</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:700,
                color:t.wins>0?"#f0f0f0":"#2a2a2a" }}>{t.wins}</div>
            </div>

            {/* Points */}
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:"#444",
                letterSpacing:1, marginBottom:2 }}>PTS</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:i===0?32:22,
                fontWeight:900, color:i<3?"#E10600":"#f0f0f0" }}>
                <AnimatedNumber value={t.points} delay={i*0.08+0.1} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = "races" | "drivers" | "teams";

export default function StandingsPage() {
  const [year, setYear] = useState(2026);
  const [tab, setTab] = useState<Tab>("drivers");

  const TABS: { key: Tab; label: string }[] = [
    { key:"races",   label:"Races"   },
    { key:"drivers", label:"Drivers" },
    { key:"teams",   label:"Teams"   },
  ];

  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 0 60px" }}>

      {/* Driver strip */}
      <div style={{ background:"#0d0d0d", borderBottom:"1px solid #161616", overflowX:"auto" }}>
        <div style={{ display:"flex", padding:"10px 24px", gap:4, minWidth:"max-content" }}>
          {GRID_2026.map((d, i) => (
            <motion.div key={d.num}
              initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}
              transition={{delay:i*0.025, duration:0.22}}
              title={`${d.num} ${d.name} · ${d.team}`}
              style={{ display:"flex", flexDirection:"column", alignItems:"center",
                gap:4, cursor:"default", minWidth:50, padding:"4px 2px" }}
            >
              <Avatar name={d.name} team={d.team} size={36} />
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:7,
                color:getTeamColor(d.team), letterSpacing:0.3, textAlign:"center", lineHeight:1.3 }}>
                <div>{d.num}</div>
                <div>{d.code}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div style={{ padding:"24px 24px 0" }}>

        {/* Header row */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          marginBottom:20, flexWrap:"wrap", gap:16 }}>
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.4}}>
            <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:34, fontWeight:900,
              letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>
              {year} <span style={{color:"#E10600"}}>Season</span>
            </h1>
            <div style={{ height:2, background:"#E10600", width:48, marginBottom:2 }} />
          </motion.div>

          {/* Year selector */}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.15,duration:0.4}}
            style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"flex-end" }}>
            {YEARS.map(y => (
              <button key={y} onClick={()=>setYear(y)} style={{
                padding:"4px 11px",
                background: year===y ? "#E10600" : "#0f0f0f",
                border:`1px solid ${year===y?"#E10600":"#1a1a1a"}`,
                borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif",
                fontSize:12, fontWeight:700, color:year===y?"#fff":"#444",
                cursor:"pointer", transition:"all 0.15s",
              }}>{y}</button>
            ))}
          </motion.div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid #1a1a1a", marginBottom:24, gap:0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)} style={{
              position:"relative", padding:"10px 28px",
              background:"none", border:"none", cursor:"pointer",
              fontFamily:"'Barlow Condensed',sans-serif", fontSize:14,
              fontWeight:700, letterSpacing:2, textTransform:"uppercase",
              color: tab===t.key?"#f0f0f0":"#444",
              transition:"color 0.2s", marginBottom:-1,
              borderBottom:`2px solid ${tab===t.key?"#E10600":"transparent"}`,
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={`${year}-${tab}`}
            initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}}
            transition={{duration:0.25}}>
            {tab==="races"   && <RacesTab year={year} />}
            {tab==="drivers" && <DriversTab year={year} grid={GRID_2026} />}
            {tab==="teams"   && <TeamsTab year={year} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
