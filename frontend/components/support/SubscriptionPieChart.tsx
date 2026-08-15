import { ReportTierSlice } from "@/types/reports";

interface SubscriptionPieChartProps {
  /** `analytics.distribution` from GET /api/reports/admin/: counts + shares. */
  slices: ReportTierSlice[];
  /** Total user count behind those shares, also from the report. */
  totalUsers: number;
}

const TIER_COLORS: Record<ReportTierSlice["key"], string> = {
  basic: "#71717a", // zinc-500
  silver: "#a1a1aa", // zinc-400
  gold: "#f59e0b", // amber-500
};

// Minimal dependency-free donut chart built with a CSS conic-gradient, so no
// charting library needs to be added for this one visual. Counts and shares
// are supplied by the backend report; only the wedge angles are computed here.
export default function SubscriptionPieChart({
  slices,
  totalUsers,
}: SubscriptionPieChartProps) {
  if (totalUsers === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
        No subscription data to display.
      </p>
    );
  }

  // Each wedge begins where the previous one ended. Derived with a scan rather
  // than a running counter, which React Compiler rejects as render-time mutation.
  const startShares = slices.map((_, index) =>
    slices.slice(0, index).reduce((sum, slice) => sum + slice.sharePct, 0)
  );
  const gradientStops = slices
    .map((slice, index) => {
      const start = (startShares[index] / 100) * 360;
      const end = ((startShares[index] + slice.sharePct) / 100) * 360;
      return `${TIER_COLORS[slice.key]} ${start}deg ${end}deg`;
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
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: TIER_COLORS[slice.key] }}
            />
            <span className="text-zinc-300">{slice.label}</span>
            <span className="text-zinc-500">
              {slice.users.toLocaleString()} ({slice.sharePct.toFixed(1)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
