import { ArtistTrack } from "@/types/artistDashboard";
import EditButton from "@/components/shared/EditButton";

interface ArtistTrackListProps {
  tracks: ArtistTrack[];
  onEdit: (track: ArtistTrack) => void;
  onDeleteRequest: (track: ArtistTrack) => void;
}

// CRUD list view: read (table), update (EditButton -> edit modal),
// delete (trash icon -> confirm modal). Create happens on the Upload tab.
export default function ArtistTrackList({
  tracks,
  onEdit,
  onDeleteRequest,
}: ArtistTrackListProps) {
  if (tracks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
        You haven&apos;t published anything yet. Use the Upload tab to publish your first release.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-900 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">Type</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Genre</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Year</th>
            <th className="px-4 py-3 text-right font-medium">Streams</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800 bg-zinc-900/40">
          {tracks.map((track) => (
            <tr key={track.id} className="transition hover:bg-zinc-800/50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                    {track.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- object URLs from uploaded files
                      <img
                        src={track.coverImageUrl}
                        alt={track.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-600">
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M9.5 9v6l5-3-5-3Z" fill="currentColor" stroke="none" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{track.title}</p>
                    <p className="truncate text-xs text-zinc-500 sm:hidden">
                      {track.releaseType === "album" ? "Album" : "Single"} · {track.year}
                    </p>
                  </div>
                </div>
              </td>
              <td className="hidden px-4 py-3 text-zinc-300 sm:table-cell">
                {track.releaseType === "album" ? "Album" : "Single"}
              </td>
              <td className="hidden px-4 py-3 text-zinc-300 md:table-cell">{track.genre}</td>
              <td className="hidden px-4 py-3 text-zinc-300 md:table-cell">{track.year}</td>
              <td className="px-4 py-3 text-right text-zinc-300">
                {track.analytics.streams.toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <EditButton label={`Edit ${track.title}`} onClick={() => onEdit(track)} />
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(track)}
                    aria-label={`Delete ${track.title}`}
                    className="rounded-md p-1.5 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-.8 12.2a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8L5 7h14Z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}