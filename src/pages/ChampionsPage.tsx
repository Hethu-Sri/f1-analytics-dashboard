import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChampionEntry {
  year: number;
  team: string;
  wins: number;
  poles: number;
  points: number;
}

interface Driver {
  id: string;
  name: string;
  nationality: string;
  flag: string;
  born: number;
  died?: number;
  totalTitles: number;
  titleYears: number[];
  teamColor: string;
  wikiTitle: string;
  careerWins: number;
  careerPoles: number;
  careerRaces: number;
  bio: string;
  entries: ChampionEntry[];
}

// ─── Dataset ──────────────────────────────────────────────────────────────────

const DRIVERS: Driver[] = [
  { id:"norris",      name:"Lando Norris",        nationality:"British",      flag:"🇬🇧", born:1999,        totalTitles:1, titleYears:[2025],                          teamColor:"#FF8000", wikiTitle:"Lando_Norris",           careerWins:8,  careerPoles:10, careerRaces:143, bio:"McLaren's prodigy claimed his maiden championship in 2025, ending a long wait with a dramatic Abu Dhabi finale.", entries:[{year:2025,team:"McLaren",wins:8,poles:10,points:423}] },
  { id:"verstappen",  name:"Max Verstappen",       nationality:"Dutch",        flag:"🇳🇱", born:1997,        totalTitles:4, titleYears:[2021,2022,2023,2024],            teamColor:"#3671C6", wikiTitle:"Max_Verstappen",          careerWins:63, careerPoles:40, careerRaces:212, bio:"The Dutch maestro dominated F1 from 2021–2024, winning four consecutive titles and the single-season record of 19 wins in 2023.", entries:[{year:2021,team:"Red Bull Racing",wins:10,poles:10,points:395},{year:2022,team:"Red Bull Racing",wins:15,poles:8,points:454},{year:2023,team:"Red Bull Racing",wins:19,poles:12,points:575},{year:2024,team:"Red Bull Racing",wins:9,poles:9,points:437}] },
  { id:"hamilton",    name:"Lewis Hamilton",       nationality:"British",      flag:"🇬🇧", born:1985,        totalTitles:7, titleYears:[2008,2014,2015,2017,2018,2019,2020], teamColor:"#27F4D2", wikiTitle:"Lewis_Hamilton",          careerWins:104,careerPoles:104,careerRaces:353, bio:"Joint-record 7-time world champion. The most successful driver in F1 history by wins and poles, Hamilton redefined the sport across two decades.", entries:[{year:2008,team:"McLaren",wins:5,poles:7,points:98},{year:2014,team:"Mercedes",wins:11,poles:7,points:384},{year:2015,team:"Mercedes",wins:10,poles:11,points:381},{year:2017,team:"Mercedes",wins:9,poles:11,points:363},{year:2018,team:"Mercedes",wins:11,poles:11,points:408},{year:2019,team:"Mercedes",wins:11,poles:5,points:413},{year:2020,team:"Mercedes",wins:11,poles:10,points:347}] },
  { id:"rosberg",     name:"Nico Rosberg",         nationality:"German",       flag:"🇩🇪", born:1985,        totalTitles:1, titleYears:[2016],                          teamColor:"#27F4D2", wikiTitle:"Nico_Rosberg",            careerWins:23, careerPoles:30, careerRaces:206, bio:"Retired immediately after claiming his only title in 2016, beating teammate Hamilton by 5 points in a tense season-long battle.", entries:[{year:2016,team:"Mercedes",wins:9,poles:8,points:385}] },
  { id:"vettel",      name:"Sebastian Vettel",     nationality:"German",       flag:"🇩🇪", born:1987,        totalTitles:4, titleYears:[2010,2011,2012,2013],            teamColor:"#1E3D6E", wikiTitle:"Sebastian_Vettel",        careerWins:53, careerPoles:57, careerRaces:299, bio:"The youngest 4-time champion. Vettel's dominance at Red Bull from 2010–2013 included a record 9 consecutive wins at end of 2013.", entries:[{year:2010,team:"Red Bull Racing",wins:5,poles:10,points:256},{year:2011,team:"Red Bull Racing",wins:11,poles:15,points:392},{year:2012,team:"Red Bull Racing",wins:5,poles:5,points:281},{year:2013,team:"Red Bull Racing",wins:13,poles:11,points:397}] },
  { id:"button",      name:"Jenson Button",        nationality:"British",      flag:"🇬🇧", born:1980,        totalTitles:1, titleYears:[2009],                          teamColor:"#AABB00", wikiTitle:"Jenson_Button",           careerWins:15, careerPoles:8,  careerRaces:306, bio:"Won 6 of the first 7 races of 2009 with the revolutionary Brawn GP double-diffuser car, going on to take a comfortable title.", entries:[{year:2009,team:"Brawn GP",wins:6,poles:4,points:95}] },
  { id:"raikkonen",   name:"Kimi Räikkönen",       nationality:"Finnish",      flag:"🇫🇮", born:1979,        totalTitles:1, titleYears:[2007],                          teamColor:"#E8002D", wikiTitle:"Kimi_Räikkönen",          careerWins:21, careerPoles:18, careerRaces:349, bio:"The Iceman. Won the 2007 title by a single point in a dramatic finale. Known for his no-nonsense attitude and blistering speed.", entries:[{year:2007,team:"Ferrari",wins:6,poles:4,points:110}] },
  { id:"alonso",      name:"Fernando Alonso",      nationality:"Spanish",      flag:"🇪🇸", born:1981,        totalTitles:2, titleYears:[2005,2006],                     teamColor:"#FFD700", wikiTitle:"Fernando_Alonso",         careerWins:32, careerPoles:22, careerRaces:371, bio:"The youngest champion at the time in 2005. Alonso's fierce rivalry with Schumacher, then Hamilton, defined the mid-2000s.", entries:[{year:2005,team:"Renault",wins:7,poles:6,points:133},{year:2006,team:"Renault",wins:7,poles:6,points:134}] },
  { id:"schumacher",  name:"Michael Schumacher",   nationality:"German",       flag:"🇩🇪", born:1969,        totalTitles:7, titleYears:[1994,1995,2000,2001,2002,2003,2004], teamColor:"#E8002D", wikiTitle:"Michael_Schumacher",      careerWins:91, careerPoles:68, careerRaces:308, bio:"The first 7-time champion. Schumacher's five consecutive titles with Ferrari 2000–2004 remain one of sport's greatest dynasties.", entries:[{year:1994,team:"Benetton",wins:8,poles:8,points:92},{year:1995,team:"Benetton",wins:9,poles:8,points:102},{year:2000,team:"Ferrari",wins:9,poles:9,points:108},{year:2001,team:"Ferrari",wins:9,poles:11,points:123},{year:2002,team:"Ferrari",wins:11,poles:7,points:144},{year:2003,team:"Ferrari",wins:6,poles:5,points:93},{year:2004,team:"Ferrari",wins:13,poles:8,points:148}] },
  { id:"hakkinen",    name:"Mika Häkkinen",        nationality:"Finnish",      flag:"🇫🇮", born:1968,        totalTitles:2, titleYears:[1998,1999],                     teamColor:"#FF8000", wikiTitle:"Mika_Häkkinen",           careerWins:20, careerPoles:26, careerRaces:165, bio:"The Flying Finn. Back-to-back champion with McLaren in 1998–99, Häkkinen was Schumacher's most feared rival.", entries:[{year:1998,team:"McLaren",wins:8,poles:9,points:100},{year:1999,team:"McLaren",wins:5,poles:11,points:76}] },
  { id:"hill_d",      name:"Damon Hill",           nationality:"British",      flag:"🇬🇧", born:1960,        totalTitles:1, titleYears:[1996],                          teamColor:"#005AFF", wikiTitle:"Damon_Hill",              careerWins:22, careerPoles:20, careerRaces:122, bio:"Son of Graham Hill, Damon became champion in 1996 — one of only two father-son champion duos in F1 history.", entries:[{year:1996,team:"Williams",wins:8,poles:9,points:97}] },
  { id:"villeneuve",  name:"Jacques Villeneuve",   nationality:"Canadian",     flag:"🇨🇦", born:1971,        totalTitles:1, titleYears:[1997],                          teamColor:"#005AFF", wikiTitle:"Jacques_Villeneuve",      careerWins:11, careerPoles:13, careerRaces:163, bio:"Son of the legendary Gilles Villeneuve. Won the 1997 title after Schumacher controversially collided with him at the finale.", entries:[{year:1997,team:"Williams",wins:7,poles:10,points:81}] },
  { id:"hill_g",      name:"Graham Hill",          nationality:"British",      flag:"🇬🇧", born:1929, died:1975, totalTitles:2, titleYears:[1962,1968],               teamColor:"#005AFF", wikiTitle:"Graham_Hill",             careerWins:14, careerPoles:13, careerRaces:176, bio:"Mr. Monaco — won the Monaco Grand Prix five times. Father of 1996 champion Damon Hill.", entries:[{year:1962,team:"BRM",wins:4,poles:1,points:42},{year:1968,team:"Lotus",wins:3,poles:2,points:48}] },
  { id:"senna",       name:"Ayrton Senna",         nationality:"Brazilian",    flag:"🇧🇷", born:1960, died:1994, totalTitles:3, titleYears:[1988,1990,1991],           teamColor:"#FF8000", wikiTitle:"Ayrton_Senna",            careerWins:41, careerPoles:65, careerRaces:161, bio:"Widely regarded as the greatest F1 driver ever. Senna's brilliance in the wet and his 65 pole positions remain legendary.", entries:[{year:1988,team:"McLaren",wins:8,poles:13,points:90},{year:1990,team:"McLaren",wins:6,poles:10,points:78},{year:1991,team:"McLaren",wins:7,poles:8,points:96}] },
  { id:"prost",       name:"Alain Prost",          nationality:"French",       flag:"🇫🇷", born:1955,        totalTitles:4, titleYears:[1985,1986,1989,1993],           teamColor:"#E8002D", wikiTitle:"Alain_Prost",             careerWins:51, careerPoles:33, careerRaces:199, bio:"The Professor. Four championships across four teams. His clinical, calculated style formed the perfect foil to Senna's raw passion.", entries:[{year:1985,team:"McLaren",wins:5,poles:2,points:73},{year:1986,team:"McLaren",wins:4,poles:1,points:72},{year:1989,team:"McLaren",wins:4,poles:2,points:76},{year:1993,team:"Williams",wins:7,poles:13,points:99}] },
  { id:"piquet",      name:"Nelson Piquet",        nationality:"Brazilian",    flag:"🇧🇷", born:1952,        totalTitles:3, titleYears:[1981,1983,1987],                teamColor:"#336699", wikiTitle:"Nelson_Piquet",           careerWins:23, careerPoles:24, careerRaces:204, bio:"Three championships over 8 years. Piquet was a tactical genius who carefully chose his battles across a brilliant career.", entries:[{year:1981,team:"Brabham",wins:3,poles:4,points:50},{year:1983,team:"Brabham",wins:3,poles:4,points:59},{year:1987,team:"Williams",wins:3,poles:4,points:73}] },
  { id:"lauda",       name:"Niki Lauda",           nationality:"Austrian",     flag:"🇦🇹", born:1949, died:2019, totalTitles:2, titleYears:[1975,1977],               teamColor:"#E8002D", wikiTitle:"Niki_Lauda",              careerWins:25, careerPoles:24, careerRaces:171, bio:"Survived a horrific fireball crash at the 1976 Nürburgring, returning just 6 weeks later. His story is an unmatched act of courage.", entries:[{year:1975,team:"Ferrari",wins:5,poles:9,points:64},{year:1977,team:"Ferrari",wins:3,poles:2,points:72},{year:1984,team:"McLaren",wins:5,poles:0,points:72}] },
  { id:"scheckter",   name:"Jody Scheckter",       nationality:"South African",flag:"🇿🇦", born:1950,        totalTitles:1, titleYears:[1979],                          teamColor:"#E8002D", wikiTitle:"Jody_Scheckter",          careerWins:10, careerPoles:3,  careerRaces:112, bio:"Won the 1979 title with Ferrari in what would be their last constructors' championship for decades.", entries:[{year:1979,team:"Ferrari",wins:3,poles:1,points:51}] },
  { id:"andretti",    name:"Mario Andretti",       nationality:"American",     flag:"🇺🇸", born:1940,        totalTitles:1, titleYears:[1978],                          teamColor:"#000000", wikiTitle:"Mario_Andretti",          careerWins:12, careerPoles:18, careerRaces:128, bio:"The only American world champion since Phil Hill. Also won the Indianapolis 500, Daytona 500, and multiple other major titles.", entries:[{year:1978,team:"Lotus",wins:6,poles:8,points:64}] },
  { id:"hunt",        name:"James Hunt",           nationality:"British",      flag:"🇬🇧", born:1947, died:1993, totalTitles:1, titleYears:[1976],                   teamColor:"#FF8000", wikiTitle:"James_Hunt",              careerWins:10, careerPoles:14, careerRaces:92,  bio:"The playboy champion. His 1976 title battle with Lauda — dramatised in the film Rush — is one of sport's greatest stories.", entries:[{year:1976,team:"McLaren",wins:6,poles:8,points:69}] },
  { id:"fittipaldi",  name:"Emerson Fittipaldi",   nationality:"Brazilian",    flag:"🇧🇷", born:1946,        totalTitles:2, titleYears:[1972,1974],                     teamColor:"#FF8000", wikiTitle:"Emerson_Fittipaldi",      careerWins:14, careerPoles:6,  careerRaces:144, bio:"Brazil's first world champion. Fittipaldi paved the way for Piquet and Senna in a golden era for Brazilian racing.", entries:[{year:1972,team:"Lotus",wins:5,poles:3,points:61},{year:1974,team:"McLaren",wins:3,poles:2,points:55}] },
  { id:"stewart",     name:"Jackie Stewart",       nationality:"British",      flag:"🇬🇧", born:1939,        totalTitles:3, titleYears:[1969,1971,1973],                teamColor:"#336699", wikiTitle:"Jackie_Stewart",          careerWins:27, careerPoles:17, careerRaces:99,  bio:"The Flying Scot. A fierce campaigner for driver safety who transformed F1 from a death sport into something sustainable.", entries:[{year:1969,team:"Matra",wins:6,poles:2,points:63},{year:1971,team:"Tyrrell",wins:6,poles:5,points:62},{year:1973,team:"Tyrrell",wins:5,poles:3,points:71}] },
  { id:"rindt",       name:"Jochen Rindt",         nationality:"Austrian",     flag:"🇦🇹", born:1942, died:1970, totalTitles:1, titleYears:[1970],                   teamColor:"#000000", wikiTitle:"Jochen_Rindt",            careerWins:6,  careerPoles:10, careerRaces:60,  bio:"The only posthumous world champion — he died at Monza before the season ended, with his points total unbeatable.", entries:[{year:1970,team:"Lotus",wins:5,poles:10,points:45}] },
  { id:"hulme",       name:"Denny Hulme",          nationality:"New Zealander",flag:"🇳🇿", born:1936, died:1992, totalTitles:1, titleYears:[1967],                   teamColor:"#006600", wikiTitle:"Denny_Hulme",             careerWins:8,  careerPoles:1,  careerRaces:112, bio:"The Bear. Unassuming New Zealander who beat his boss Jack Brabham to the 1967 title.", entries:[{year:1967,team:"Brabham",wins:2,poles:0,points:51}] },
  { id:"brabham",     name:"Jack Brabham",         nationality:"Australian",   flag:"🇦🇺", born:1926, died:2014, totalTitles:3, titleYears:[1959,1960,1966],         teamColor:"#006600", wikiTitle:"Jack_Brabham",            careerWins:14, careerPoles:13, careerRaces:126, bio:"The only driver to win a world championship in a car of his own construction, claiming his third title with Brabham in 1966.", entries:[{year:1959,team:"Cooper",wins:2,poles:1,points:31},{year:1960,team:"Cooper",wins:5,poles:3,points:43},{year:1966,team:"Brabham",wins:4,poles:3,points:42}] },
  { id:"clark",       name:"Jim Clark",            nationality:"British",      flag:"🇬🇧", born:1936, died:1968, totalTitles:2, titleYears:[1963,1965],              teamColor:"#000000", wikiTitle:"Jim_Clark",               careerWins:25, careerPoles:33, careerRaces:72,  bio:"Considered by many contemporaries to be the greatest driver of any era. Clark's talent was otherworldly — he made the impossible look easy.", entries:[{year:1963,team:"Lotus",wins:7,poles:7,points:54},{year:1965,team:"Lotus",wins:6,poles:6,points:54}] },
  { id:"surtees",     name:"John Surtees",         nationality:"British",      flag:"🇬🇧", born:1934, died:2017, totalTitles:1, titleYears:[1964],                   teamColor:"#E8002D", wikiTitle:"John_Surtees",            careerWins:6,  careerPoles:8,  careerRaces:111, bio:"The only person to win world championships on both motorcycles and Formula 1.", entries:[{year:1964,team:"Ferrari",wins:2,poles:2,points:40}] },
  { id:"hill_p",      name:"Phil Hill",            nationality:"American",     flag:"🇺🇸", born:1927, died:2008, totalTitles:1, titleYears:[1961],                   teamColor:"#E8002D", wikiTitle:"Phil_Hill",               careerWins:3,  careerPoles:6,  careerRaces:48,  bio:"America's first F1 world champion, winning with Ferrari in 1961 on the same day his teammate Wolfgang von Trips died in a crash.", entries:[{year:1961,team:"Ferrari",wins:2,poles:5,points:34}] },
  { id:"hawthorn",    name:"Mike Hawthorn",        nationality:"British",      flag:"🇬🇧", born:1929, died:1959, totalTitles:1, titleYears:[1958],                   teamColor:"#E8002D", wikiTitle:"Mike_Hawthorn",           careerWins:3,  careerPoles:4,  careerRaces:45,  bio:"Britain's first world champion. Won the 1958 title by just one point from Stirling Moss, then retired — dying in a road accident weeks later.", entries:[{year:1958,team:"Ferrari",wins:1,poles:4,points:42}] },
  { id:"fangio",      name:"Juan Manuel Fangio",   nationality:"Argentine",    flag:"🇦🇷", born:1911, died:1995, totalTitles:5, titleYears:[1951,1954,1955,1956,1957], teamColor:"#999999", wikiTitle:"Juan_Manuel_Fangio",      careerWins:24, careerPoles:29, careerRaces:51,  bio:"The original GOAT. Five championships across four different constructors. His 46% win rate remains the highest in F1 history.", entries:[{year:1951,team:"Alfa Romeo",wins:3,poles:4,points:31},{year:1954,team:"Maserati/Mercedes",wins:6,poles:5,points:42},{year:1955,team:"Mercedes",wins:4,poles:3,points:40},{year:1956,team:"Ferrari",wins:3,poles:5,points:30},{year:1957,team:"Maserati",wins:4,poles:4,points:40}] },
  { id:"ascari",      name:"Alberto Ascari",       nationality:"Italian",      flag:"🇮🇹", born:1918, died:1955, totalTitles:2, titleYears:[1952,1953],              teamColor:"#E8002D", wikiTitle:"Alberto_Ascari",          careerWins:13, careerPoles:14, careerRaces:32,  bio:"Back-to-back champion with Ferrari. His 9-race winning streak in 1952–53 stood as a record for over 50 years.", entries:[{year:1952,team:"Ferrari",wins:6,poles:5,points:36},{year:1953,team:"Ferrari",wins:5,poles:6,points:34}] },
  { id:"farina",      name:"Nino Farina",          nationality:"Italian",      flag:"🇮🇹", born:1906, died:1966, totalTitles:1, titleYears:[1950],                   teamColor:"#999999", wikiTitle:"Nino_Farina",             careerWins:5,  careerPoles:5,  careerRaces:33,  bio:"The very first Formula 1 World Champion, winning the inaugural 1950 championship with Alfa Romeo.", entries:[{year:1950,team:"Alfa Romeo",wins:3,poles:2,points:30}] },
];

