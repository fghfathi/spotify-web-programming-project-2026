// Shared domain types for the Support & Management Portal feature.
// Kept framework-agnostic so they can later map 1:1 to Django REST responses.

export type ManagedAccountStatus = "active" | "banned";
export type ArtistVerificationStatus = "pending" | "verified" | "rejected";
export type TicketStatus = "open" | "answered" | "closed";
export type PayoutStatus = "pending" | "settled";

export interface ManagedUser {
  id: string;
  displayName: string;
  email: string;
  role: "listener" | "artist";
  joinedDate: string; // ISO date string
  status: ManagedAccountStatus;
}

export interface ManagedArtist {
  id: string;
  name: string;
  email: string;
  joinedDate: string; // ISO date string
  totalReleases: number;
  verificationStatus: ArtistVerificationStatus;
  status: ManagedAccountStatus;
  portfolioSummary: string; // mock stand-in for a real portfolio / sample-work link
  rejectionReason?: string; // populated only after a rejection
}

export interface TicketReply {
  id: string;
  authorName: string;
  authorRole: "staff" | "user";
  message: string;
  sentDate: string; // ISO date string
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  submittedByName: string;
  submittedByRole: "listener" | "artist";
  status: TicketStatus;
  createdDate: string; // ISO date string
  replies: TicketReply[];
}

export interface PlatformStats {
  totalUsers: number;
  totalArtists: number;
  activeArtists: number;
  pendingTickets: number;
}

export interface ArtistPayout {
  id: string;
  artistId: string;
  artistName: string;
  period: string; // e.g. "2026-07" — the month this payout covers
  uniqueListeners: number;
  totalStreams: number;
  rewardAmount: number; // mock-calculated in Phase 1
  payoutStatus: PayoutStatus;
}

export interface SubscriptionPrices {
  silver: number;
  gold: number;
}

export interface SubscriptionDistribution {
  free: number;
  silver: number;
  gold: number;
}