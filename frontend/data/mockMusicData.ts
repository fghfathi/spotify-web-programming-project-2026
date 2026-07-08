// frontend/data/mockMusicData.ts
import { Song, Album, Artist } from "@/types/music";

export const mockArtists: Artist[] = [
  {
    id: "art_1",
    name: "Marlow",
    bio: "Electronic music producer from Berlin specializing in synth-wave and deep house.",
    avatarUrl: undefined,
    followersCount: 45200,
  },
  {
    id: "art_2",
    name: "Aviary",
    bio: "Indie pop singer-songwriter known for atmospheric acoustics and vocal loops.",
    avatarUrl: undefined,
    followersCount: 38100,
  },
  {
    id: "art_3",
    name: "Ren Vale",
    bio: "Ambient cinematic composer creating vast auditory landscapes for modern minds.",
    avatarUrl: undefined,
    followersCount: 12400,
  },
];

export const mockSongs: Song[] = [
  {
    id: "sg_1",
    title: "Midnight Static",
    artistId: "art_1",
    artistName: "Marlow",
    playsCount: 184200,
    albumId: "al_1",
    albumName: "Neon Hours",
    releaseDate: "2026-06-12",
    duration: "3:45",
  },
  {
    id: "sg_2",
    title: "Open Roads",
    artistId: "art_2",
    artistName: "Aviary",
    playsCount: 152900,
    albumId: "al_2",
    albumName: "Static Bloom",
    releaseDate: "2026-06-20",
    duration: "4:12",
  },
  {
    id: "song_1",
    title: "Slow Burn",
    artistId: "art_ren_vale",
    artistName: "Ren Vale o",
    playsCount: 12000,
    releaseDate: "2026-06-25",
    coverUrl: "images/cover-slow-burn.jpg",
    duration: "3:12",
    audioUrl: "/audio/test-track.mp3", // <-- add this
  },
  {
    id: "sg_4",
    title: "Paper Moon",
    artistId: "art_2",
    artistName: "Aviary",
    playsCount: 98700,
    releaseDate: "2026-05-18", // Standalone Single
    duration: "3:10",
  },
  {
    id: "sg_5",
    title: "City Echoes",
    artistId: "art_1",
    artistName: "Marlow",
    playsCount: 220100,
    albumId: "al_1",
    albumName: "Neon Hours",
    releaseDate: "2026-06-12",
    duration: "3:22",
  },
];

export const mockAlbums: Album[] = [
  {
    id: "al_1",
    title: "Neon Hours",
    artistId: "art_1",
    artistName: "Marlow",
    releaseDate: "2026-06-12",
    songs: [
      {
        id: "sg_1",
        title: "Midnight Static",
        artistId: "art_1",
        artistName: "Marlow",
        playsCount: 184200,
        albumId: "al_1",
        albumName: "Neon Hours",
        releaseDate: "2026-06-12",
        duration: "3:45",
      },
      {
        id: "sg_5",
        title: "City Echoes",
        artistId: "art_1",
        artistName: "Marlow",
        playsCount: 220100,
        albumId: "al_1",
        albumName: "Neon Hours",
        releaseDate: "2026-06-12",
        duration: "3:22",
      },
    ],
  },
  {
    id: "al_2",
    title: "Static Bloom",
    artistId: "art_2",
    artistName: "Aviary",
    releaseDate: "2026-06-20",
    songs: [
      {
        id: "sg_2",
        title: "Open Roads",
        artistId: "art_2",
        artistName: "Aviary",
        playsCount: 152900,
        albumId: "al_2",
        albumName: "Static Bloom",
        releaseDate: "2026-06-20",
        duration: "4:12",
      },
    ],
  },
  {
    id: "al_3",
    title: "Glass City",
    artistId: "art_3",
    artistName: "Ren Vale",
    releaseDate: "2026-06-25",
    songs: [
      // {
      //   id: "sg_3",
      //   title: "Slow Burn",
      //   artistId: "art_3",
      //   artistName: "Ren Vale",
      //   playsCount: 121400,
      //   albumId: "al_3",
      //   albumName: "Glass City",
      //   releaseDate: "2026-06-25",
      //   duration: "5:30",
      // },
      {
        id: "song_1",
        title: "Slow Burn",
        artistId: "art_ren_vale",
        artistName: "Ren Vale o",
        playsCount: 12000,
        releaseDate: "2026-06-25",
        coverUrl: "...",
        duration: "3:12",
        audioUrl: "/audio/test-track.mp3", // <-- add this
      },
    ],
  },
];
