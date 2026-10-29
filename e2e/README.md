# End-to-end tests (Playwright + axe)

Critical journeys and accessibility checks from spec §27.1, run against a **running stack**:
local (API on :4000 with `JOBS_INLINE=true`, web on :3100) or staging.

```bash
# 1. Fixtures (API repo): synthetic accounts, a course with a quiz, a graduate with a certificate.
#    Re-running resets the test student's progress. It refuses to run against production.
cd ../mahatechz-solutions-Api && npm run --silent e2e:fixtures > ../mahatechz-solutions/e2e/.env.e2e

# 2. Tests (this repo)
cd ../mahatechz-solutions
set -a; . e2e/.env.e2e; set +a
E2E_BASE_URL=http://localhost:3100 npm run e2e          # Chromium desktop + Pixel 7
E2E_ALL_BROWSERS=1 npm run e2e                         # + Firefox, WebKit, iPhone 14 (public pages)

# 3. Remove the fixtures afterwards
cd ../mahatechz-solutions-Api && npx tsx --env-file=.env scripts/e2e-fixtures.ts --cleanup
```

The API allows **10 sign-ins per account per hour** (in memory, per instance) and one run uses about
six for the student. Running the suite twice within an hour fails with "Too many attempts": restart
the local API (or wait) and re-run the fixtures, which also resets the student's progress.

Every key page must have **zero serious or critical axe violations** (WCAG 2.2 A/AA rules) and no
horizontal scrolling on phones. Manual keyboard and screen-reader checks are still needed for each
release (spec §27.1): automated tools find only part of the accessibility problems.
