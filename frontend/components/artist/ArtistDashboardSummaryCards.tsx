import { ArtistReportSummary } from "@/types/reports";

interface ArtistDashboardSummaryCardsProps {
  /** The `summary` block of GET /api/reports/artist/, already aggregated. */
  summary: ArtistReportSummary;
  currency?: string;
}

export default function ArtistDashboardSummaryCards({
  summary,
  currency = "$",
}: ArtistDashboardSummaryCardsProps) {
  const cards = [
    { label: "Total Streams", value: summary.totalStreams.toLocaleString() },
    {
      // A distinct count across the whole catalog. Summing the per-track values
      // would double-count anyone who played two of this artist's songs.
      label: "Unique Listeners",
      value: summary.totalUniqueListeners.toLocaleString(),
    },
    {
      label: "Estimated Revenue",
      value: `${currency}${summary.totalRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    { label: "Published Releases", value: summary.trackCount.toLocaleString() },
    { label: "Streams (30d)", value: summary.streamsLast30Days.toLocaleString() },
    { label: "Followers", value: summary.followerCount.toLocaleString() },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <p className="text-xs text-zinc-400">{card.label}</p>
          <p className="mt-1 text-xl font-semibold text-white">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
