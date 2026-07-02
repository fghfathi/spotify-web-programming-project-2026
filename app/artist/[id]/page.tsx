import { notFound } from "next/navigation";
import VerifiedBadge from "@/components/artist/VerifiedBadge";
import ArtistFollowButton from "@/components/artist/ArtistFollowButton";
import ArtistStats from "@/components/artist/ArtistStats";
import ArtistReleasesSection from "@/components/artist/ArtistReleasesSection";
import { mockArtists, mockFollowedArtistIds } from "@/data/mockArtistData";
import { mockUser } from "@/data/mockHomeData";

interface ArtistProfilePageProps {
  params: Promise<{ id: string }>;
}

// Phase 1: artist + follow data is mocked. Replace the lookups below with
// API calls (e.g. fetch from Django REST endpoints) once the backend phase
// begins — the component tree below does not need to change.
export default async function ArtistProfilePage({
  params,
}: ArtistProfilePageProps) {
  const { id } = await params;
  const artist = mockArtists[id];

  if (!artist) {
    notFound();
  }

  const isGoldMember = mockUser.subscription === "gold";
  const isFollowing = mockFollowedArtistIds.includes(artist.id);

  return (
    <main className="min-h-screen bg-black px-4 py-8 md:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                {artist.name}
              </h1>
              {artist.isVerified && <VerifiedBadge />}
            </div>
            <p className="mt-3 max-w-xl text-sm text-zinc-300">{artist.bio}</p>
          </div>

          <ArtistFollowButton
            artistName={artist.name}
            initialIsFollowing={isFollowing}
          />
        </div>

        {isGoldMember && (
          <ArtistStats
            totalListeners={artist.totalListeners}
            totalStreams={artist.totalStreams}
          />
        )}

        <ArtistReleasesSection releases={artist.releases} />
      </div>
    </main>
  );
}