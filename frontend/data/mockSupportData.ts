// Mock data for Phase 1. No backend calls — this file is the single source
// of truth for Support & Management Portal content until the Django API is
// wired up.

import { User } from "@/types/home";
import {
  ArtistPayout,
  ManagedArtist,
  ManagedUser,
  PlatformStats,
  SubscriptionDistribution,
  SubscriptionPrices,
  SupportTicket,
} from "@/types/support";


// The staff member "logged in" to the portal for Phase 1. Swap this for the
// authenticated session user once real auth is wired up. Change role to
// "admin" to verify admin-only sections (Finance settlement action,
// Subscription Settings page) become visible/enabled.

import { ACTIVE_ROLE } from "@/data/mockHomeData";

export const mockCurrentStaffUser: User = {
  id: "staff_1",
  displayName: "Jordan Blake",
  subscription: "free",
  role: ACTIVE_ROLE, 
};


export const mockManagedUsers: ManagedUser[] = [
  { id: "u_101", displayName: "Alex Rivera", email: "alex.rivera@mail.com", role: "listener", joinedDate: "2026-01-14", status: "active" },
  { id: "u_102", displayName: "Priya Nair", email: "priya.nair@mail.com", role: "listener", joinedDate: "2026-02-02", status: "active" },
  { id: "u_103", displayName: "Marlow", email: "marlow.music@mail.com", role: "artist", joinedDate: "2025-11-20", status: "active" },
  { id: "u_104", displayName: "Sam Okafor", email: "sam.okafor@mail.com", role: "listener", joinedDate: "2026-03-09", status: "banned" },
  { id: "u_105", displayName: "Ren Vale", email: "ren.vale@mail.com", role: "artist", joinedDate: "2026-01-30", status: "active" },
];

export const mockManagedArtists: ManagedArtist[] = [
  {
    id: "art_1",
    name: "Marlow",
    email: "marlow.music@mail.com",
    joinedDate: "2025-11-20",
    totalReleases: 4,
    verificationStatus: "verified",
    status: "active",
    portfolioSummary: "4 released albums, ~180K monthly listeners, official streaming profile and press kit on file.",
  },
  {
    id: "art_2",
    name: "Aviary",
    email: "aviary.band@mail.com",
    joinedDate: "2025-12-05",
    totalReleases: 2,
    verificationStatus: "pending",
    status: "active",
    portfolioSummary: "2 self-released EPs; submitted press photos and a short artist bio for review.",
  },
  {
    id: "art_3",
    name: "Ren Vale",
    email: "ren.vale@mail.com",
    joinedDate: "2026-01-30",
    totalReleases: 6,
    verificationStatus: "verified",
    status: "active",
    portfolioSummary: "6 releases over two years; verified press coverage from three music blogs.",
  },
  {
    id: "art_4",
    name: "Juno Ray",
    email: "juno.ray@mail.com",
    joinedDate: "2026-02-18",
    totalReleases: 1,
    verificationStatus: "pending",
    status: "active",
    portfolioSummary: "Debut single at ~12K streams; submitted a sample-work link and ID verification.",
  },
  {
    id: "art_5",
    name: "Nadia Cross",
    email: "nadia.cross@mail.com",
    joinedDate: "2026-03-02",
    totalReleases: 0,
    verificationStatus: "rejected",
    status: "active",
    portfolioSummary: "No releases yet; application was submitted without any sample work.",
    rejectionReason: "No sample work or portfolio provided.",
  },
];