type SortKey = "year" | "name" | "titles";

// ─── Photo cache via Wikipedia REST API ──────────────────────────────────────

const photoCache: Record<string, string> = {};

async function fetchWikiPhoto(wikiTitle: string): Promise<string> {
  if (photoCache[wikiTitle]) return photoCache[wikiTitle];
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
    const res = await fetch(url, { headers: { "Api-User-Agent": "F1Analytics/1.0" } });
    if (!res.ok) return "";
    const data = await res.json();
    const thumb = data.thumbnail?.source ?? data.originalimage?.source ?? "";
    // Upsize the thumbnail for better quality
    const larger = thumb.replace(/\/\d+px-/, "/400px-");
    photoCache[wikiTitle] = larger;
    return larger;
  } catch {
    return "";
  }
}

// ─── Driver Card ──────────────────────────────────────────────────────────────

function DriverCard({ d, index, onClick }: { d: Driver; index: number; onClick: () => void }) {
  const [photo, setPhoto] = useState<string>("");
  const [imgFailed, setImgFailed] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    // Stagger fetches to avoid rate limiting Wikipedia
    const timer = setTimeout(async () => {
      const url = await fetchWikiPhoto(d.wikiTitle);
      if (mounted.current && url) setPhoto(url);
    }, index * 80);
    return () => { mounted.current = false; clearTimeout(timer); };
  }, [d.wikiTitle, index]);

  const initials = d.name.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      onClick={onClick}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={{
        background: "#0f0f0f",
        border: "1px solid #1a1a1a",
        borderRadius: 10,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
      }}
    >
      {/* Team color bar */}
      <div style={{ height: 3, background: d.teamColor }} />

      {/* Photo area */}
      <div style={{ height: 160, overflow: "hidden", background: "#111", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {photo && !imgFailed ? (
          <img
            src={photo}
            alt={d.name}
            onError={() => setImgFailed(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }}
          />
        ) : (
          // Initials avatar while loading or on error
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: `${d.teamColor}22`,
            border: `2px solid ${d.teamColor}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 26, fontWeight: 900,
            color: d.teamColor,
            letterSpacing: 1,
          }}>
            {initials}
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0f0f0f 0%, transparent 55%)" }} />

        {/* Title count badge */}
        <div style={{
          position: "absolute", top: 8, right: 8,
          background: "#E10600",
          borderRadius: 4, padding: "2px 8px",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 12, fontWeight: 700, color: "#fff",
        }}>{d.totalTitles}×</div>

        {/* Deceased marker */}
        {d.died && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 9, color: "#555", letterSpacing: 1,
          }}>{d.born}–{d.died}</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px 14px" }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, color: "#f0f0f0", lineHeight: 1.2, marginBottom: 3 }}>
          {d.flag} {d.name}
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#555", letterSpacing: 1, marginBottom: 8 }}>
          {d.titleYears.join(" · ")}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: "#444" }}>W</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: "#888" }}>{d.careerWins}</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: "#444" }}>P</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: "#888" }}>{d.careerPoles}</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: "#444" }}>GPs</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: "#888" }}>{d.careerRaces}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ChampionModal({ driver: d, onClose }: { driver: Driver; onClose: () => void }) {
  const [photo, setPhoto] = useState<string>(photoCache[d.wikiTitle] ?? "");
  const [imgFailed, setImgFailed] = useState(false);
  const initials = d.name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const winRate = d.careerRaces > 0 ? Math.round((d.careerWins / d.careerRaces) * 100) : 0;

  useEffect(() => {
    if (!photo) fetchWikiPhoto(d.wikiTitle).then(url => { if (url) setPhoto(url); });
  }, [d.wikiTitle]);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, backdropFilter: "blur(8px)" }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 201,
          background: "#0d0d0d",
          border: "1px solid #2a2a2a",
          borderRadius: 14,
          width: "min(740px,94vw)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ height: 4, background: d.teamColor, borderRadius: "14px 14px 0 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr" }}>
          {/* Photo column */}
          <div style={{ position: "relative", minHeight: 300, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {photo && !imgFailed ? (
              <img src={photo} alt={d.name} onError={() => setImgFailed(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block", position: "absolute", inset: 0 }}
              />
            ) : (
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                background: `${d.teamColor}22`, border: `2px solid ${d.teamColor}55`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 36, fontWeight: 900, color: d.teamColor,
              }}>{initials}</div>
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 50%, #0d0d0d 100%)" }} />
            {/* Giant faded number */}
            <div style={{
              position: "absolute", bottom: 8, left: 10,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 80, fontWeight: 900, lineHeight: 1,
              color: "rgba(255,255,255,0.05)", userSelect: "none",
            }}>{d.totalTitles}×</div>
          </div>

          {/* Info column */}
          <div style={{ padding: "24px 28px 28px 20px" }}>
            <button onClick={onClose} style={{
              position: "absolute", top: 14, right: 14,
              background: "none", border: "1px solid #2a2a2a", borderRadius: 4,
              color: "#555", padding: "3px 10px", fontSize: 11,
              fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, cursor: "pointer",
            }}>ESC</button>

            {/* Header */}
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#555", letterSpacing: 2, marginBottom: 4 }}>
              {d.nationality.toUpperCase()} · {d.born}{d.died ? `–${d.died}` : ""}
            </div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, letterSpacing: 1, color: "#f0f0f0", lineHeight: 1.1, marginBottom: 4 }}>
              {d.flag} {d.name}
            </h2>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, color: "#E10600", letterSpacing: 1.5, fontWeight: 700, marginBottom: 12 }}>
              {d.totalTitles}-TIME WORLD CHAMPION · {d.titleYears.join(", ")}
            </div>
            <p style={{ fontSize: 12, color: "#666", lineHeight: 1.65, marginBottom: 18 }}>{d.bio}</p>

            {/* Career stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
              {[
                { label: "Career wins",    value: d.careerWins },
                { label: "Pole positions", value: d.careerPoles },
                { label: "Races entered",  value: d.careerRaces },
              ].map(s => (
                <div key={s.label} style={{ background: "#161616", borderRadius: 6, padding: "10px 12px", borderTop: `2px solid ${d.teamColor}` }}>
                  <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: "#444", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 900, color: "#f0f0f0" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Championship seasons */}
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
              Championship seasons
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
              {d.entries.map(e => (
                <div key={e.year} style={{
                  display: "grid", gridTemplateColumns: "52px 1fr 32px 32px 56px",
                  gap: 8, alignItems: "center",
                  background: "#111", borderRadius: 4, padding: "7px 12px",
                  borderLeft: `2px solid ${d.teamColor}`,
                }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, color: "#E10600" }}>{e.year}</span>
                  <span style={{ fontSize: 11, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.team}</span>
                  {[["W", e.wins], ["P", e.poles], ["PTS", e.points]].map(([l, v]) => (
                    <div key={l as string} style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 7, color: "#333" }}>{l}</div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{v}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Win rate */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: "#444", letterSpacing: 1 }}>CAREER WIN RATE</span>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{winRate}%</span>
              </div>
              <div style={{ height: 3, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${winRate}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  style={{ height: "100%", background: d.teamColor, borderRadius: 2 }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChampionsPage() {
  const [sort, setSort] = useState<SortKey>("year");
  const [selected, setSelected] = useState<Driver | null>(null);
  const [search, setSearch] = useState("");

  const displayed = useMemo(() => {
    let list = [...DRIVERS];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.nationality.toLowerCase().includes(q));
    }
    if (sort === "year")   return list.sort((a, b) => b.titleYears[b.titleYears.length - 1] - a.titleYears[a.titleYears.length - 1]);
    if (sort === "name")   return list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "titles") return list.sort((a, b) => b.totalTitles - a.totalTitles || b.titleYears[b.titleYears.length - 1] - a.titleYears[a.titleYears.length - 1]);
    return list;
  }, [sort, search]);

  const totalTitles = DRIVERS.reduce((a, d) => a + d.totalTitles, 0);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
          World <span style={{ color: "#E10600" }}>Champions</span>
        </h1>
        <div style={{ height: 2, background: "#E10600", width: 60, marginBottom: 8 }} />
        <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 28 }}>
          1950 — 2025 · {DRIVERS.length} Champions · {totalTitles} Titles · Photos via Wikipedia
        </p>
      </motion.div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or nationality..."
          style={{
            background: "#0f0f0f", border: "1px solid #222", borderRadius: 4,
            color: "#f0f0f0", fontFamily: "'Barlow', sans-serif", fontSize: 13,
            padding: "7px 12px", flex: "1 1 200px", minWidth: 160, outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {([["year", "Recent First"], ["titles", "Most Titles"], ["name", "A–Z"]] as [SortKey, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setSort(key)} style={{
              padding: "7px 14px",
              background: sort === key ? "#E10600" : "#111",
              border: `1px solid ${sort === key ? "#E10600" : "#222"}`,
              borderRadius: 4,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 12, fontWeight: 600, letterSpacing: 1,
              color: sort === key ? "#fff" : "#555",
              textTransform: "uppercase", cursor: "pointer",
              transition: "all 0.2s",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <motion.div layout style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 14 }}>
        <AnimatePresence>
          {displayed.map((d, i) => (
            <DriverCard key={d.id} d={d} index={i} onClick={() => setSelected(d)} />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {selected && <ChampionModal driver={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
