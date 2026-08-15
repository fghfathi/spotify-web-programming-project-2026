import { SupportReport } from "@/types/reports";

interface PlatformStatsCardsProps {
  /** The support report, straight from GET /api/reports/support/. */
  stats: SupportReport;
}

/** Only the numeric fields of the report can back a stat card. */
type NumericStatKey = {
  [K in keyof SupportReport]: SupportReport[K] extends number ? K : never;
}[keyof SupportReport];

// Each card reads one precomputed field off the report. Adding a card means
// adding a field to `build_support_report()` — never summing anything here.
const CARDS: Array<{ key: NumericStatKey; label: string; hint?: string }> = [
  { key: "totalUsers", label: "Total Users" },
  { key: "totalArtists", label: "Total Artists" },
  { key: "activeArtists", label: "Active Artists" },
  { key: "pendingTickets", label: "Pending Tickets", hint: "Open + answered" },
  { key: "resolvedTickets", label: "Resolved Tickets" },
  { key: "pendingVerifications", label: "Pending Verifications" },
  { key: "bannedUsers", label: "Banned Users" },
  { key: "ticketsLast7Days", label: "New Tickets (7d)" },
];

export default function PlatformStatsCards({ stats }: PlatformStatsCardsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {CARDS.map((card) => (
          <div
            key={card.key}
            className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5"
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {stats[card.key].toLocaleString()}
            </p>
            {card.hint && <p className="mt-1 text-[11px] text-zinc-600">{card.hint}</p>}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Ticket Resolution Rate
          </p>
          <p className="text-sm font-semibold tabular-nums text-emerald-400">
            {stats.resolutionRatePct.toFixed(1)}%
          </p>
        </div>
        <div
          role="img"
          aria-label={`${stats.resolutionRatePct.toFixed(1)} percent of ${stats.totalTickets} tickets resolved`}
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800"
        >
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${stats.resolutionRatePct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {stats.resolvedTickets.toLocaleString()} resolved ·{" "}
          {stats.unresolvedTickets.toLocaleString()} unresolved ·{" "}
          {stats.totalTickets.toLocaleString()} total
        </p>
      </div>
    </>
  );
}
