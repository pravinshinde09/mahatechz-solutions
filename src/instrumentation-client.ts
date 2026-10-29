// Browser error reporting (spec §26). Off unless NEXT_PUBLIC_SENTRY_DSN is set at build time.
// The SDK is loaded lazily so it never weighs on first load (§21.7 JS budget); events go through
// the same-origin /monitoring tunnel, so the CSP needs no extra host.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  void import("@sentry/nextjs").then((Sentry) =>
    Sentry.init({
      dsn,
      tunnel: "/monitoring",
      tracesSampleRate: 0,
      beforeSend(event) {
        // Query strings can carry tokens (verification, reset links).
        if (event.request?.url) event.request.url = event.request.url.split("?")[0];
        delete event.request?.headers;
        delete event.user;
        return event;
      },
    }),
  );
}
