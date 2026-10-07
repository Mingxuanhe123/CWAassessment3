"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import usePageTime from "@/hooks/usePageTime";

type Alert = { level: "error" | "warning" | "info"; message: string };

type Metrics = {
  overview: {
    totalWordLists: number;
    totalWords: number;
    totalActivities: number;
    wordleActivities: number;
    wordSearchActivities: number;
    mostUsedActivityType: string;
    totalPageViews: number;
    averageTimeOnPageMs: number;
  };
  generations: { total: number; success: number; failed: number; failureRate: number };
  dailySeries: Array<{ date: string; success: number; failed: number }>;
  recentLog: Array<{
    id: string;
    activityType: string;
    success: boolean;
    failureReason: string | null;
    durationMs: number;
    createdAt: string;
  }>;
  alerts: Alert[];
};

const PIE_COLORS = ["#16a34a", "#dc2626"];

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-400">{hint}</p> : null}
    </div>
  );
}

function AlertBadge({ level }: { level: Alert["level"] }) {
  const styles: Record<Alert["level"], string> = {
    error: "bg-red-100 text-red-700 border-red-300",
    warning: "bg-amber-100 text-amber-700 border-amber-300",
    info: "bg-blue-100 text-blue-700 border-blue-300",
  };
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${styles[level]}`}>
      {level.toUpperCase()}
    </span>
  );
}

export default function Dashboard() {
  usePageTime("/dashboard");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [health, setHealth] = useState<{ status: string; latencyMs: number; database: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [mRes, hRes] = await Promise.all([
          fetch("/api/metrics"),
          fetch("/api/health"),
        ]);
        if (!mRes.ok) throw new Error("Failed to load metrics");
        setMetrics(await mRes.json());
        if (hRes.ok) setHealth(await hRes.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard data");
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-700">
        <strong>Error:</strong> {error}
      </div>
    );
  }
  if (!metrics) {
    return <div className="p-6 text-gray-500">Loading dashboard data…</div>;
  }

  const { overview, generations, dailySeries, recentLog, alerts } = metrics;
  const pieData = [
    { name: "Success", value: generations.success },
    { name: "Failed", value: generations.failed },
  ];
  const typePieData = [
    { name: "Wordle", value: overview.wordleActivities },
    { name: "Word Search", value: overview.wordSearchActivities },
  ];

  return (
    <div className="space-y-8">
      {/* Health status banner */}
      <div
        className={`flex items-center justify-between rounded-xl border p-4 ${
          health?.status === "OK"
            ? "border-green-300 bg-green-50"
            : "border-amber-300 bg-amber-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-block h-3 w-3 rounded-full ${
              health?.status === "OK" ? "bg-green-600" : "bg-amber-500"
            }`}
          />
          <span className="font-semibold">
            System status: {health?.status ?? "checking…"}
          </span>
          {health ? (
            <span className="text-sm text-gray-600">
              (database {health.database}, latency {health.latencyMs}ms)
            </span>
          ) : null}
        </div>
        <a
          href="/api/health"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-blue-600 underline"
        >
          /health endpoint
        </a>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Wordle activities" value={overview.wordleActivities} />
        <StatCard label="Word Search activities" value={overview.wordSearchActivities} />
        <StatCard
          label="Most-used activity type"
          value={overview.mostUsedActivityType === "wordle" ? "Wordle" : "Word Search"}
        />
        <StatCard
          label="Avg time on page"
          value={`${(overview.averageTimeOnPageMs / 1000).toFixed(1)}s`}
          hint={`${overview.totalPageViews} page views tracked`}
        />
        <StatCard
          label="Successful generations"
          value={generations.success}
          hint={`${generations.total} total attempts`}
        />
        <StatCard
          label="Failed generations"
          value={generations.failed}
          hint={`failure rate ${(generations.failureRate * 100).toFixed(1)}%`}
        />
        <StatCard label="Word lists" value={overview.totalWordLists} hint={`${overview.totalWords} words`} />
        <StatCard label="Total activities" value={overview.totalActivities} />
      </div>

      {/* Alerts */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Alerts &amp; warnings</h2>
        <ul className="space-y-2">
          {alerts.map((a, i) => (
            <li key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
              <AlertBadge level={a.level} />
              <span className="text-sm text-gray-700">{a.message}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Generation trend (last 14 days)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailySeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="success" name="Success" stackId="a" fill="#16a34a" />
              <Bar dataKey="failed" name="Failed" stackId="a" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Generation outcomes</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Activity type distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={typePieData} dataKey="value" nameKey="name" outerRadius={90} label>
                <Cell fill="#2563eb" />
                <Cell fill="#7c3aed" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Daily page activity</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailySeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="success" name="Successful" stroke="#16a34a" />
              <Line type="monotone" dataKey="failed" name="Failed" stroke="#dc2626" />
            </LineChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* Reporting view: recent generation log */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Recent generation log</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Result</th>
                <th className="py-2 pr-4">Duration</th>
                <th className="py-2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {recentLog.map((row) => (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">{row.activityType}</td>
                  <td className="py-2 pr-4">
                    {row.success ? (
                      <span className="text-green-700 font-medium">success</span>
                    ) : (
                      <span className="text-red-700 font-medium">failed</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">{row.durationMs}ms</td>
                  <td className="py-2 text-gray-500">{row.failureReason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
