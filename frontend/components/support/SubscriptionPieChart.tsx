import { SubscriptionDistribution } from "@/types/support";

interface SubscriptionPieChartProps {
  distribution: SubscriptionDistribution;
}

const TIER_COLORS = {
  free: "#71717a", // zinc-500
  silver: "#a1a1aa", // zinc-400
  gold: "#f59e0b", // amber-500
};

// Minimal dependency-free donut chart built with a CSS conic-gradient, so
// no charting library needs to be added to the project for this one visual.
export default function SubscriptionPieChart({ distribution }: SubscriptionPieChartProps) {
  const total = distribution.free + distribution.silver + distribution.gold;
  const tiers: Array<{ key: keyof SubscriptionDistribution; label: string }> = [
    { key: "free", label: "Free" },
    { key: "silver", label: "Silver" },
    { key: "gold", label: "Gold" },
  ];

  if (total === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
        No subscription data to display.
      </p>
    );
  }

  let cumulative = 0;
  const gradientStops = tiers
    .map(({ key }) => {
      const start = (cumulative / total) * 360;
      cumulative += distribution[key];
      const end = (cumulative / total) * 360;
      return `${TIER_COLORS[key]} ${start}deg ${end}deg`;
    })
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 sm:flex-row">
      <div
        role="img"
        aria-label="Pie chart showing distribution of users across subscription tiers"
        className="h-40 w-40 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradientStops})` }}
      />

      <ul className="flex flex-col gap-2 text-sm">
        {tiers.map(({ key, label }) => (
          <li key={key} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: TIER_COLORS[key] }}
            />
            <span className="text-zinc-300">{label}</span>
            <span className="text-zinc-500">
              {distribution[key].toLocaleString()} ({((distribution[key] / total) * 100).toFixed(1)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}