// frontend/types/music.ts

export interface Song {
    id: string;
    title: string;
    artistId: string;
    artistName: string;
    playsCount: number;
    albumId?: string;
    albumName?: string;
    releaseDate: string;
    coverUrl?: string;
    duration?: string;
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
  