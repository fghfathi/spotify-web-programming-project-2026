// frontend/types/music.ts

export interface Song {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  playsCount: number;
  listenersCount?: number; // unique users who have played this track
  albumId?: string;
  albumName?: string;
  releaseDate: string;
  coverUrl?: string;
  duration?: string;
  genre?: string; // Track genre from the API (SongSerializer). Optional so songs without a genre still render.
  audioUrl?: string; // Added for Phase 1.2.9: source for the <audio> element. Optional so existing mock songs without audio still render in lists.
  lyrics?: string; // Added for Phase 1.2.9: plain-text lyrics shown in the player's Lyrics panel when available.
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  releaseDate: string;
  coverUrl?: string;
  songs: Song[];
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  avatarUrl?: string;
  followersCount: number;
}

export interface Playlist {
  id: string;
  title: string;
  trackCount: number;
  songs: Song[];
}
