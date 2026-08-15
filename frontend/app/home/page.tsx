"use client";

// Home page — now fully backed by the Django REST API (Bug 1).
// Fetches the aggregated feed from /api/home/, applies the real logged-in
// user, and wires popular-song / early-access cards to the music player.

import { useCallback, useEffect, useState } from "react";
import TopBar from "@/components/home/TopBar";
import Sidebar from "@/components/home/Sidebar";
import ContentSection from "@/components/home/ContentSection";
import ContentCard from "@/components/home/ContentCard";
import EarlyAccessSection from "@/components/home/EarlyAccessSection";
import RecommendationSection from "@/components/home/RecommendationSection";
import RouteGuard from "@/components/shared/RouteGuard";
import { LoadingState, ErrorState } from "@/components/shared/UIStates";
import { sidebarNavItems } from "@/data/mockHomeData";
import { useAuth } from "@/context/AuthContext";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { apiGet } from "@/lib/api";
import { ApiSong, toSongs } from "@/lib/mappers";
import { EarlyAccessItem, Playlist, Album, User } from "@/types/home";

interface HomeFeed {
  recentPlaylists: (Playlist & { coverImageUrl?: string })[];
  recentAlbums: Album[];
  popularSongs: ApiSong[];
  earlyAccess: EarlyAccessItem[];
}

function HomeContent() {
  const { user } = useAuth();
  const { playSong } = useMusicPlayer();
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiGet<HomeFeed>("/home/");
      setFeed(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The authenticated user, mapped to the shape TopBar/Sidebar expect.
  const topBarUser: User = {
    id: String(user?.id ?? ""),
    displayName: user?.displayName ?? "",
    profileImageUrl: user?.profileImageUrl ?? undefined,
    subscription: user?.subscription === "gold" ? "gold" : "free",
    role: user?.role ?? "listener",
  };
  const isGoldMember = user?.subscription === "gold";

  const popularSongs = feed ? toSongs(feed.popularSongs) : [];

  return (
    <div className="flex min-h-screen flex-col bg-black md:flex-row">
      <Sidebar navItems={sidebarNavItems} />

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <TopBar user={topBarUser} />

        <main className="flex-1 px-4 py-6 md:px-8">
          {loading ? (
            <LoadingState label="Loading your home feed…" />
          ) : error ? (
            <ErrorState message="Couldn't load your home feed." onRetry={load} />
          ) : (
            <>
              {/* Personalized picks lead the feed (3.10). It fetches its own
                  data so a recommendation outage can't block the home feed. */}
              <RecommendationSection onPlay={playSong} />

              <ContentSection
                title="Recently Listened Playlists"
                emptyMessage="You haven't listened to any playlists yet. Start exploring to see them here."
              >
                {(feed?.recentPlaylists ?? []).map((playlist) => (
                  <ContentCard
                    key={playlist.id}
                    title={playlist.title}
                    subtitle={`${playlist.trackCount} tracks`}
                    coverImageUrl={playlist.coverImageUrl}
                  />
                ))}
              </ContentSection>

              <ContentSection
                title="Recently Released Albums"
                emptyMessage="No new albums to show right now."
              >
                {(feed?.recentAlbums ?? []).map((album) => (
                  <ContentCard
                    key={album.id}
                    title={album.title}
                    subtitle={album.artistName}
                    coverImageUrl={album.coverImageUrl}
                    artistId={album.artistId}
                  />
                ))}
              </ContentSection>

              <ContentSection
                title="Popular Songs"
                emptyMessage="Nothing trending yet. Check back soon."
              >
                {popularSongs.map((song) => (
                  <ContentCard
                    key={song.id}
                    title={song.title}
                    subtitle={song.artistName}
                    coverImageUrl={song.coverUrl}
                    artistId={song.artistId}
                    genre={song.genre}
                    onPlay={() => playSong(song, popularSongs)}
                  />
                ))}
              </ContentSection>

              {/* Gold-exclusive content is rendered only for Gold subscribers */}
              {isGoldMember && (
                <EarlyAccessSection items={feed?.earlyAccess ?? []} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <RouteGuard>
      <HomeContent />
    </RouteGuard>
  );
}
