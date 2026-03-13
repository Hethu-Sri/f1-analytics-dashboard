// Global queue — all OpenF1 requests go through here
// Ensures max 1 request per 400ms to avoid 429s

const queue: (() => Promise<void>)[] = [];
let running = false;

async function processQueue() {
  if (running) return;
  running = true;
  while (queue.length > 0) {
    const task = queue.shift()!;
    await task();
    await new Promise(res => setTimeout(res, 420)); // 420ms between requests
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

/**
 * Fetch all races for a given season from OpenF1
 */
export async function fetchRacesByYear(year: number): Promise<string[]> {
  const BASE = "https://api.openf1.org/v1";
  const url = `${BASE}/races?year=${year}`;
  try {
    const data = await rateLimitedFetch(url);
    if (!Array.isArray(data)) return [];
    // Extract country names and filter out non-race sessions
    return data
      .filter((race: any) => race.session_name === "Race" && race.country_name)
      .map((race: any) => race.country_name)
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i); // dedupe
  } catch {
    return [];
  }
}

/**
 * Fetch all drivers for a given season from OpenF1
 */
export async function fetchDriversByYear(year: number): Promise<{ num: string; name: string }[]> {
  const BASE = "https://api.openf1.org/v1";
  // Fetch latest session key for the year to get driver list
  const sessUrl = `${BASE}/sessions?year=${year}&session_name=Race`;
  try {
    const sessions = await rateLimitedFetch(sessUrl);
    if (!Array.isArray(sessions) || sessions.length === 0) return [];
    
    const sessionKey = sessions[0].session_key;
    const drvrUrl = `${BASE}/drivers?session_key=${sessionKey}`;
    const drivers = await rateLimitedFetch(drvrUrl);
    
    if (!Array.isArray(drivers)) return [];
    return drivers
      .slice(0, 20) // top 20 drivers only
      .map((d: any) => ({
        num: String(d.driver_number ?? "?"),
        name: `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || `#${d.driver_number}`,
      }));
  } catch {
    return [];
  }
}

/**
 * Fetch latest telemetry data from OpenF1
 */
export async function fetchLatestTelemetry() {
  const BASE = "https://api.openf1.org/v1";
  const url = `${BASE}/car_data?session_key=latest&limit=500`;
  try {
    const data = await rateLimitedFetch(url);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Fetch race results for a given season from Ergast API
 */
export async function fetchRaceResults(year: number): Promise<any[]> {
  try {
    const url = `https://ergast.com/api/f1/${year}/results.json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const races = data?.MRData?.RaceTable?.Races ?? [];
    return races;
  } catch {
    return [];
  }
}
