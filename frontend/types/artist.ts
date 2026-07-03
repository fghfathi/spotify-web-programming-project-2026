// Shared domain types for the Artist Profile Page feature.
// Kept framework-agnostic so they can later map 1:1 to Django REST responses.

export type ReleaseType = "album" | "single";

export interface ArtistRelease {
  id: string;
  title: string;
  type: ReleaseType;
  coverImageUrl?: string;
  releaseDate: string; // ISO date string
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  profileImageUrl?: string;
  isVerified: boolean; // drives the "Verified Artist" badge
  totalListeners: number; // Gold-only stat
  totalStreams: number; // Gold-only stat
  releases: ArtistRelease[]; // albums + singles combined
}