"use client";

// Artist profile page — backed by the API (Bug 1). Fetches /api/artists/<id>/
// and renders the profile, Gold-only stats, and combined releases.

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import VerifiedBadge from "@/components/artist/VerifiedBadge";
import ArtistFollowButton from "@/components/artist/ArtistFollowButton";
import ArtistStats from "@/components/artist/ArtistStats";
import ArtistReleasesSection from "@/components/artist/ArtistReleasesSection";
import RouteGuard from "@/components/shared/RouteGuard";
import { LoadingState, ErrorState } from "@/components/shared/UIStates";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/lib/api";
import { Artist } from "@/types/artist";

interface ArtistDetail extends Artist {
  isFollowedByCurrentUser: boolean;
}

function ArtistProfileContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user } = useAuth();
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const data = await apiGet<ArtistDetail>(`/artists/${Number(id)}/`);
      setArtist(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <LoadingState label="Loading artist…" />
      </div>
    );
  }
  if (error || !artist) {
    return (
      <div className="min-h-screen bg-black">
        <ErrorState message="This artist could not be found." onRetry={load} />
      </div>
    );
  }

  const isGoldMember = user?.subscription === "gold";

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
            artistId={String(artist.id)}
            artistName={artist.name}
            initialIsFollowing={artist.isFollowedByCurrentUser}
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

export default function ArtistProfilePage() {
  return (
    <RouteGuard>
      <ArtistProfileContent />
    </RouteGuard>
  );
}
