import StatCard from "./StatCard";

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <StatCard
        title="SMS Sent"
        value="12,480"
        icon="📤"
        trend="+8% this week"
      />
      <StatCard
        title="Credits Remaining"
        value="1,250"
        icon="💳"
      />
      <StatCard
        title="Active Campaigns"
        value="4"
        icon="🚀"
      />
      <StatCard
        title="Delivery Rate"
        value="98.6%"
        icon="📈"
        trend="Stable"
      />
    </div>
  );
}
