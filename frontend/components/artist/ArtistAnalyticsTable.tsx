import { ArtistTrack } from "@/types/artistDashboard";
import { REVENUE_PER_STREAM } from "@/data/mockArtistDashboardData";

interface ArtistAnalyticsTableProps {
  tracks: ArtistTrack[];
}

// Per-track performance breakdown, sorted by streams descending.
export default function ArtistAnalyticsTable({ tracks }: ArtistAnalyticsTableProps) {
  if (tracks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
        No performance data yet. Publish a release to start tracking analytics.
      </p>
    );
  }

  const sorted = [...tracks].sort((a, b) => b.analytics.streams - a.analytics.streams);

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 text-right font-medium">Streams</th>
            <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">
              Unique Listeners
            </th>
            <th className="px-4 py-3 text-right font-medium">Revenue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800 bg-zinc-900/40">
          {sorted.map((track) => (
            <tr key={track.id} className="transition hover:bg-zinc-800/50">
              <td className="px-4 py-3">
                <p className="truncate font-medium text-white">{track.title}</p>
                <p className="text-xs text-zinc-500">
                  {track.releaseType === "album" ? "Album" : "Single"} · {track.year}
                </p>
              </td>
              <td className="px-4 py-3 text-right text-zinc-300">
                {track.analytics.streams.toLocaleString()}
              </td>
              <td className="hidden px-4 py-3 text-right text-zinc-300 sm:table-cell">
                {track.analytics.uniqueListeners.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right font-medium text-emerald-400">
                {(track.analytics.streams * REVENUE_PER_STREAM).toLocaleString(undefined, {
                  style: "currency",
                  currency: "USD",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}