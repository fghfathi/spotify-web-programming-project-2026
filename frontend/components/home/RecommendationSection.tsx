"use client";

// "Made For You" — the recommendation system's surface on the home page (3.10).
//
// The backend ranks the catalog and returns each song with the reason it was
// chosen. This component only renders that: it never scores or re-sorts. Every
// card shows its justification so a suggestion can always be traced back to
// something the listener actually did.

import { useCallback, useEffect, useState } from "react";
import ContentCard from "@/components/home/ContentCard";
import { fetchRecommendations } from "@/lib/reports";
import { RecommendationResponse } from "@/types/recommendations";
import { Song } from "@/types/music";

interface RecommendationSectionProps {
  /** Wired to the music player, so a recommendation is one click from playing. */
  onPlay: (song: Song, queue: Song[]) => void;
  limit?: number;
}

export default function RecommendationSection({
  onPlay,
  limit = 10,
}: RecommendationSectionProps) {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setData(await fetchRecommendations(limit));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  // A recommendation failure should never take the home feed down with it.
  if (failed) return null;

  const items = data?.items ?? [];
  const queue = items.map((item) => item.song);

  const subtitle =
    data?.strategy === "cold-start"
      ? "Trending on Shpotify — play a few songs and this will tune to your taste."
      : `Picked from the ${data?.basedOnPlays ?? 0} songs you've played, plus listeners with similar taste.`;

  return (
    <section className="mb-8" aria-label="Made For You">
      <div className="mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-white md:text-xl">Made For You</h2>
          {data && (
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
              {data.strategy === "cold-start" ? "Getting to know you" : "Personalized"}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden pb-2" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-64 w-40 shrink-0 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/70 sm:w-44"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
          Nothing to recommend yet. Play a few songs and check back.
        </p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {items.map((item) => (
            <ContentCard
              key={item.song.id}
              title={item.song.title}
              subtitle={item.song.artistName}
              coverImageUrl={item.song.coverUrl}
              artistId={item.song.artistId}
              genre={item.song.genre}
              footnote={item.reason}
              onPlay={() => onPlay(item.song, queue)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
