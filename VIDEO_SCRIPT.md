# Assessment 3 - Video Walkthrough Script (3-8 min)

**Format:** verbal walkthrough with screen recording. Show student ID + face at the start (5-10 sec), then switch to screen share. Talk through each section below.

---

## [0:00-0:20] Intro

"Hi, my name is [NAME], student ID [ID]. This is my Assessment 3 video for the Phoneme Activity Builder - a data-driven web application with dashboards, observability and reporting. The project is built with Next.js 16, Prisma and SQLite."

*(Hold student ID to camera, then switch to screen)*

## [0:20-1:00] App overview + GitHub

- Open GitHub repo homepage: "The full code is committed here - you can see the commit history showing the feature development." Scroll through commits briefly.
- Open the app at localhost:3000: "The app is running locally with `npm run dev`."

## [1:00-2:30] Dashboard (main demo)

Click **Dashboard** in the nav.

- Point at the health banner: "At the top, a live health indicator - it polls `/api/health` which returns 200 OK, and shows database connection status and latency."
- Point at stat cards: "Eight stat cards show Wordle and Word Search activity counts, most-used activity type, average time on page - which is tracked automatically - and successful versus failed generation counts."
- Scroll to alerts: "The alerts panel flags problems automatically - like empty word lists that would break generation, or when the failure rate exceeds 10%." *(if red alert visible, explain it)*
- Point at charts: "These four charts - generated with Recharts - show the 14-day generation trend as stacked success/failure bars, outcome distribution, activity type distribution, and daily activity lines."

## [2:30-3:30] Data-driven features + reporting view

- Scroll to the reporting table: "The reporting view shows the most recent generation events with timestamps, type, result and failure reasons - this is all database-backed."
- Open browser DevTools > Network tab, click a filter/refresh: "You can see the metrics API call returning JSON aggregated directly from the database."
- Visit /wordle, click "New Game": "When I generate a new game here, a telemetry event is posted to /api/telemetry."
- Go back to Dashboard, refresh: "The generation counter just increased - live instrumentation working."

## [3:30-4:30] Alerts demo

- Show the alerts panel again. If no red alerts: "To demonstrate alerts, an empty word list triggers a warning - failed generation events are recorded with reasons like 'Word list is empty'."
- Point to failed generation card + failure reasons in the log table.

## [4:30-5:30] Observability + health check

- Open a new tab: `localhost:3000/api/health` - "The healthcheck endpoint returns 200 OK with status, database state, latency and record counts."
- Open `localhost:3000/api/metrics` - "The metrics endpoint returns all dashboard data as JSON - aggregated from Prisma queries against SQLite."

## [5:30-6:30] Testing evidence

- **Playwright:** "For functional testing I wrote Playwright tests covering the health API, metrics API, telemetry validation, and dashboard UI." Show terminal: `npm run test:e2e` -> show report (`npx playwright show-report`). Scroll the HTML report showing all green.
- **JMeter:** "For load testing, a JMeter plan runs 20 concurrent users for 60 seconds against the health, metrics and page endpoints." Show the JMeter summary report / results page.
- **Lighthouse:** "For accessibility, Lighthouse gives an accessibility score of [X]." Show the Lighthouse HTML report.

## [6:30-7:30] Data modelling + code quality

- Open `prisma/schema.prisma`: "The data model extends the original word/activity schema with two observability tables - GenerationEvent and PageView - so all statistics are persisted and queryable."
- Open `src/lib/telemetry.ts`: "Telemetry calls are wrapped in try/catch with keepalive - instrumentation can never break the game."
- Open `src/app/api/metrics/route.ts`: "Metrics are computed server-side with Prisma groupBy - no client-side guessing."

## [7:30-8:00] Outro

"To summarise: the app demonstrates data-driven dashboards, database-backed statistics, live instrumentation, alerts, reporting views, and has been tested with Playwright, JMeter and Lighthouse. Thank you for watching."

---

## Recording tips

1. Record with Zoom/QuickTime "screen + camera" so your face shows throughout
2. Keep the app running (`npm run dev`) and seed data loaded (`npm run db:seed`) before recording
3. If JMeter/Java is not installed, you may substitute: "JMeter requires Java which is not available on my machine - the test plan is included at tests/jmeter/load-test.jmx" and show the .jmx file instead
4. Speak naturally - this script is a guide, not a script to read word-for-word
5. Total target: 6-7 minutes
