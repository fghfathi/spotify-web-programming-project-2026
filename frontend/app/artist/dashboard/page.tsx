"use client";

import { useMemo, useState } from "react";
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
import { mockUser, sidebarNavItems } from "@/data/mockHomeData";
import { mockArtistTracks, REVENUE_PER_STREAM } from "@/data/mockArtistDashboardData";
import { ArtistTrack } from "@/types/artistDashboard";

type DashboardTab = "overview" | "tracks" | "upload";

// Phase 1: this dashboard is client-rendered with local state seeded from
// mock data. Replace the initial state + handlers with real API calls
// (Django REST endpoints for upload/edit/delete) once the backend phase
// begins — the component tree below does not need to change.
export default function ArtistDashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [tracks, setTracks] = useState<ArtistTrack[]>(mockArtistTracks);
  const [editingTrack, setEditingTrack] = useState<ArtistTrack | null>(null);
  const [deletingTrack, setDeletingTrack] = useState<ArtistTrack | null>(null);

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

  const handleAddTrack = (track: ArtistTrack) => {
    setTracks((prev) => [track, ...prev]);
  };

  const handleSaveEdit = (updated: ArtistTrack) => {
    setTracks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setEditingTrack(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingTrack) return;
    setTracks((prev) => prev.filter((t) => t.id !== deletingTrack.id));
    setDeletingTrack(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-black md:flex-row">
      <Sidebar navItems={sidebarNavItems} />

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <TopBar user={mockUser} />

        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mb-6 flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              Artist Management Panel
            </h1>
            <VerifiedBadge />
          </div>

          <ArtistDashboardTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === "overview" && (
            <>
              <ArtistDashboardSummaryCards summary={summary} />
              <h2 className="mb-3 text-lg font-semibold text-white md:text-xl">
                Track Performance
              </h2>
              <ArtistAnalyticsTable tracks={tracks} />
            </>
          )}

          {activeTab === "tracks" && (
            <ArtistTrackList
              tracks={tracks}
              onEdit={setEditingTrack}
              onDeleteRequest={setDeletingTrack}
            />
          )}

          {activeTab === "upload" && <ArtistUploadForm onSubmit={handleAddTrack} />}
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