import { RevenueMetric, RevenueMetricFormat } from "@/types/analytics";

interface RevenueMetricCardsProps {
  metrics: RevenueMetric[];
  currency?: string;
}

// Inline, dependency-free icons drawn in the lucide-react visual style (24×24
// stroke icons). This matches the project convention (see VolumeControlSection),
// which avoids adding an icon package. Swap these for lucide-react's DollarSign
// / Users / TrendingUp / ArrowUpRight / ArrowDownRight / Minus if that package
// is ever added to the project.
type IconProps = { className?: string };

function DollarSignIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TrendingUpIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function ArrowDownRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="7" y1="7" x2="17" y2="17" />
      <polyline points="17 7 17 17 7 17" />
    </svg>
  );
}

function MinusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// Map a metric id to its leading icon, with a sensible fallback.
function MetricIcon({ id, className }: { id: string; className?: string }) {
  if (id === "paying") return <UsersIcon className={className} />;
  if (id === "arpu") return <TrendingUpIcon className={className} />;
  return <DollarSignIcon className={className} />;
}

function formatValue(value: number, format: RevenueMetricFormat, currency: string): string {
  if (format === "currency") {
    return `${currency}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (format === "percent") {
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
  }
  return value.toLocaleString();
}

// Small colored pill showing month-over-month change: green ↑ for growth,
// red ↓ for decline, neutral for flat/no data.
function GrowthIndicator({ changePct }: { changePct?: number }) {
  if (changePct === undefined) return null;

  const up = changePct > 0;
  const down = changePct < 0;
  const tone = up
    ? "bg-emerald-500/10 text-emerald-400"
    : down
      ? "bg-red-500/10 text-red-400"
      : "bg-zinc-500/10 text-zinc-400";
  const Arrow = up ? ArrowUpRightIcon : down ? ArrowDownRightIcon : MinusIcon;
  const sign = up ? "+" : "";

  return (
    <span className="mt-3 inline-flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>
        <Arrow className="h-3.5 w-3.5" />
        {`${sign}${changePct.toFixed(1)}%`}
      </span>
      <span className="text-xs text-zinc-500">vs last month</span>
    </span>
  );
}

// Prop-driven revenue stat cards for the Analytics & Reporting dashboard.
export default function RevenueMetricCards({ metrics, currency = "$" }: RevenueMetricCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-sm transition-colors hover:border-zinc-700"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-wide text-zinc-500">{metric.label}</p>
              {metric.labelFa ? (
                <p className="mt-0.5 truncate text-[11px] text-zinc-500" lang="fa" dir="rtl">
                  {metric.labelFa}
                </p>
              ) : null}
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <MetricIcon id={metric.id} className="h-5 w-5" />
            </span>
          </div>

          <p className="mt-3 text-2xl font-bold tabular-nums text-white">
            {formatValue(metric.value, metric.format, currency)}
          </p>

          <GrowthIndicator changePct={metric.changePct} />
        </div>
      ))}
    </div>
  );
}
