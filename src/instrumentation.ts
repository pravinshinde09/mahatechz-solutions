import * as Sentry from "@sentry/nextjs";

/**
 * Server-side error reporting (spec §26). Off unless SENTRY_DSN_WEB is set. Errors only — no
 * tracing; request data and user identities are stripped before sending.
 */
export function register() {
  const dsn = process.env.SENTRY_DSN_WEB;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.APP_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0,
    beforeSend(event) {
      delete event.request;
      delete event.user;
      return event;
    },
  });
}

export const onRequestError = Sentry.captureRequestError;
