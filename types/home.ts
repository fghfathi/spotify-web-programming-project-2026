// Shared domain types for the Home Page feature.
// Kept framework-agnostic so they can later map 1:1 to Django REST responses.

export type SubscriptionTier = "free" | "gold";

export interface User {
  id: string;
  displayName: string;
  profileImageUrl?: string; // optional -> fallback avatar is used when missing
  subscription: SubscriptionTier;
}

export interface Playlist {
  id: string;
  title: string;
  coverImageUrl?: string;
  trackCount: number;
}

export interface Album {
  id: string;
  title: string;
  artistName: string;
  coverImageUrl?: string;
  releaseDate: string; // ISO date string
}

export interface Song {
  id: string;
  title: string;
  artistName: string;
  coverImageUrl?: string;
  playsCount: number;
}

export interface EarlyAccessItem {
  id: string;
  title: string;
  artistName: string;
  coverImageUrl?: string;
  unlockDate: string; // ISO date string
}

export type NavRoute = "/playlists" | "/profile" | "/settings" | "/albums";

export interface NavItem {
  label: string;
  route: NavRoute;
  icon: "playlist" | "profile" | "settings" | "albums";
}