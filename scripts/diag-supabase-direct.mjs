import { readFileSync } from "node:fs";

function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const env = loadEnv(".env.local");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log("url", url, "anonLen", anon?.length);

const email = `diag.${Date.now()}@gmail.com`;
const password = "ValidPass1234!x";

const signup = await fetch(`${url}/auth/v1/signup`, {
  method: "POST",
  headers: {
    apikey: anon,
    Authorization: `Bearer ${anon}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email, password }),
});
const signupText = await signup.text();
console.log("signup", signup.status, signupText);

const login = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: {
    apikey: anon,
    Authorization: `Bearer ${anon}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email, password }),
});
console.log("login", login.status, await login.text());

// Also probe app login CSRF allowlist with vercel origin vs localhost origin
const BASE = "https://uncooked-v2.vercel.app";
for (const origin of [BASE, "http://localhost:3000", "https://opportia.in"]) {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({ email, password }),
  });
  console.log("app login origin", origin, r.status, await r.text());
}
