import Dashboard from "@/components/Dashboard";

export const metadata = {
  title: "Operations Dashboard | Phoneme Activity Builder",
  description: "Data-driven dashboard with usage statistics, alerts and reporting views",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Operations Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Live system health, usage statistics, alerts and reporting views for the Phoneme Activity
        Builder.
      </p>
      <Dashboard />
    </div>
  );
}
