// Shared domain types for the Artist Work Management Panel feature.
// Kept framework-agnostic so they can later map 1:1 to Django REST responses.

export type ReleaseType = "single" | "album";
export type AudioFormat = "mp3" | "wav" | "flac";

export interface Collaborator {
  id: string;
  name: string;
}

export interface TrackAnalytics {
  streams: number;
  uniqueListeners: number;
}

export interface ArtistTrack {
  id: string;
  title: string;
  releaseType: ReleaseType;
  genre: string;
  year: number;
  lyrics: string;
  collaborators: Collaborator[];
  coverImageUrl?: string;
  audioFileName: string;
  audioFormat: AudioFormat;
  uploadedAt: string; // ISO date string
  analytics: TrackAnalytics;
}

export interface ArtistDashboardSummary {
  totalStreams: number;
  totalUniqueListeners: number;
  totalRevenue: number;
  trackCount: number;
}