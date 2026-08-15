// Mock data for Phase 1. `ARTIST_GENRES` is still used to populate the upload
// and edit forms' genre dropdown; the track fixtures below are unused now that
// the panel reads from the API.
//
// The revenue-per-stream rate used to live here and was applied on the client.
// It now lives in the backend (`ARTIST_REVENUE_PER_STREAM` in settings.py) and
// reaches the UI only as finished revenue figures on the artist report.

import { ArtistTrack } from "@/types/artistDashboard";

export const ARTIST_GENRES: string[] = [
  "Pop",
  "Synth-pop",
  "Indie",
  "Electronic",
  "Hip-Hop",
  "R&B",
  "Rock",
  "Folk",
  "Ambient",
  "Jazz",
  "Classical",
  "Other",
];

export const mockArtistTracks: ArtistTrack[] = [
  {
    id: "trk_1",
    title: "Neon Hours",
    releaseType: "album",
    genre: "Synth-pop",
    year: 2026,
    lyrics: "Late night lights, we're running out of time...",
    collaborators: [{ id: "col_1", name: "Aviary" }],
    coverImageUrl: undefined,
    audioFileName: "neon-hours.mp3",
    audioFormat: "mp3",
    uploadedAt: "2026-06-12",
    analytics: { streams: 184_200, uniqueListeners: 52_100 },
  },
  {
    id: "trk_2",
    title: "Midnight Static",
    releaseType: "single",
    genre: "Electronic",
    year: 2026,
    lyrics: "Static in the wires, a voice I can't ignore...",
    collaborators: [],
    coverImageUrl: undefined,
    audioFileName: "midnight-static.wav",
    audioFormat: "wav",
    uploadedAt: "2026-05-01",
    analytics: { streams: 96_400, uniqueListeners: 28_900 },
  },
  {
    id: "trk_3",
    title: "Hourglass",
    releaseType: "single",
    genre: "Pop",
    year: 2025,
    lyrics: "Turning the hourglass over again...",
    collaborators: [{ id: "col_2", name: "Juno Ray" }],
    coverImageUrl: undefined,
    audioFileName: "hourglass.flac",
    audioFormat: "flac",
    uploadedAt: "2025-11-18",
    analytics: { streams: 41_050, uniqueListeners: 15_260 },
  },
];