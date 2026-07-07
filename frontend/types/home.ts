// Shared domain types for the Home Page feature.
// Kept framework-agnostic so they can later map 1:1 to Django REST responses.

export type SubscriptionTier = "free" | "gold";
export type UserRole = "listener" | "artist" | "support" | "admin";

export interface User {
  id: string;
  displayName: string;
  profileImageUrl?: string; // optional -> fallback avatar is used when missing
  subscription: SubscriptionTier;
  role: UserRole; // drives which nav items (e.g. Artist Panel) are visible
}

export interface Song {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  coverImageUrl?: string;
  playsCount: number;
}

export interface Playlist {
  id: string;
  title: string;
  coverImageUrl?: string;
  trackCount: number;
  songs?: Song[]; // optional -> only populated for playlists with tracks already added
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  coverImageUrl?: string;
  releaseDate: string; // ISO date string
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
  unlockDate: string; // ISO date string
}

export type NavRoute =
  | "/playlists"
  | "/profile"
  | "/settings"
  | "/albums"
  | "/notifications"
  | "/artist/dashboard"
  | "/support/users"
  | "/support/artists"
  | "/support/tickets"
  | "/support/stats"
  | "/support/finance"
  | "/support/subscriptions";

export interface NavItem {
    label: string;
    route: NavRoute;
    icon:
      | "playlist"
      | "profile"
      | "settings"
      | "albums"
      | "notifications"
      | "artist"
      | "manageUsers"
      | "manageArtists"
      | "tickets"
      | "stats"
      | "finance"
      | "subscriptions";
    roles?: UserRole[];
}

