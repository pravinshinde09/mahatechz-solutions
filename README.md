# mahatechz-solutions (web)

Next.js 16 web app for the Mahatecz E-Learning Platform: public site, student area (`/app`) and
staff area (`/admin`). It never touches the database — every read and write goes through the API
(`mahatechz-solutions-api`). The authoritative spec is `Mahatecz.md`; § numbers refer to it.

> This Next.js version has breaking changes from older releases (`middleware` → `proxy`, async
> `cookies()`/`params`). See `AGENTS.md` and `node_modules/next/dist/docs/`.

## Quick start

```bash
npm install
cp .env.example .env.local      # API_INTERNAL_URL, WEB_APP_URL, COOKIE_SECURE, BFF_SHARED_SECRET
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

## Status (§31)

**Phase 1 — Foundation:** design-system base, public layout and pages, all auth flows (incl. staff
2FA with recovery codes), student and admin shells, staff invitations, security headers + nonce CSP.

**Phase 2 — Course management:**
- Public catalogue `/courses` (search, category/level/price filters, sort, pagination via URL),
  course pages with sticky price box, syllabus accordion, preview lessons, Course JSON-LD,
  `sitemap.xml`; home page categories and newest courses from the API.
- Admin: course list, new course, editor tabs (details, pricing & access, syllabus builder with
  keyboard reordering, lesson editor, resources & daily notes, publish checklist + lifecycle),
  categories & tags, media library.
- Uploads go straight from the browser to the provider (signed PUT, Cloudinary form, or resumable
  TUS for Bunny) and are verified by the API. With the API's `local` media driver everything
  works without provider accounts.
- Long editor forms use `ActionForm`, which keeps edits after a validation error (React's
  `<form action>` would reset them).
- Next.js upgraded to 16.4.3 (critical advisories in 16.3.x).

Verified end-to-end in a browser against the API (authoring → publish → public pages).

**Phase 3 — Enrolment & payments:**
- Checkout `/checkout/[courseId]` (quote, verified-email gate, terms) with Razorpay Checkout, or —
  when the API runs `PAYMENT_PROVIDER=simulated` — a test-payment panel that signs payments the
  same way, so the real verification path runs without Razorpay keys. Order status page polls
  until the webhook/reconciliation settles a pending payment.
- Free enrolment, and UPI / bank transfer (`/checkout/[courseId]/offline`: UPI QR, bank details,
  payment note, UTR + optional screenshot proof).
- Student: `/app/courses` (active, pending, expired), `/app/payments` (history, offline requests,
  cancel while pending), dashboard alerts.
- Admin: offline payment queue and verify/reject, payments list + detail with refunds, manual
  reconciliation, enrolments (grant, extend, suspend, reactivate, revoke — all with a reason),
  offline payment settings, dashboard KPIs (net revenue, pending offline, conversion, flagged).
- `/checkout` is a protected area in `proxy.ts`; the CSP allows Razorpay's frames and APIs.

Verified end-to-end in a browser against the API: simulated online purchase, offline submission
→ admin approval → access, full refund (access revoked), manual grant, suspension, KPIs.

**Phase 4 — Learning experience (web):**
- Course player `/app/learn/[course]/[lesson]`: syllabus sidebar (bottom sheet on mobile) with
  lesson states and module counts, video / external embed / article / resource lessons, prev/next,
  Overview / Resources / Announcements tabs. `/app/learn/[course]` resumes where the student left off.
- Progress is the server's answer: the player sends heartbeats (30 s, pause, seek, end, tab hidden)
  through `/api/learn/lessons/:id/:action`, a fixed allowlist BFF route that keeps the token in its
  HttpOnly cookie and checks Origin. Bunny embeds report playback via the player.js postMessage
  protocol; YouTube/Vimeo/Drive lessons use "Mark as complete" after the minimum time.
- `/app` dashboard from `/me/dashboard`; `/app/progress` (progress vs. labelled activity);
  `/app/live` + `/app/live/[id]` (join window, `.ics`, recordings, notes); `/app/notifications`
  with a header bell; `/app/support` tickets with attachments; resources page grouped by module or
  class date. Resource downloads go through `/api/resources/:id/download`.
- Admin: live classes (schedule, edit, recording + notes, cancel), announcements (course or
  platform, optional email), support queue with internal notes, status, priority and assignee.
- Radix sheets/dialogs now get the CSP nonce (`get-nonce`), fixing the blocked scroll-lock style.

Verified end-to-end in a browser: video completed from real heartbeats, article and external
lessons after their minimum time, course completion + notification, announcements read state,
live join (link withheld before the window), progress, support round trip with an internal note,
admin scheduling (lookalike Meet link rejected) and announcement fan-out, 390 px mobile layout.

**Phase 5 — Completion & analytics (web):**
- Quizzes: a quiz card on QUIZ lessons and `/app/learn/[course]/quiz/[quizId]` — question
  navigator, countdown (auto-submit at zero), autosave, review screen, results with answers per the
  quiz's setting. Calls go through `/api/learn/quiz/:id/:action` (allowlisted, Origin-checked,
  refreshes the session on 401 so long quizzes survive token expiry).
- `/app/certificates` (download PDF, copy verification link, LinkedIn "add to profile"); progress
  page shows quiz scores (verified), what the completion rule still needs, and the certificate.
- Public `/verify` (code or number) and `/verify/[code]` — minimal fields, `noindex`.
- Admin: dashboard on `/admin/analytics/overview` (KPI tiles with their §17.2 definitions,
  enrolments and net revenue per IST day as charts with table views, action queue, per-course
  completion and at-risk); course analytics (lesson funnel, at-risk list, quiz stats); student page
  with lesson-level progress, completion overrides and certificate issue/override; Certificates
  (issued list, ready-to-issue with bulk issue, detail with revoke/reissue and history, template
  designer with a live preview and real PDF preview); course "Completion & certificate" tab; quiz
  builder; Reports (CSV export builder + 24-hour downloads).
- The BFF forwards the visitor's IP to the API (`BFF_SHARED_SECRET`) so per-IP rate limits apply per
  visitor.

Verified end-to-end in a browser: template designed and previewed, certificates switched on for a
course, bulk issue from the ready list, PDF content and QR code (decoded) checked, public
verification (valid / revoked without reason / superseded → reissue), quiz built in the admin and
taken by a student (fail, then pass → course complete → automatic certificate), completion
override + issue, course analytics at-risk, CSV export download, dashboard figures against seeded
data, 390 px layouts without horizontal scroll.

Open: message catalogues for i18n (NFR-13 — strings are inline for now), Playwright + axe E2E
suite in CI, Lighthouse CI, Sentry, deployment (Cloudflare/OpenNext spike), light-theme toggle,
drag-and-drop reordering, a confirm dialog component (native `confirm()` for now), invoices /
GST receipts, final legal policy pages (required before Razorpay activation).
