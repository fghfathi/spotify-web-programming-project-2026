"use client";

// Artist Management Panel — backed by the API (Bug 1 + Step 4).
// Tracks are fetched from /api/me/tracks/; uploads, edits and deletes hit the
// artist-owned catalog endpoints. Restricted to artist accounts via RouteGuard.
//
// Reporting (3.7): the Overview tab's summary cards and per-track performance
// table come from GET /api/reports/artist/. The page used to `reduce()` the
// track list for totals and multiply streams by a hardcoded revenue rate; both
// now happen in the database. Notably, total unique listeners is a distinct
// count across the whole catalog, which a client-side sum could never produce.

import { useCallback, useEffect, useState } from "react";
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
import { ArtistTrack, AudioFormat } from "@/types/artistDashboard";
import { ArtistReport } from "@/types/reports";
import { User } from "@/types/home";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPatch, apiDelete, unwrapList } from "@/lib/api";
import { fetchArtistReport } from "@/lib/reports";
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
  const [report, setReport] = useState<ArtistReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editingTrack, setEditingTrack] = useState<ArtistTrack | null>(null);
  const [deletingTrack, setDeletingTrack] = useState<ArtistTrack | null>(null);

  // The track list drives the editable Tracks tab; the report drives Overview.
  // Uploading, editing or deleting a track changes both, so they reload together.
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [data, artistReport] = await Promise.all([
        apiGet<unknown>("/me/tracks/"),
        fetchArtistReport(),
      ]);
      setTracks(unwrapList<ApiSong>(data).map(toArtistTrack));
      setReport(artistReport);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

        <main
          className="flex-1 px-4 py-6 md:px-8"
          // Reserve space for the fixed music player so the "Publish Release"
          // button (and other bottom content) stays visible and clickable above
          // it. Collapses to the normal py-6 bottom padding when no track plays.
          style={{ paddingBottom: "calc(1.5rem + var(--player-height, 0px))" }}
        >
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
          ) : error || !report ? (
            <ErrorState message="Couldn't load your tracks." onRetry={load} />
          ) : activeTab === "overview" ? (
            <>
              <ArtistDashboardSummaryCards
                summary={report.summary}
                currency={report.currency}
              />
              <h2 className="mb-3 text-lg font-semibold text-white md:text-xl">
                Track Performance
              </h2>
              <ArtistAnalyticsTable
                tracks={report.tracks}
                currency={report.currency}
              />
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
