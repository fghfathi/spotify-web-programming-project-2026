"use client";

import { useState } from "react";
import { ManagedArtist } from "@/types/support";

interface ArtistVerificationModalProps {
  artist: ManagedArtist;
  onApprove: (artistId: string) => void;
  onReject: (artistId: string, reason: string) => void;
  onClose: () => void;
}

// 11.2.1 — details view for a single verification request: inspect
// portfolio/sample work, then Approve or Reject (with a required reason).
export default function ArtistVerificationModal({
  artist,
  onApprove,
  onReject,
  onClose,
}: ArtistVerificationModalProps) {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState("");

  const handleApprove = () => {
    onApprove(artist.id);
    onClose();
  };

  const handleConfirmReject = () => {
    if (!reason.trim()) return;
    onReject(artist.id, reason.trim());
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="artist-verification-modal-title"
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 id="artist-verification-modal-title" className="text-lg font-semibold text-white">
          {artist.name}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">{artist.email}</p>

        <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Portfolio / Sample Work
          </p>
          <p className="mt-2 text-sm text-zinc-300">{artist.portfolioSummary}</p>
        </div>

        {!showReasonInput ? (
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleApprove}
              className="flex-1 rounded-lg bg-emerald-500 py-2 font-semibold text-black hover:bg-emerald-400"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => setShowReasonInput(true)}
              className="flex-1 rounded-lg bg-red-500/90 py-2 font-semibold text-white hover:bg-red-500"
            >
              Reject
            </button>
          </div>
        ) : (
          <div className="mt-5">
            <label htmlFor="reject-reason" className="mb-2 block text-sm text-zinc-300">
              Reason for rejection
            </label>
            <textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Insufficient sample work provided"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-white"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setShowReasonInput(false)}
                className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!reason.trim()}
                className="flex-1 rounded-lg bg-red-500/90 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-zinc-800 py-2 text-sm text-zinc-400 hover:bg-zinc-800"
        >
          Close
        </button>
      </div>
    </div>
  );
}