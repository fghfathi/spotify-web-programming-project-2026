// Report contracts (part 3.7), mirroring `backend/apps/reports/services.py`.
//
// Every field below is a value the backend has already computed. The frontend
// is a display layer for these reports: it must not sum, average, or derive a
// percentage from them. If a page needs a new number, add it to the backend
// report rather than calculating it here.

import { RevenueMetric } from "@/types/analytics";

// --- Admin report ---------------------------------------------------------
export interface AdminUserStats {
  totalUsers: number;
  totalListeners: number;
  totalArtists: number;
  activeArtists: number;
  bannedUsers: number;
  newUsersLast30Days: number;
}

export interface AdminContentStats {
  totalSongs: number;
  totalAlbums: number;
  totalPlaylists: number;
  earlyAccessSongs: number;
  newSongsLast30Days: number;
}

export interface AdminPlayStats {
  totalPlays: number;
  uniqueListeners: number;
  playsLast30Days: number;
}

export interface AdminRevenueStats {
  totalRevenue: number;
  revenueThisMonth: number;
  revenuePreviousMonth: number;
  revenueChangePct: number;
  monthlyRecurringRevenue: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayouts: number;
}

export interface SubscriptionDistributionCounts {
  free: number;
  silver: number;
  gold: number;
}

export interface AdminSubscriptionStats {
  activeSubscriptions: number;
  payingUsers: number;
  freeUsers: number;
  distribution: SubscriptionDistributionCounts;
}

export interface TicketStats {
  totalTickets: number;
  openTickets: number;
  answeredTickets: number;
  resolvedTickets: number;
  unresolvedTickets: number;
  /** Alias of `unresolvedTickets`, kept for the existing stat cards. */
  pendingTickets: number;
  resolutionRatePct: number;
}

/** One slice of the tier donut. `sharePct` arrives precomputed. */
export interface ReportTierSlice {
  key: "basic" | "silver" | "gold";
  label: string;
  labelFa: string;
  users: number;
  sharePct: number;
}

export interface ReportAnalytics {
  currency: string;
  periodLabel: string;
  distribution: ReportTierSlice[];
  metrics: RevenueMetric[];
}

export interface RevenueTrendPoint {
  month: string; // "YYYY-MM"
  revenue: number;
  payments: number;
}

export interface TopArtistRow {
  id: string;
  name: string;
  streams: number;
  uniqueListeners: number;
  revenue: number;
}

export interface TopSongRow {
  id: string;
  title: string;
  artistName: string;
  genre: string;
  plays: number;
}

export interface AdminReport {
  currency: string;
  periodLabel: string;
  generatedAt: string;
  users: AdminUserStats;
  content: AdminContentStats;
  plays: AdminPlayStats;
  revenue: AdminRevenueStats;
  subscriptions: AdminSubscriptionStats;
  tickets: TicketStats;
  analytics: ReportAnalytics;
  revenueTrend: RevenueTrendPoint[];
  topArtists: TopArtistRow[];
  topSongs: TopSongRow[];
}

// --- Support report -------------------------------------------------------
// A superset of the legacy PlatformStats shape.
export interface SupportReport extends TicketStats {
  generatedAt: string;
  totalUsers: number;
  totalArtists: number;
  activeArtists: number;
  bannedUsers: number;
  pendingVerifications: number;
  verifiedArtists: number;
  rejectedArtists: number;
  ticketsLast7Days: number;
}

// --- Artist report --------------------------------------------------------
export interface ArtistReportSummary {
  trackCount: number;
  albumCount: number;
  totalStreams: number;
  /** Distinct people across the whole catalog — not a sum of per-track values. */
  totalUniqueListeners: number;
  streamsLast30Days: number;
  totalRevenue: number;
  followerCount: number;
}

export interface ArtistTrackReportRow {
  id: string;
  title: string;
  genre: string;
  releaseType: "album" | "single";
  year: number;
  streams: number;
  uniqueListeners: number;
  /** Already multiplied by the platform's revenue-per-stream rate. */
  revenue: number;
}

export interface ArtistMonthlyStreams {
  month: string; // "YYYY-MM"
  streams: number;
  uniqueListeners: number;
}

export interface ArtistGenreRow {
  genre: string;
  streams: number;
  sharePct: number;
}

export interface ArtistReport {
  currency: string;
  generatedAt: string;
  revenuePerStream: number;
  summary: ArtistReportSummary;
  payouts: { pendingAmount: number; settledAmount: number };
  tracks: ArtistTrackReportRow[];
  topTracks: ArtistTrackReportRow[];
  monthlyStreams: ArtistMonthlyStreams[];
  genreBreakdown: ArtistGenreRow[];
}
