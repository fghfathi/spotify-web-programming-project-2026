import { ManagedArtist } from "@/types/support";

interface ArtistVerificationTableProps {
  artists: ManagedArtist[]; // expected: already filtered to "pending"
  onViewPortfolio: (artist: ManagedArtist) => void;
}

// 11.2.1 — dedicated queue of artists awaiting verification. Kept separate
// from ArtistManagementTable (general ban/verify admin) since this table's
// job is specifically to surface pending requests for review.
export default function ArtistVerificationTable({ artists, onViewPortfolio }: ArtistVerificationTableProps) {
  if (artists.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
        No pending verification requests right now.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-amber-500/20">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-amber-500/[0.06] text-xs uppercase tracking-wide text-amber-200/80">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Artist Name</th>
            <th scope="col" className="px-4 py-3 font-medium">Email</th>
            <th scope="col" className="px-4 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {artists.map((artist) => (
            <tr key={artist.id} className="bg-zinc-950/40 hover:bg-zinc-900/60">
              <td className="px-4 py-3 font-medium text-white">{artist.name}</td>
              <td className="px-4 py-3 text-zinc-400">{artist.email}</td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onViewPortfolio(artist)}
                  className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/10"
                >
                  View Portfolio
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}