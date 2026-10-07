import { test, expect } from "@playwright/test";

test.describe("Health check endpoint", () => {
  test("GET /api/health returns 200 OK with status", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("OK");
    expect(body.database).toBe("connected");
    expect(body.counts).toBeDefined();
  });
});

test.describe("Metrics API", () => {
  test("GET /api/metrics returns overview, generations, alerts", async ({ request }) => {
    const res = await request.get("/api/metrics");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.overview).toBeDefined();
    expect(body.generations).toBeDefined();
    expect(Array.isArray(body.alerts)).toBe(true);
    expect(Array.isArray(body.dailySeries)).toBe(true);
    expect(body.overview).toHaveProperty("wordleActivities");
    expect(body.overview).toHaveProperty("wordSearchActivities");
    expect(body.overview).toHaveProperty("averageTimeOnPageMs");
    expect(body.generations).toHaveProperty("success");
    expect(body.generations).toHaveProperty("failed");
  });
});

test.describe("Telemetry API", () => {
  test("POST /api/telemetry records a generation event", async ({ request }) => {
    const res = await request.post("/api/telemetry", {
      data: {
        type: "generation",
        activityType: "wordle",
        success: true,
        durationMs: 123,
      },
    });
    expect(res.status()).toBe(201);
  });

  test("POST /api/telemetry rejects invalid type", async ({ request }) => {
    const res = await request.post("/api/telemetry", {
      data: { type: "bogus" },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/telemetry records a pageview", async ({ request }) => {
    const res = await request.post("/api/telemetry", {
      data: { type: "pageview", path: "/dashboard", durationMs: 5000 },
    });
    expect(res.status()).toBe(201);
  });
});

test.describe("Dashboard UI", () => {
  test("dashboard renders stat cards, alerts and charts", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Operations Dashboard" })).toBeVisible();
    // stat cards
    await expect(page.getByText("Wordle activities")).toBeVisible();
    await expect(page.getByText("Word Search activities")).toBeVisible();
    await expect(page.getByText("Avg time on page")).toBeVisible();
    await expect(page.getByText("Successful generations")).toBeVisible();
    await expect(page.getByText("Failed generations")).toBeVisible();
    // alerts panel
    await expect(page.getByRole("heading", { name: "Alerts & warnings" })).toBeVisible();
    // reporting table
    await expect(page.getByRole("heading", { name: "Recent generation log" })).toBeVisible();
  });
});

test.describe("App pages", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("wordle page loads", async ({ page }) => {
    await page.goto("/wordle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("word-search page loads", async ({ page }) => {
    await page.goto("/word-search");
    await expect(page.locator("body")).toBeVisible();
  });
});
