// Mock data for Phase 1. No backend calls — this file is the single source
// of truth for Home Page content until the Django API is wired up.

import {
    Album,
    EarlyAccessItem,
    NavItem,
    Playlist,
    Song,
    User,
  } from "@/types/home";
  
  export const mockUser: User = {
    id: "u_001",
    displayName: "Alex Rivera",
    profileImageUrl: undefined, // intentionally missing to demo fallback avatar
    subscription: "gold",
  };
  
  export const mockRecentPlaylists: Playlist[] = [
    { id: "pl_1", title: "Late Night Drive", trackCount: 18 },
    { id: "pl_2", title: "Focus Flow", trackCount: 24 },
    { id: "pl_3", title: "Throwback Hits", trackCount: 32 },
    { id: "pl_4", title: "Chill Acoustic", trackCount: 15 },
  ];
  
  export const mockRecentAlbums: Album[] = [
    {
      id: "al_1",
      title: "Neon Hours",
      artistId: "art_1",
      artistName: "Marlow",
      releaseDate: "2026-06-12",
    },
    {
      id: "al_2",
      title: "Static Bloom",
      artistId: "art_2",
      artistName: "Aviary",
      releaseDate: "2026-06-20",
    },
    {
      id: "al_3",
      title: "Glass City",
      artistId: "art_3",
      artistName: "Ren Vale",
      releaseDate: "2026-06-25",
    },
  ];
  
  export const mockPopularSongs: Song[] = [
    { id: "sg_1", title: "Midnight Static", artistId: "art_1", artistName: "Marlow", playsCount: 184_200 },
    { id: "sg_2", title: "Open Roads", artistId: "art_2", artistName: "Aviary", playsCount: 152_900 },
    { id: "sg_3", title: "Slow Burn", artistId: "art_3", artistName: "Ren Vale", playsCount: 121_400 },
    { id: "sg_4", title: "Paper Moon", artistId: "art_4", artistName: "Juno Ray", playsCount: 98_700 },
  ];
  
  export const mockEarlyAccess: EarlyAccessItem[] = [
    {
      id: "ea_1",
      title: "Hourglass (Unreleased)",
      artistId: "art_1",
      artistName: "Marlow",
      unlockDate: "2026-07-04",
    },
    {
      id: "ea_2",
      title: "Drift",
      artistId: "art_2",
      artistName: "Aviary",
      unlockDate: "2026-07-08",
    },
  ];
  
  export const sidebarNavItems: NavItem[] = [
    { label: "Playlists", route: "/playlists", icon: "playlist" },
    { label: "Profile", route: "/profile", icon: "profile" },
    { label: "Settings", route: "/settings", icon: "settings" },
    { label: "Albums & Singles", route: "/albums", icon: "albums" },
  ];