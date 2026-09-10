function allowedOrigins() {
  const origins = new Set();
  for (const value of [process.env.NEXTAUTH_URL, process.env.NEXT_PUBLIC_APP_URL, process.env.APP_URL]) {
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // ignore malformed env
    }
  }
  if (process.env.NODE_ENV !== "production") {
    // Common local ports (dev may not always be :3000)
    for (const host of ["localhost", "127.0.0.1"]) {
      for (const port of ["3000", "3001", "3010"]) {
        origins.add(`http://${host}:${port}`);
      }
    }
  }
  return origins;
}

function isAllowedDevLoopback(origin) {
  if (process.env.NODE_ENV === "production" || !origin) return false;
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "http:") return false;
    const host = parsed.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") return false;
    const port = parsed.port;
    if (port && (!/^[0-9]{1,5}$/.test(port) || Number(port) > 65535 || Number(port) < 1)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function assertSameOrigin(req) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  const origin = req.headers.get("origin");
  const allowed = allowedOrigins();

  if (allowed.size === 0) {
    if (process.env.NODE_ENV === "production") {
      return "Origin check is not configured";
    }
    return null;
  }

  if (!origin) {
    // Browsers may omit Origin on same-origin POSTs. Accept only when
    // Sec-Fetch-Site proves same-origin. Do NOT trust "none": non-browser
    // clients (and some cross-site contexts) can omit/forge that header.
    const secFetchSite = (req.headers.get("sec-fetch-site") || "").toLowerCase();
    if (secFetchSite === "same-origin") {
      return null;
    }
    return "Missing Origin header";
  }

  if (!allowed.has(origin)) {
    if (isAllowedDevLoopback(origin)) {
      return null;
    }
    return "Cross-origin request blocked";
  }

  return null;
}
