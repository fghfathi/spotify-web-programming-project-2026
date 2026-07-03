// frontend/types/home.ts

export type SubscriptionTier = "free" | "gold";

// 1. Add UserRole to support Section 2.6 requirements
export type UserRole = "listener" | "artist" | "admin" | "support";

export interface User {
  id: string;
  displayName: string;
  profileImageUrl?: string;
  subscription: SubscriptionTier;
  role: UserRole; // Added for role-based logic (Notifications, etc.)
}

export interface Playlist {
  id: string;
  title: string;
  coverImageUrl?: string;
  trackCount: number;
  songs?: Song[]; // Added to store added songs in Phase 1
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  coverImageUrl?: string;
  releaseDate: string;
}

export interface Song {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  coverImageUrl?: string;
  playsCount: number;
}

export interface EarlyAccessItem {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  coverImageUrl?: string;
  unlockDate: string;
}

// 2. Add "/notifications" to NavRoute
export type NavRoute = "/playlists" | "/profile" | "/settings" | "/albums" | "/notifications";

// 3. Add "notifications" to icon types
export interface NavItem {
  label: string;
  route: NavRoute;
  icon: "playlist" | "profile" | "settings" | "albums" | "notifications";
}

