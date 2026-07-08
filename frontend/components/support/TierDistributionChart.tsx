import { TierDistributionDatum } from "@/types/analytics";

interface TierDistributionChartProps {
  data: TierDistributionDatum[];
  title?: string;
  titleFa?: string;
}

// Hairline gap (in degrees) rendered between wedges so the slices read as
// separate segments — the secondary encoding that lets a near-neutral "Silver"
// stay legible alongside the colored tiers.
const GAP_DEG = 2;

// Dependency-free donut chart built from a CSS conic-gradient, following the
// same "no charting library" convention as the existing SubscriptionPieChart.
// Fully prop-driven: pass an array of { key, label, labelFa, users, color }.
export default function TierDistributionChart({
  data,
  title = "Subscription Distribution",
  titleFa = "توزیع اشتراک‌ها",
}: TierDistributionChartProps) {
  const total = data.reduce((sum, d) => sum + d.users, 0);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-sm">
        <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
          No subscription data to display.
        </p>
      </div>
    );
  }

  // Lay out each wedge, reserving GAP_DEG of empty space after it. The gaps are
  // rendered transparent so the card surface shows through as a thin separator.
  const sweepTotal = 360 - GAP_DEG * data.length;
  let cursor = 0;
  const stops = data
    .flatMap((d) => {
      const start = cursor;
      const end = start + (d.users / total) * sweepTotal;
      cursor = end + GAP_DEG;
      return [
        `${d.color} ${start}deg ${end}deg`,
        `transparent ${end}deg ${end + GAP_DEG}deg`,
      ];
    })
    .join(", ");

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-0.5 text-xs text-zinc-500" lang="fa" dir="rtl">
          {titleFa}
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
        {/* Donut: colored ring via conic-gradient + a dark center well showing the total */}
        <div className="relative h-44 w-44 shrink-0">
          <div
            role="img"
            aria-label={`Pie chart of user distribution across ${data.length} subscription tiers`}
            className="h-full w-full rounded-full"
            style={{ background: `conic-gradient(${stops})` }}
          />
          <div className="absolute inset-0 m-auto flex h-24 w-24 flex-col items-center justify-center rounded-full bg-zinc-950 text-center ring-1 ring-white/5">
            <span className="text-lg font-bold tabular-nums text-white">
              {total.toLocaleString()}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-zinc-400">Users</span>
          </div>
        </div>

        {/* Legend doubles as the accessible data table (label + count + share) */}
        <ul className="flex w-full flex-col gap-3 text-sm">
          {data.map((d) => {
            const pct = (d.users / total) * 100;
            return (
              <li key={d.key} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: d.color }}
                />
                <span className="min-w-0 flex-1 truncate">
                  <span className="text-zinc-200">{d.label}</span>
                  <span className="ml-1.5 text-zinc-500" lang="fa" dir="rtl">
                    {d.labelFa}
                  </span>
                </span>
                <span className="tabular-nums text-zinc-400">{d.users.toLocaleString()}</span>
                <span className="w-12 text-right tabular-nums text-zinc-500">
                  {pct.toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
