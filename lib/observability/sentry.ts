// Optional: Sentry error tracking (Phase 2)
// For Phase 1, install @sentry/nextjs in production

let Sentry: any = null;
try {
  Sentry = require("@sentry/nextjs");
} catch {
  // Sentry not installed
}

export function initSentry() {
  if (!process.env.SENTRY_DSN || !Sentry) return; // Skip if not configured or not installed

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    maxBreadcrumbs: 50,
  });
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!Sentry) return;
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: string = "info", context?: Record<string, unknown>) {
  if (!Sentry) return;
  Sentry.captureMessage(message, { level, extra: context });
}

export async function captureMetric(name: string, value: number, tags?: Record<string, string>) {
  // TODO: Integrate with Datadog/New Relic for metrics
  // For now, log to console in dev
  if (process.env.NODE_ENV === "development") console.log(`[METRIC] ${name} = ${value}`, tags);
}
