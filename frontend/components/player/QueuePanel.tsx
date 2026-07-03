"use client";

// frontend/components/player/QueuePanel.tsx

import { useMusicPlayer } from "@/context/MusicPlayerContext";

export default function QueuePanel() {
  const { queue, currentIndex, isQueueOpen, toggleQueuePanel, removeFromQueue, playSong } =
    useMusicPlayer();

  if (!isQueueOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60"
      onClick={toggleQueuePanel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-sm flex-col border-l border-zinc-800 bg-zinc-950 p-4"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Queue</h2>
          <button
            onClick={toggleQueuePanel}
            className="text-sm text-zinc-400 hover:text-white"
          >
            Close
          </button>
        </div>

        {queue.length === 0 ? (
          <p className="text-sm text-zinc-500">Your queue is empty.</p>
        ) : (
          <ul className="flex-1 space-y-1 overflow-y-auto">
            {queue.map((song, index) => (
              <li
                key={`${song.id}-${index}`}
                className={`flex items-center justify-between gap-3 rounded-lg px-2 py-2 ${
                  index === currentIndex
                    ? "bg-emerald-500/10"
                    : "hover:bg-zinc-900"
                }`}
              >
                <button
                  onClick={() => playSong(song, queue)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p
                    className={`truncate text-sm ${
                      index === currentIndex ? "text-emerald-400" : "text-white"
                    }`}
                  >
                    {song.title}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {song.artistName}
                  </p>
                </button>

                <button
                  onClick={() => removeFromQueue(song.id)}
                  aria-label={`Remove ${song.title} from queue`}
                  className="shrink-0 text-xs text-zinc-500 hover:text-red-400"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