export const mockSupportTickets: SupportTicket[] = [
  {
    id: "tk_1",
    subject: "Unable to upload track",
    description: "The upload form fails silently when the file is over 20MB.",
    submittedByName: "Aviary",
    submittedByRole: "artist",
    status: "open",
    createdDate: "2026-07-01",
    replies: [],
  },
  {
    id: "tk_2",
    subject: "Payment for premium not reflected",
    description: "Upgraded to Gold but the badge is not showing on my profile.",
    submittedByName: "Priya Nair",
    submittedByRole: "listener",
    status: "answered",
    createdDate: "2026-06-28",
    replies: [
      {
        id: "tk_2_r1",
        authorName: "Jordan Blake",
        authorRole: "staff",
        message: "Thanks for reporting this — could you confirm which device and browser you used?",
        sentDate: "2026-06-29",
      },
    ],
  },
  {
    id: "tk_3",
    subject: "Request account verification",
    description: "I would like my artist account verified; portfolio attached.",
    submittedByName: "Juno Ray",
    submittedByRole: "artist",
    status: "open",
    createdDate: "2026-07-03",
    replies: [],
  },
  {
    id: "tk_4",
    subject: "Playlist disappeared",
    description: "My 'Late Night Drive' playlist is no longer showing on my home page.",
    submittedByName: "Alex Rivera",
    submittedByRole: "listener",
    status: "closed",
    createdDate: "2026-06-20",
    replies: [
      {
        id: "tk_4_r1",
        authorName: "Jordan Blake",
        authorRole: "staff",
        message: "This was a caching issue on our end — it should be visible again now.",
        sentDate: "2026-06-21",
      },
    ],
  },
  {
    id: "tk_5",
    subject: "Reported inappropriate cover art",
    description: "A cover image on a public playlist appears to violate content guidelines.",
    submittedByName: "Sam Okafor",
    submittedByRole: "listener",
    status: "open",
    createdDate: "2026-07-05",
    replies: [],
  },
];

// Derives the Platform Stats Overview numbers straight from the live mock
// data so the figures never drift out of sync with the tables above.
export function computePlatformStats(
  users: ManagedUser[],
  artists: ManagedArtist[],
  tickets: SupportTicket[]
): PlatformStats {
  return {
    totalUsers: users.length,
    totalArtists: artists.length,
    activeArtists: artists.filter((artist) => artist.status === "active").length,
    pendingTickets: tickets.filter((ticket) => ticket.status !== "closed").length,
  };
}

// --- 11.2.2 Auditing / Finance -------------------------------------------

// Mock reward rate used only to derive Phase 1 payout figures.
const FINANCE_REVENUE_PER_STREAM = 0.004;

function calcReward(totalStreams: number): number {
  return Math.round(totalStreams * FINANCE_REVENUE_PER_STREAM * 100) / 100;
}

export const mockArtistPayouts: ArtistPayout[] = [
  { id: "pay_1", artistId: "art_1", artistName: "Marlow", period: "2026-07", uniqueListeners: 42_300, totalStreams: 184_200, rewardAmount: calcReward(184_200), payoutStatus: "pending" },
  { id: "pay_2", artistId: "art_2", artistName: "Aviary", period: "2026-07", uniqueListeners: 31_800, totalStreams: 152_900, rewardAmount: calcReward(152_900), payoutStatus: "settled" },
  { id: "pay_3", artistId: "art_3", artistName: "Ren Vale", period: "2026-07", uniqueListeners: 27_100, totalStreams: 121_400, rewardAmount: calcReward(121_400), payoutStatus: "pending" },
  { id: "pay_4", artistId: "art_4", artistName: "Juno Ray", period: "2026-07", uniqueListeners: 9_600, totalStreams: 22_300, rewardAmount: calcReward(22_300), payoutStatus: "pending" },
];

// --- 11.2.3 Subscription Management & Advanced Settings -------------------

export const mockSubscriptionPrices: SubscriptionPrices = {
  silver: 4.99,
  gold: 9.99,
};

// Static mock counts of users per tier — Phase 1 only; replace with a real
// aggregate query once the backend phase begins.
export const mockSubscriptionDistribution: SubscriptionDistribution = {
  free: 1240,
  silver: 385,
  gold: 210,
};

// Derives this month's mock subscription revenue from the current prices
// and the tier distribution, so the figure always matches the pie chart.
export function computeMonthlyRevenue(
  prices: SubscriptionPrices,
  distribution: SubscriptionDistribution
): number {
  return distribution.silver * prices.silver + distribution.gold * prices.gold;
}