// ─── Rate-limited fetch queue for OpenF1 ─────────────────────────────────────
// Ensures max 1 request per 420ms to avoid 429s

const queue: (() => Promise<void>)[] = [];
let running = false;

async function processQueue() {
  if (running) return;
  running = true;
  while (queue.length > 0) {
    const task = queue.shift()!;
    await task();
    await new Promise(res => setTimeout(res, 420));
  }
  running = false;
}

export function rateLimitedFetch(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    queue.push(async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
        resolve(await res.json());
      } catch (err) {
        reject(err);
      }
    });
    processQueue();
  });
}

// ─── Jolpica (Ergast replacement) ────────────────────────────────────────────
// Jolpica is a direct drop-in for Ergast, fully CORS-enabled, free, no auth.
// Endpoint: https://api.jolpi.ca/ergast/f1/{year}/results.json
// Default page size is 30. A full season of per-race results is ~24 races × 20
// drivers = 480 rows. We request limit=100 and paginate.

const JOLPICA = "https://api.jolpi.ca/ergast/f1";

/**
 * Fetch all completed race results for a season.
 * Returns an array of race objects, each with a Results[] array.
 * Uses pagination to get all races (Jolpica defaults to 30 per page).
 */
export async function fetchRaceResults(year: number): Promise<any[]> {
  const allRaces: Record<string, any> = {}; // keyed by round to dedupe

  let offset = 0;
  const limit = 100;

  while (true) {
    const url = `${JOLPICA}/${year}/results.json?limit=${limit}&offset=${offset}`;
    let data: any;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Jolpica returned ${res.status} for ${url}`);
        break;
      }
      data = await res.json();
    } catch (err) {
      console.error("fetchRaceResults network error:", err);
      break;
    }

    const races: any[] = data?.MRData?.RaceTable?.Races ?? [];
    const total = parseInt(data?.MRData?.total ?? "0", 10);

    races.forEach((race: any) => {
      const round = race.round ?? race.raceName;
      if (!allRaces[round]) {
        allRaces[round] = { ...race };
      } else {
        // Merge Results arrays (pagination can split them)
        allRaces[round].Results = [
          ...(allRaces[round].Results ?? []),
          ...(race.Results ?? []),
        ];
      }
    });

    offset += limit;
    if (offset >= total || races.length === 0) break;
  }

  // Return races sorted by round, only those with results
  return Object.values(allRaces)
    .filter((r: any) => Array.isArray(r.Results) && r.Results.length > 0)
    .sort((a: any, b: any) => parseInt(a.round) - parseInt(b.round));
}

// ─── OpenF1 helpers ───────────────────────────────────────────────────────────

export async function fetchRacesByYear(year: number): Promise<string[]> {
  const url = `https://api.openf1.org/v1/sessions?year=${year}&session_name=Race`;
  try {
    const data = await rateLimitedFetch(url);
    if (!Array.isArray(data)) return [];
    return data
      .filter((s: any) => s.country_name)
      .map((s: any) => s.country_name)
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
  } catch {
    return [];
  }
}

export async function fetchDriversByYear(year: number): Promise<{ num: string; name: string }[]> {
  const sessUrl = `https://api.openf1.org/v1/sessions?year=${year}&session_name=Race`;
  try {
    const sessions = await rateLimitedFetch(sessUrl);
    if (!Array.isArray(sessions) || sessions.length === 0) return [];
    const sessionKey = sessions[0].session_key;
    const drivers = await rateLimitedFetch(`https://api.openf1.org/v1/drivers?session_key=${sessionKey}`);
    if (!Array.isArray(drivers)) return [];
    return drivers.slice(0, 20).map((d: any) => ({
      num: String(d.driver_number ?? "?"),
      name: (d.full_name || `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || `#${d.driver_number}`)
        .toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()),
    }));
  } catch {
    return [];
  }
}

export async function fetchLatestTelemetry() {
  const url = "https://api.openf1.org/v1/car_data?session_key=latest&limit=500";
  try {
    const data = await rateLimitedFetch(url);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
