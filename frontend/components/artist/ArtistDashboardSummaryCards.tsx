import { ArtistDashboardSummary } from "@/types/artistDashboard";

interface ArtistDashboardSummaryCardsProps {
  summary: ArtistDashboardSummary;
}

export default function ArtistDashboardSummaryCards({
  summary,
}: ArtistDashboardSummaryCardsProps) {
  const cards = [
    { label: "Total Streams", value: summary.totalStreams.toLocaleString() },
    { label: "Unique Listeners", value: summary.totalUniqueListeners.toLocaleString() },
    {
      label: "Estimated Revenue",
      value: summary.totalRevenue.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
      }),
    },
    { label: "Published Releases", value: summary.trackCount.toLocaleString() },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <p className="text-xs text-zinc-400">{card.label}</p>
          <p className="mt-1 text-xl font-semibold text-white">{card.value}</p>
        </div>
      ))}
    </div>
  );
}