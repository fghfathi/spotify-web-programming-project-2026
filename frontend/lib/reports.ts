// Typed fetchers for the reporting (3.7) and recommendation (3.10) endpoints.
//
// Each function returns exactly what the backend computed. Deriving new
// figures from these values on the client would defeat the point of the
// reporting design — add the number to the backend report instead.

import { apiGet } from "@/lib/api";
import { toSong, ApiSong } from "@/lib/mappers";
import { AdminReport, ArtistReport, SupportReport } from "@/types/reports";
import { RecommendationItem, RecommendationResponse } from "@/types/recommendations";

/** GET /api/reports/admin/ — platform-wide report. Admin only. */
export function fetchAdminReport(): Promise<AdminReport> {
  return apiGet<AdminReport>("/reports/admin/");
}

/** GET /api/reports/support/ — moderation & ticket report. Support or admin. */
export function fetchSupportReport(): Promise<SupportReport> {
  return apiGet<SupportReport>("/reports/support/");
}

/** GET /api/reports/artist/ — the signed-in artist's own performance. */
export function fetchArtistReport(): Promise<ArtistReport> {
  return apiGet<ArtistReport>("/reports/artist/");
}

// The API nests a raw song payload inside each recommendation, so the song has
// to pass through the same mapper every other song does before the player can
// queue it.
interface RawRecommendationItem extends Omit<RecommendationItem, "song"> {
  song: ApiSong;
}
type RawRecommendationResponse = Omit<RecommendationResponse, "items"> & {
  items: RawRecommendationItem[];
};

/** GET /api/recommendations/ — songs ranked for the current user. */
export async function fetchRecommendations(
  limit = 10
): Promise<RecommendationResponse> {
  const data = await apiGet<RawRecommendationResponse>(
    `/recommendations/?limit=${limit}`
  );
  return { ...data, items: data.items.map((item) => ({ ...item, song: toSong(item.song) })) };
}
