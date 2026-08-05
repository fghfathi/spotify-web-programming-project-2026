"use client";

import Link from "next/link";

interface ContentCardProps {
  title: string;
  subtitle: string;
  coverImageUrl?: string;
  badge?: string;
  artistId?: string;
  // When provided, the card shows a play button overlay and triggers this
  // callback (wired to the music player) — Bug 2: play events reach playSong.
  onPlay?: () => void;
}

// Generic card used for playlists, albums, songs, and early-access items.
// Keeping one shared card avoids visual drift between sections.
export default function ContentCard({
  title,
  subtitle,
  coverImageUrl,
  badge,
  artistId,
  onPlay,
}: ContentCardProps) {
  return (
    <div className="group w-40 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 transition hover:border-zinc-600 hover:bg-zinc-800/80 sm:w-44">
      <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-zinc-800">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- media URLs come from the API host
          <img
            src={coverImageUrl}
            alt={title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-600">
            <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9v6l5-3-5-3Z" fill="currentColor" stroke="none" />
            </svg>
          </div>
        )}

        {badge && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-black">
            {badge}
          </span>
        )}

        {onPlay && (
          <button
            type="button"
            onClick={onPlay}
            aria-label={`Play ${title}`}
            className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-black opacity-0 shadow-lg transition group-hover:opacity-100 hover:scale-105"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7-11-7Z" />
            </svg>
          </button>
        )}
      </div>

      <p className="truncate text-sm font-medium text-white">{title}</p>
      {artistId ? (
        <Link
          href={`/artist/${artistId}`}
          className="block truncate text-xs text-zinc-400 hover:text-white hover:underline"
        >
          {subtitle}
        </Link>
      ) : (
        <p className="truncate text-xs text-zinc-400">{subtitle}</p>
      )}
    </div>
  );
}
