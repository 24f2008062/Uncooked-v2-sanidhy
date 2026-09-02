/**
 * Optional Sentry wiring. No-ops unless SENTRY_DSN is set.
 * Uses runtime dynamic import so builds succeed without `@sentry/nextjs`
 * until you install it and set the DSN (see docs/ENV.md).
 */

let sentryModulePromise = null;

async function loadSentry() {
  if (!process.env.SENTRY_DSN) return null;
  if (sentryModulePromise) return sentryModulePromise;

  sentryModulePromise = (async () => {
    try {
      // Prevent bundlers from statically resolving an optional package.
      const importer = new Function("m", "return import(m)");
      const mod = await importer("@sentry/nextjs");
      if (!mod.getClient?.()) {
        mod.init({
          dsn: process.env.SENTRY_DSN,
          environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
          tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.05),
        });
      }
      return mod;
    } catch {
      return null;
    }
  })();

  return sentryModulePromise;
}

export async function captureException(error, context = {}) {
  try {
    const sentry = await loadSentry();
    if (!sentry?.captureException) return;
    if (sentry.withScope) {
      sentry.withScope((scope) => {
        Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
        sentry.captureException(error);
      });
      return;
    }
    sentry.captureException(error);
  } catch {
    // never throw from telemetry
  }
}
