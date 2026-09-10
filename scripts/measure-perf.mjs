/**
 * Lightweight load timing for key routes (cold-ish fetches).
 * Usage: node scripts/measure-perf.mjs [baseUrl]
 */
const BASE = (process.argv[2] || "https://uncooked-v2.vercel.app").replace(/\/$/, "");
const routes = ["/", "/events", "/opportunities", "/login", "/api/health", "/api/events"];

async function timeOnce(path) {
  const t0 = performance.now();
  const res = await fetch(`${BASE}${path}`, {
    headers: { "cache-control": "no-cache" },
    redirect: "follow",
  });
  const buf = await res.arrayBuffer();
  const ms = performance.now() - t0;
  return {
    path,
    status: res.status,
    ms: Math.round(ms),
    bytes: buf.byteLength,
    cache: res.headers.get("cache-control") || "",
  };
}

async function timeAvg(path, n = 3) {
  const runs = [];
  for (let i = 0; i < n; i++) {
    runs.push(await timeOnce(path));
    await new Promise((r) => setTimeout(r, 200));
  }
  const ms = Math.round(runs.reduce((a, b) => a + b.ms, 0) / runs.length);
  return { ...runs[runs.length - 1], msAvg: ms, runs: runs.map((r) => r.ms) };
}

console.log(`Measuring ${BASE}`);
const out = [];
for (const path of routes) {
  const row = await timeAvg(path, 3);
  out.push(row);
  console.log(
    `${path.padEnd(20)} avg=${String(row.msAvg).padStart(5)}ms  bytes=${String(row.bytes).padStart(8)}  status=${row.status}  cache=${row.cache || "-"}`
  );
}
console.log(JSON.stringify({ base: BASE, when: new Date().toISOString(), results: out }, null, 2));
