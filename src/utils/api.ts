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
