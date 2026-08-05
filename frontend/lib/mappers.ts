// Small adapters that normalize API payloads into the frontend domain types.
// The backend returns most nested ids as strings already; the top-level `id`
// on songs/albums is numeric, so we coerce it to a string to match the
// music player's Song type (types/music.ts).

import { Song } from "@/types/music";

// The raw song shape as returned by the API (both coverUrl and coverImageUrl
// are present; ids may be numbers).
export interface ApiSong {
  id: number | string;
  title: string;
  artistId: string;
  artistName: string;
  albumId?: string | null;
  albumName?: string | null;
  playsCount: number;
  releaseDate: string;
  coverUrl?: string | null;
  coverImageUrl?: string | null;
  audioUrl?: string | null;
  duration?: string;
  lyrics?: string;
  is_early_access?: boolean;
}

export function toSong(api: ApiSong): Song {
  return {
    id: String(api.id),
    title: api.title,
    artistId: api.artistId,
    artistName: api.artistName,
    playsCount: api.playsCount,
    albumId: api.albumId ?? undefined,
    albumName: api.albumName ?? undefined,
    releaseDate: api.releaseDate,
    coverUrl: api.coverUrl ?? api.coverImageUrl ?? undefined,
    duration: api.duration,
    audioUrl: api.audioUrl ?? undefined,
    lyrics: api.lyrics,
  };
}

export function toSongs(list: ApiSong[]): Song[] {
  return list.map(toSong);
}
