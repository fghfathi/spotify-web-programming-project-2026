"use client";

// frontend/components/player/MusicPlayer.tsx

import { useState } from "react";
import Link from "next/link";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { RepeatMode } from "@/types/player";
import { Song } from "@/types/music";
import { mockUser } from "@/data/mockHomeData";
import ProgressBar from "./ProgressBar";
import QueuePanel from "./QueuePanel";
import LyricsPanel from "./LyricsPanel";

function iconBtnClass(active: boolean) {
  return `rounded-full p-1.5 transition ${
    active ? "text-emerald-400" : "text-zinc-400 hover:text-white"
  }`;
}

function CoverThumb({ song, large = false }: { song: Song; large?: boolean }) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-md bg-zinc-800 ${
        large ? "h-full w-full" : "h-10 w-10"
      }`}
    >
      {song.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- mock data may use arbitrary external URLs
        <img
          src={song.coverUrl}
          alt={song.title}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-zinc-600">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9v6l5-3-5-3Z" fill="currentColor" stroke="none" />
          </svg>
        </div>
      )}
    </div>
  );
}

function TrackInfo({ song }: { song: Song }) {
  return (
    <div className="min-w-0">
      {song.albumId ? (
        <Link
          href={`/albums/${song.albumId}`}
          className="block truncate text-sm font-medium text-white hover:underline"
        >
          {song.title}
        </Link>
      ) : (
        <p className="truncate text-sm font-medium text-white">{song.title}</p>
      )}
      <Link
        href={`/artist/${song.artistId}`}
        className="block truncate text-xs text-zinc-400 hover:text-white hover:underline"
      >
        {song.artistName}
      </Link>
    </div>
  );
}

function ShuffleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M4 6h3.5L16 18h4M4 18h3.5L11 13M16 6h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 4l2 2-2 2M18 16l2 2-2 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M6 5h2v14H6V5Zm3.5 7L18 5v14L9.5 12Z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M16 5h2v14h-2V5ZM6 5l8.5 7L6 19V5Z" />
    </svg>
  );
}

function PlayPauseIcon({ isPlaying }: { isPlaying: boolean }) {
  return isPlaying ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M8 5v14l11-7L8 5Z" />
    </svg>
  );
}

function RepeatIcon({ mode }: { mode: RepeatMode }) {
  return (
    <span className="relative inline-flex h-4 w-4 items-center justify-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M4 7h11a4 4 0 0 1 4 4v1M20 17H9a4 4 0 0 1-4-4v-1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 4 4 7l4 3M16 20l4-3-4-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {mode === "one" && (
        <span className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 px-[3px] text-[8px] font-bold leading-tight text-black">
          1
        </span>
      )}
    </span>
  );
}

export default function MusicPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeatMode,
    isShuffled,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeatMode,
    toggleQueuePanel,
    toggleLyricsPanel,
  } = useMusicPlayer();

  const [isExpanded, setIsExpanded] = useState(false);

  // No track loaded yet: render nothing rather than an empty bar.
  if (!currentSong) return null;

  // Phase 1 mock: gold-tier perk shown next to the play count.
  // Assumes "gold" maps to mockUser.subscription, matching the rest of the
  // app (home.ts/profile.ts use subscription tiers, not a "gold" role).
  const isGoldMember = mockUser.subscription === "gold";

  return (
    <>
      {/* Desktop bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 hidden items-center gap-6 border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur md:flex">
        <div className="flex w-64 min-w-0 items-center gap-3">
          <CoverThumb song={currentSong} />
          <TrackInfo song={currentSong} />
        </div>

        <div className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleShuffle}
              aria-pressed={isShuffled}
              aria-label="Shuffle"
              className={iconBtnClass(isShuffled)}
            >
              <ShuffleIcon />
            </button>
            <button onClick={playPrevious} aria-label="Previous track" className={iconBtnClass(false)}>
              <PrevIcon />
            </button>
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="rounded-full bg-white p-2 text-black transition hover:scale-105"
            >
              <PlayPauseIcon isPlaying={isPlaying} />
            </button>
            <button onClick={playNext} aria-label="Next track" className={iconBtnClass(false)}>
              <NextIcon />
            </button>
            <button
              onClick={cycleRepeatMode}
              aria-pressed={repeatMode !== "off"}
              aria-label="Repeat"
              className={iconBtnClass(repeatMode !== "off")}
            >
              <RepeatIcon mode={repeatMode} />
            </button>
          </div>

          <ProgressBar currentTime={currentTime} duration={duration} onSeek={seek} />
        </div>

        <div className="flex w-64 items-center justify-end gap-3">
          {isGoldMember && (
            <span className="whitespace-nowrap rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
              GOLD · {currentSong.playsCount.toLocaleString()} plays
            </span>
          )}

          <button onClick={toggleLyricsPanel} className="text-xs text-zinc-400 hover:text-white">
            Lyrics
          </button>
          <button onClick={toggleQueuePanel} className="text-xs text-zinc-400 hover:text-white">
            Queue
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-24 accent-emerald-500"
            aria-label="Volume"
          />
        </div>
      </div>

      {/* Mobile mini-player, sits above the bottom nav bar */}
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed inset-x-0 bottom-16 z-30 flex w-full items-center gap-3 border-t border-zinc-800 bg-zinc-950/95 px-3 py-2 text-left backdrop-blur md:hidden"
      >
        <CoverThumb song={currentSong} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{currentSong.title}</p>
          <p className="truncate text-xs text-zinc-400">{currentSong.artistName}</p>
        </div>
        <span
          role="button"
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="shrink-0 rounded-full bg-white p-2 text-black"
        >
          <PlayPauseIcon isPlaying={isPlaying} />
        </span>
      </button>

      {/* Mobile full-screen player */}
      {isExpanded && (
        <div className="fixed inset-0 z-40 flex flex-col bg-gradient-to-b from-zinc-900 to-black p-6 md:hidden">
          <button
            onClick={() => setIsExpanded(false)}
            className="mb-6 self-start text-sm text-zinc-400 hover:text-white"
          >
            Close
          </button>

          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <div className="h-64 w-64 max-w-full overflow-hidden rounded-xl bg-zinc-800">
              <CoverThumb song={currentSong} large />
            </div>

            <TrackInfo song={currentSong} />

            {isGoldMember && (
              <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                GOLD · {currentSong.playsCount.toLocaleString()} plays
              </span>
            )}

            <div className="w-full max-w-sm">
              <ProgressBar currentTime={currentTime} duration={duration} onSeek={seek} />
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={toggleShuffle}
                aria-pressed={isShuffled}
                aria-label="Shuffle"
                className={iconBtnClass(isShuffled)}
              >
                <ShuffleIcon />
              </button>
              <button onClick={playPrevious} aria-label="Previous track" className={iconBtnClass(false)}>
                <PrevIcon />
              </button>
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="rounded-full bg-white p-4 text-black"
              >
                <PlayPauseIcon isPlaying={isPlaying} />
              </button>
              <button onClick={playNext} aria-label="Next track" className={iconBtnClass(false)}>
                <NextIcon />
              </button>
              <button
                onClick={cycleRepeatMode}
                aria-pressed={repeatMode !== "off"}
                aria-label="Repeat"
                className={iconBtnClass(repeatMode !== "off")}
              >
                <RepeatIcon mode={repeatMode} />
              </button>
            </div>

            <div className="flex w-full max-w-sm items-center justify-center gap-3">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-emerald-500"
                aria-label="Volume"
              />
            </div>

            <div className="flex w-full max-w-sm items-center justify-center gap-4">
              <button onClick={toggleLyricsPanel} className="text-sm text-zinc-400 hover:text-white">
                Lyrics
              </button>
              <button onClick={toggleQueuePanel} className="text-sm text-zinc-400 hover:text-white">
                Queue
              </button>
            </div>
          </div>
        </div>
      )}

      <QueuePanel />
      <LyricsPanel />
    </>
  );
}
