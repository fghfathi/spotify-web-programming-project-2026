"use client";

import { useState } from "react";
import { useSupportData } from "@/context/SupportDataContext";
import ArtistVerificationTable from "@/components/support/ArtistVerificationTable";
import ArtistVerificationModal from "@/components/support/ArtistVerificationModal";
import ArtistManagementTable from "@/components/support/ArtistManagementTable";
import DetailsModal from "@/components/support/DetailsModal";
import { ManagedArtist } from "@/types/support";

export default function ManageArtistsPage() {
  const {
    artists,
    toggleArtistBan,
    toggleArtistVerifiedFlag,
    approveArtistVerification,
    rejectArtistVerification,
  } = useSupportData();

  const [reviewingArtist, setReviewingArtist] = useState<ManagedArtist | null>(null);
  const [viewingArtist, setViewingArtist] = useState<ManagedArtist | null>(null);

  const pendingArtists = artists.filter((a) => a.verificationStatus === "pending");

  return (
    <>
      {/* 11.2.1 — Artist Verification queue */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white md:text-3xl">Artist Verification Requests</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {pendingArtists.length} pending {pendingArtists.length === 1 ? "request" : "requests"}
        </p>
      </div>
      <div className="mb-10">
        <ArtistVerificationTable artists={pendingArtists} onViewPortfolio={setReviewingArtist} />
      </div>

      {/* General artist management (ban / quick verify) */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white md:text-2xl">Manage Artists</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {artists.length} registered {artists.length === 1 ? "artist" : "artists"} ·{" "}
          {artists.filter((a) => a.verificationStatus === "verified").length} verified
        </p>
      </div>

      <ArtistManagementTable
        artists={artists}
        onToggleBan={toggleArtistBan}
        onToggleVerification={toggleArtistVerifiedFlag}
        onViewDetails={setViewingArtist}
      />

      {reviewingArtist && (
        <ArtistVerificationModal
          artist={reviewingArtist}
          onApprove={approveArtistVerification}
          onReject={rejectArtistVerification}
          onClose={() => setReviewingArtist(null)}
        />
      )}

      {viewingArtist && (
        <DetailsModal
          title={viewingArtist.name}
          subtitle={viewingArtist.email}
          fields={[
            { label: "Releases", value: String(viewingArtist.totalReleases) },
            { label: "Verification", value: viewingArtist.verificationStatus },
            { label: "Status", value: viewingArtist.status },
            { label: "Joined", value: viewingArtist.joinedDate },
            ...(viewingArtist.rejectionReason
              ? [{ label: "Rejection Reason", value: viewingArtist.rejectionReason }]
              : []),
          ]}
          onClose={() => setViewingArtist(null)}
        />
      )}
    </>
  );
}