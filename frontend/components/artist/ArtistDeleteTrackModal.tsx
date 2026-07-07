"use client";

import { ArtistTrack } from "@/types/artistDashboard";

interface ArtistDeleteTrackModalProps {
  track: ArtistTrack;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ArtistDeleteTrackModal({
  track,
  onConfirm,
  onCancel,
}: ArtistDeleteTrackModalProps) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path
              d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-.8 12.2a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8L5 7h14Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-white">Delete this release?</h2>
        <p className="mt-2 text-sm text-zinc-400">
          &ldquo;{track.title}&rdquo; will be permanently removed from your catalog. This can&apos;t
          be undone.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-zinc-700 py-2.5 font-semibold text-white hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-500 py-2.5 font-semibold text-white hover:bg-red-400"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}