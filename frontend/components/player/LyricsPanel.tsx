"use client";

// frontend/components/player/LyricsPanel.tsx

import { useMusicPlayer } from "@/context/MusicPlayerContext";

export default function LyricsPanel() {
  const { currentSong, isLyricsOpen, toggleLyricsPanel } = useMusicPlayer();

  if (!isLyricsOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={toggleLyricsPanel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Lyrics</h2>
          <button
            onClick={toggleLyricsPanel}
            className="text-sm text-zinc-400 hover:text-white"
          >
            Close
          </button>
        </div>

        {currentSong?.lyrics ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
            {currentSong.lyrics}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">
            Lyrics are not available for this track.
          </p>
        )}
      </div>
    </div>
  );
}
