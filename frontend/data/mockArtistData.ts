// Mock data for Phase 1. No backend calls — this file is the single source
// of truth for the Artist Profile Page until the Django API is wired up.

import { Artist } from "@/types/artist";

export const mockArtists: Record<string, Artist> = {
  art_1: {
    id: "art_1",
    name: "Marlow",
    bio: "Bedroom-pop producer turned full-band act, known for blending analog synths with late-night storytelling. Based out of a converted garage studio.",
    profileImageUrl: undefined,
    isVerified: true,
    totalListeners: 482_300,
    totalStreams: 12_384_920,
    releases: [
      { id: "rl_1", title: "Neon Hours", type: "album", releaseDate: "2026-06-12" },
      { id: "rl_2", title: "Midnight Static", type: "single", releaseDate: "2026-05-01" },
      { id: "rl_3", title: "Hourglass", type: "single", releaseDate: "2026-03-18" },
    ],
  },
  art_2: {
    id: "art_2",
    name: "Aviary",
    bio: "Electronic duo exploring the space between ambient textures and dancefloor-ready percussion.",
    profileImageUrl: undefined,
    isVerified: false,
    totalListeners: 96_150,
    totalStreams: 1_204_760,
    releases: [
      { id: "rl_4", title: "Static Bloom", type: "album", releaseDate: "2026-06-20" },
      { id: "rl_5", title: "Open Roads", type: "single", releaseDate: "2026-04-02" },
    ],
  },
  art_3: {
    id: "art_3",
    name: "Ren Vale",
    bio: "Singer-songwriter with a folk-leaning sound, drawing on road-trip imagery and slow-burning arrangements.",
    profileImageUrl: undefined,
    isVerified: true,
    totalListeners: 214_600,
    totalStreams: 5_732_410,
    releases: [
      { id: "rl_6", title: "Glass City", type: "album", releaseDate: "2026-06-25" },
      { id: "rl_7", title: "Slow Burn", type: "single", releaseDate: "2026-05-15" },
    ],
  },
  art_4: {
    id: "art_4",
    name: "Juno Ray",
    bio: "Pop vocalist blending airy hooks with understated production, best known for late-night radio staples.",
    profileImageUrl: undefined,
    isVerified: false,
    totalListeners: 58_940,
    totalStreams: 812_330,
    releases: [
      { id: "rl_8", title: "Paper Moon", type: "single", releaseDate: "2026-04-28" },
    ],
  },
};

// Phase 1 mock of "does the current user already follow this artist".
// Phase 2: replace with the current user's real follow list from the API.
export const mockFollowedArtistIds: string[] = ["art_2"];