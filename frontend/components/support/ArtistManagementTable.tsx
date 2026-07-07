import { ManagedArtist } from "@/types/support";
import StatusBadge from "./StatusBadge";

interface ArtistManagementTableProps {
  artists: ManagedArtist[];
  onToggleBan: (artistId: string) => void;
  onToggleVerification: (artistId: string) => void;
  onViewDetails: (artist: ManagedArtist) => void;
}

const VERIFICATION_TONE = {
  verified: "blue",
  pending: "amber",
  rejected: "gray",
} as const;

export default function ArtistManagementTable({
  artists,
  onToggleBan,
  onToggleVerification,
  onViewDetails,
}: ArtistManagementTableProps) {
  if (artists.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
        No registered artists to display right now.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Artist</th>
            <th scope="col" className="px-4 py-3 font-medium">Releases</th>
            <th scope="col" className="px-4 py-3 font-medium">Verification</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {artists.map((artist) => (
            <tr key={artist.id} className="bg-zinc-950/40 hover:bg-zinc-900/60">
              <td className="px-4 py-3">
                <p className="font-medium text-white">{artist.name}</p>
                <p className="text-xs text-zinc-500">{artist.email}</p>
              </td>
              <td className="px-4 py-3 text-zinc-300">{artist.totalReleases}</td>
              <td className="px-4 py-3">
                <StatusBadge label={artist.verificationStatus} tone={VERIFICATION_TONE[artist.verificationStatus]} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge label={artist.status} tone={artist.status === "active" ? "green" : "red"} />
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onViewDetails(artist)}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleVerification(artist.id)}
                    className="rounded-lg border border-blue-500/40 px-3 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-500/10"
                  >
                    {artist.verificationStatus === "verified" ? "Revoke" : "Verify"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleBan(artist.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      artist.status === "banned"
                        ? "bg-emerald-500 text-black hover:bg-emerald-400"
                        : "bg-red-500/90 text-white hover:bg-red-500"
                    }`}
                  >
                    {artist.status === "banned" ? "Unban" : "Ban"}
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