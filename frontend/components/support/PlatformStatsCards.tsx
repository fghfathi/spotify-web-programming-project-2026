import { PlatformStats } from "@/types/support";

interface PlatformStatsCardsProps {
  stats: PlatformStats;
}

const CARDS: Array<{ key: keyof PlatformStats; label: string }> = [
  { key: "totalUsers", label: "Total Users" },
  { key: "totalArtists", label: "Total Artists" },
  { key: "activeArtists", label: "Active Artists" },
  { key: "pendingTickets", label: "Pending Tickets" },
];

export default function PlatformStatsCards({ stats }: PlatformStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {CARDS.map((card) => (
        <div key={card.key} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">{card.label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats[card.key]}</p>
        </div>
      ))}
    </div>
  );
}