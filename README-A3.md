# Phoneme Activity Builder - Assessment 3 (Data-driven Application & Reporting)

Data-driven extension of the Wordle / Word Search builder: dashboard, usage statistics, alerts, reporting views, observability, and testing evidence.

## Quick Start

```bash
npm install          # installs all deps (incl. recharts, @playwright/test)
npm run db:push      # create SQLite database schema
npm run db:seed      # seed word data + 30 days of simulated telemetry
npm run dev          # start dev server -> http://localhost:3000
```

Or with Docker (same as Assessment 2):

```bash
docker build -t phoneme-builder .
docker run -p 3000:3000 phoneme-builder
```

## What's New in Assessment 3

| Feature | Where |
|---|---|
| Health check (`200 OK`) | `GET /api/health` |
| Aggregated metrics API | `GET /api/metrics` |
| Telemetry ingestion | `POST /api/telemetry` (pageview + generation events) |
| Operations dashboard | `/dashboard` (stat cards, alerts, 4 charts, reporting table) |
| Page-time tracking | `src/hooks/usePageTime.ts` |
| Generation instrumentation | `src/lib/telemetry.ts` wired into Wordle & Word Search |
| Simulated input records | `prisma/seed-telemetry.ts` (30 days, reproducible) |
| New DB models | `GenerationEvent`, `PageView` (see `prisma/schema.prisma`) |

## Dashboard

Navigate to **Dashboard** in the top menu (or `/dashboard`). It shows:

- **System status** - live health badge with DB connection + latency
- **Stat cards** - Wordle / Word Search activity counts, most-used type, avg time on page, successful / failed generations, word lists, totals
- **Alerts & warnings** - failure-rate threshold (10%), empty word lists, failed generations
- **Charts** (recharts) - 14-day generation trend (stacked bar), outcome pie, activity-type pie, daily line
- **Recent generation log** - last 20 events with result + failure reason

## Testing

### 1. Playwright (functional / E2E)

```bash
npm run test:e2e            # runs tests/app.spec.ts (uses system Google Chrome)
npx playwright show-report  # open HTML report
```

> Note: tests use Playwright's `channel: "chrome"` (system Google Chrome) - no browser download needed. If Chrome is not installed, run `npx playwright install chromium` and remove the `channel` line from `playwright.config.ts`.

Covers: /api/health, /api/metrics, /api/telemetry (valid + invalid), dashboard UI rendering, all main pages.

### 2. JMeter (load test)

Requires Java 17+ and [JMeter 5.x](https://jmeter.apache.org/).

```bash
# start the app first (npm run dev), then:
jmeter -n -t tests/jmeter/load-test.jmx -l results.jtl -e -o jmeter-report
```

Test plan: 20 threads, 5s ramp-up, 60s duration against /api/health, /api/metrics, / and /dashboard. Open `jmeter-report/index.html` for the results dashboard.

### 3. Lighthouse (accessibility)

```bash
npx lighthouse http://localhost:3000 --only-categories=accessibility --output html --output-path ./lighthouse-report.html
```

Open `lighthouse-report.html` and screenshot the accessibility score.

## Project Structure (new files)

```
prisma/
  schema.prisma          # + GenerationEvent, PageView models
  seed-telemetry.ts      # simulated 30-day usage data
src/
  app/
    api/
      health/route.ts    # GET /api/health  -> 200 OK
      metrics/route.ts   # GET /api/metrics -> dashboard JSON
      telemetry/route.ts # POST pageview / generation events
    dashboard/page.tsx   # dashboard route
  components/
    Dashboard.tsx        # client dashboard (stat cards, alerts, charts, table)
  hooks/
    usePageTime.ts       # time-on-page telemetry
  lib/
    telemetry.ts         # reportGeneration() helper
tests/
  app.spec.ts            # Playwright suite
  jmeter/load-test.jmx   # JMeter load test plan
```

## API Reference

### GET /api/health
```json
{ "status": "OK", "database": "connected", "latencyMs": 3, "counts": { "wordLists": 3, "activities": 5, "generations": 480 } }
```

### GET /api/metrics
Returns `overview` (activity counts, avg time on page), `generations` (success/failed/rate), `dailySeries` (14 days), `recentLog` (20 events), `alerts` (level + message).

### POST /api/telemetry
```json
{ "type": "generation", "activityType": "wordle", "success": true, "durationMs": 120 }
{ "type": "pageview", "path": "/dashboard", "durationMs": 15000 }
```

## Notes

- SQLite DB lives at `prisma/prod.db` (see `.env`)
- Telemetry seeding is reproducible (fixed PRNG seed) - the dashboard always shows the same demo data
- Telemetry calls never break the game (try/catch + keepalive beacon)
