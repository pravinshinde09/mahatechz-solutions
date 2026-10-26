# mahatechz-solutions (web)

Next.js 16 web app for the Mahatecz E-Learning Platform: public site, student area (`/app`) and
staff area (`/admin`). It never touches the database — every read and write goes through the API
(`mahatechz-solutions-api`). The authoritative spec is `Mahatecz.md`; § numbers refer to it.

> This Next.js version has breaking changes from older releases (`middleware` → `proxy`, async
> `cookies()`/`params`). See `AGENTS.md` and `node_modules/next/dist/docs/`.

## Quick start

```bash
npm install
cp .env.example .env.local      # API_INTERNAL_URL, WEB_APP_URL, COOKIE_SECURE
npm run dev                     # http://localhost:3000 — needs the API running on :4000
```

| Script | Purpose |
|---|---|
| `npm run typecheck` | Route types + `tsc --noEmit` |
| `npm run lint` / `npm test` | ESLint / Vitest unit tests |
| `npm run build` / `start` | Production build and server |
| `npm run contracts:sync` | Copy Zod contracts from `../mahatechz-solutions-Api/src/contracts` |

## Structure

```
src/
  proxy.ts                 per-request CSP nonce, x-pathname, optimistic redirect for /app & /admin
  app/(public)/            home, courses, about, contact, legal (draft outlines)
  app/(auth)/              login (+ /login/2fa), register, verify-email, forgot/reset password,
                           account-setup (bootstrap link), accept-invitation; Server Actions in actions.ts
  app/app/                 student shell: dashboard, my courses, settings
  app/admin/               staff shell: dashboard, staff & invitations, security (TOTP setup)
  app/api/auth/*           BFF route handlers: refresh, logout, signout
  components/ui/           shadcn/ui (Radix) primitives restyled with the design tokens
  components/{forms,layout,feedback,brand}/
  lib/contracts/           GENERATED from the API — do not edit; run contracts:sync
  lib/auth/                cookies, session (requireUser / requireStaff), safe redirects
  lib/api/server.ts        server-only API client
```

Design tokens ("Blueprint Circuit", §21) are CSS variables in `src/app/globals.css`; dark is the
default theme and a light palette is defined under `[data-theme="light"]`.

## Decisions

### Auth cookies and the BFF (§18.1)

- Tokens live only in HttpOnly, SameSite=Lax cookies (`__Host-`/`__Secure-` prefixed when
  `COOKIE_SECURE=true`). The refresh cookie is scoped to `/api/auth`, so ordinary page requests
  never carry it.
- Server Components cannot set cookies. When the access cookie has expired (its max-age is
  slightly shorter than the JWT), `proxy.ts` or `requireUser()` redirects through
  `GET /api/auth/refresh?next=…`, which rotates the refresh token and returns to the page.
- The API revokes a whole session if a refresh token is reused. Concurrent refreshes (two tabs)
  are therefore de-duplicated in-process for 10 s. **This assumes a single web instance;** with
  several instances, refresh must move to a shared lock or the API needs a short reuse grace period.
- Forms use Server Actions (Next's built-in Origin check). The logout route handler checks Origin
  / `Sec-Fetch-Site` explicitly.
- `proxy.ts` redirects are UX only; authorisation is always enforced by the API.

### Strict CSP with nonces → every page renders per request (§18.3)

`script-src 'nonce-…' 'strict-dynamic'` requires dynamic rendering, so the root layout calls
`connection()` and no page is statically generated (the spec's SSG/ISR for the home page is
traded for the stricter CSP). Revisit for public marketing pages with Next's experimental SRI if
traffic or hosting cost makes it worthwhile. `style-src-attr 'unsafe-inline'` is allowed because
Radix positions popovers with style attributes.

## Status (§31 Phase 1)

Done: design-system base, public layout and pages, all auth flows (incl. staff 2FA with
recovery codes), student and admin shells, staff invitations, security headers + nonce CSP.
Verified end-to-end in a browser against the API.

Open: message catalogues for i18n (NFR-13 — strings are inline for now), Playwright + axe E2E
suite in CI, Lighthouse CI, Sentry, deployment (Cloudflare/OpenNext spike), light-theme toggle.
