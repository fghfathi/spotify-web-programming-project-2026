"use client";

// Artist Management Panel — backed by the API (Bug 1 + Step 4).
// Tracks are fetched from /api/me/tracks/; uploads, edits and deletes hit the
// artist-owned catalog endpoints. Restricted to artist accounts via RouteGuard.

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/home/Sidebar";
import TopBar from "@/components/home/TopBar";
import VerifiedBadge from "@/components/artist/VerifiedBadge";
import ArtistDashboardTabs from "@/components/artist/ArtistDashboardTabs";
import ArtistDashboardSummaryCards from "@/components/artist/ArtistDashboardSummaryCards";
import ArtistAnalyticsTable from "@/components/artist/ArtistAnalyticsTable";
import ArtistTrackList from "@/components/artist/ArtistTrackList";
import ArtistUploadForm from "@/components/artist/ArtistUploadForm";
import ArtistEditTrackModal from "@/components/artist/ArtistEditTrackModal";
import ArtistDeleteTrackModal from "@/components/artist/ArtistDeleteTrackModal";
import RouteGuard from "@/components/shared/RouteGuard";
import { LoadingState, ErrorState } from "@/components/shared/UIStates";
import { sidebarNavItems } from "@/data/mockHomeData";
import { REVENUE_PER_STREAM } from "@/data/mockArtistDashboardData";
import { ArtistTrack, AudioFormat } from "@/types/artistDashboard";
import { User } from "@/types/home";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPatch, apiDelete, unwrapList } from "@/lib/api";
import { ApiSong } from "@/lib/mappers";

type DashboardTab = "overview" | "tracks" | "upload";

// Map an API song into the dashboard's ArtistTrack display shape.
function toArtistTrack(s: ApiSong & { releaseType?: string; genre?: string }): ArtistTrack {
  const fileName = (s.audioUrl ?? "").split("/").pop() ?? "";
  const ext = (fileName.split(".").pop() ?? "mp3").toLowerCase();
  return {
    id: String(s.id),
    title: s.title,
    releaseType: s.releaseType === "album" ? "album" : "single",
    genre: s.genre ?? "",
    year: Number((s.releaseDate ?? "").slice(0, 4)) || new Date().getFullYear(),
    lyrics: s.lyrics ?? "",
    collaborators: [],
    coverImageUrl: s.coverImageUrl ?? undefined,
    audioFileName: fileName,
    audioFormat: ext as AudioFormat,
    uploadedAt: (s.releaseDate ?? "").slice(0, 10),
    analytics: { streams: s.playsCount ?? 0, uniqueListeners: 0 },
  };
}

function DashboardContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [tracks, setTracks] = useState<ArtistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editingTrack, setEditingTrack] = useState<ArtistTrack | null>(null);
  const [deletingTrack, setDeletingTrack] = useState<ArtistTrack | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiGet<unknown>("/me/tracks/");
      setTracks(unwrapList<ApiSong>(data).map(toArtistTrack));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const totalStreams = tracks.reduce((sum, t) => sum + t.analytics.streams, 0);
    const totalUniqueListeners = tracks.reduce(
      (sum, t) => sum + t.analytics.uniqueListeners,
      0
    );
    return {
      totalStreams,
      totalUniqueListeners,
      totalRevenue: totalStreams * REVENUE_PER_STREAM,
      trackCount: tracks.length,
    };
  }, [tracks]);

  const handleSaveEdit = async (updated: ArtistTrack) => {
    try {
      await apiPatch(`/me/tracks/${Number(updated.id)}/`, {
        title: updated.title,
        genre: updated.genre,
        lyrics: updated.lyrics,
        release_date: `${updated.year}-01-01`,
      });
      await load();
    } finally {
      setEditingTrack(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTrack) return;
    try {
      await apiDelete(`/me/tracks/${Number(deletingTrack.id)}/`);
      await load();
    } finally {
      setDeletingTrack(null);
    }
  };

  const topBarUser: User = {
    id: String(user?.id ?? ""),
    displayName: user?.displayName ?? "",
    profileImageUrl: user?.profileImageUrl ?? undefined,
    subscription: user?.subscription === "gold" ? "gold" : "free",
    role: user?.role ?? "artist",
  };

  return (
    <div className="flex min-h-screen flex-col bg-black md:flex-row">
      <Sidebar navItems={sidebarNavItems} />

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <TopBar user={topBarUser} />

        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mb-6 flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              Artist Management Panel
            </h1>
            {user?.isVerified && <VerifiedBadge />}
          </div>

          <ArtistDashboardTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === "upload" ? (
            <ArtistUploadForm onUploaded={load} />
          ) : loading ? (
            <LoadingState label="Loading your catalog…" />
          ) : error ? (
            <ErrorState message="Couldn't load your tracks." onRetry={load} />
          ) : activeTab === "overview" ? (
            <>
              <ArtistDashboardSummaryCards summary={summary} />
              <h2 className="mb-3 text-lg font-semibold text-white md:text-xl">
                Track Performance
              </h2>
              <ArtistAnalyticsTable tracks={tracks} />
            </>
          ) : (
            <ArtistTrackList
              tracks={tracks}
              onEdit={setEditingTrack}
              onDeleteRequest={setDeletingTrack}
            />
          )}
        </main>
      </div>

      {editingTrack && (
        <ArtistEditTrackModal
          track={editingTrack}
          onSave={handleSaveEdit}
          onClose={() => setEditingTrack(null)}
        />
      )}

      {deletingTrack && (
        <ArtistDeleteTrackModal
          track={deletingTrack}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTrack(null)}
        />
      )}
    </div>
  );
}

export default function ArtistDashboardPage() {
  return (
    <RouteGuard roles={["artist"]}>
      <DashboardContent />
    </RouteGuard>
  );
}
