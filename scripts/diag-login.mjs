const BASE = "https://uncooked-v2.vercel.app";

async function extractSupabase() {
  const html = await (await fetch(BASE + "/login")).text();
  const fromHtml = [...html.matchAll(/https:\/\/[a-z0-9-]+\.supabase\.co/gi)].map((m) => m[0]);
  const scripts = [...html.matchAll(/\/_next\/static\/[^"']+\.js/g)].map((m) => m[0]);
  const found = new Set(fromHtml);
  for (const s of scripts.slice(0, 40)) {
    try {
      const t = await (await fetch(BASE + s)).text();
      for (const m of t.matchAll(/https:\/\/[a-z0-9-]+\.supabase\.co/gi)) found.add(m[0]);
      for (const m of t.matchAll(/NEXT_PUBLIC_SUPABASE_URL["']?\s*[:=]\s*["']([^"']+)/g)) found.add(m[1]);
    } catch {
      /* ignore */
    }
  }
  return [...found];
}

async function post(path, body) {
  const r = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: r.status, json, setCookie: typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [] };
}

async function supabaseSignUp(url, anonKey, email, password) {
  const r = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const json = await r.json().catch(() => ({}));
  return { status: r.status, json };
}

async function supabasePassword(url, anonKey, email, password) {
  const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const json = await r.json().catch(() => ({}));
  return { status: r.status, json };
}

const urls = await extractSupabase();
console.log("SUPABASE_URLS", urls);

// Pull anon key from chunks (public by design in Next client bundles)
const pages = ["/login", "/signup", "/"];
const scriptSet = new Set();
for (const p of pages) {
  const html = await (await fetch(BASE + p)).text();
  for (const m of html.matchAll(/\/_next\/static\/[^"']+\.js/g)) scriptSet.add(m[0]);
}
let anon = null;
for (const s of scriptSet) {
  const t = await (await fetch(BASE + s)).text();
  if (!t.includes("supabase") && !t.includes("uncooked-dev-project")) continue;
  const m = t.match(/eyJhbGci[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/);
  if (m) {
    anon = m[0];
    console.log("ANON_KEY_FOUND_IN", s, "len", anon.length);
    break;
  }
}
if (!anon) console.log("ANON_KEY_NOT_FOUND scripts=", scriptSet.size);

const email = `diag.login.${Date.now()}@gmail.com`;
const password = "ValidPass1234!x";
console.log("APP_REGISTER", await post("/api/auth/register", {
  name: "Diag",
  email,
  password,
  ageAttested18: true,
  acceptTerms: true,
}));
console.log("APP_LOGIN", await post("/api/auth/login", { email, password }));

if (urls[0] && anon) {
  console.log("DIRECT_SIGNUP", await supabaseSignUp(urls[0], anon, email, password));
  console.log("DIRECT_LOGIN", await supabasePassword(urls[0], anon, `existing-${email}`, password));
}
