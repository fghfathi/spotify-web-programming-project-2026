// Recommendation contracts (part 3.10), mirroring
// `backend/apps/recommendations/engine.py`.
//
// The backend ranks the catalog and hands back finished songs, each with the
// reason it was chosen. The frontend never scores or re-sorts.

import { Song } from "@/types/music";

/** How much each signal contributed to this song's score, all in [0, 1]. */
export interface RecommendationBreakdown {
  genreAffinity: number;
  collaborative: number;
  artistAffinity: number;
  popularity: number;
}

export interface RecommendationItem {
  song: Song;
  /** Human-readable justification, e.g. "Because you often listen to Indie". */
  reason: string;
  /** Weighted score in [0, 1]. Items arrive already sorted by this, descending. */
  matchScore: number;
  breakdown: RecommendationBreakdown;
}

export interface RecommendationResponse {
  /** "hybrid" once the user has listening history; "cold-start" before that. */
  strategy: "hybrid" | "cold-start";
  /** How many distinct songs the user has played — the evidence behind the picks. */
  basedOnPlays: number;
  weights: RecommendationBreakdown;
  count: number;
  items: RecommendationItem[];
}
