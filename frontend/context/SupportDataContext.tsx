"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  ArtistPayout,
  ManagedArtist,
  ManagedUser,
  PlatformStats,
  SubscriptionDistribution,
  SubscriptionPrices,
  SupportTicket,
} from "@/types/support";
import {
  computeMonthlyRevenue,
  computePlatformStats,
  mockArtistPayouts,
  mockCurrentStaffUser,
  mockManagedArtists,
  mockManagedUsers,
  mockSubscriptionDistribution,
  mockSubscriptionPrices,
  mockSupportTickets,
} from "@/data/mockSupportData";

interface SupportDataContextValue {
  users: ManagedUser[];
  artists: ManagedArtist[];
  tickets: SupportTicket[];
  stats: PlatformStats;
  payouts: ArtistPayout[];
  subscriptionPrices: SubscriptionPrices;
  subscriptionDistribution: SubscriptionDistribution;
  monthlyRevenue: number;

  // Users
  toggleUserBan: (userId: string) => void;

  // Artists — quick management (existing "Manage Artists" table)
  toggleArtistBan: (artistId: string) => void;
  toggleArtistVerifiedFlag: (artistId: string) => void;

  // Artists — formal verification queue (11.2.1)
  approveArtistVerification: (artistId: string) => void;
  rejectArtistVerification: (artistId: string, reason: string) => void;

  // Tickets (11.2.1)
  sendTicketReply: (ticketId: string, message: string) => void;
  closeTicket: (ticketId: string) => void;

  // Finance / Auditing (11.2.2)
  settlePayout: (payoutId: string) => void;

  // Subscription Management (11.2.3)
  updateSubscriptionPrices: (prices: SubscriptionPrices) => void;
}

const SupportDataContext = createContext<SupportDataContextValue | undefined>(undefined);

// Phase 1: state lives in memory, seeded from mock data, and resets on a
// full page reload. Replace the initial state + handlers below with API
// calls (Django REST endpoints) once the backend phase begins — consuming
// components do not need to change, since they only rely on this context's
// public shape (values + handler functions).
export function SupportDataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<ManagedUser[]>(mockManagedUsers);
  const [artists, setArtists] = useState<ManagedArtist[]>(mockManagedArtists);
  const [tickets, setTickets] = useState<SupportTicket[]>(mockSupportTickets);
  const [payouts, setPayouts] = useState<ArtistPayout[]>(mockArtistPayouts);
  const [subscriptionPrices, setSubscriptionPrices] = useState<SubscriptionPrices>(mockSubscriptionPrices);
  const [subscriptionDistribution] = useState<SubscriptionDistribution>(mockSubscriptionDistribution);

  const toggleUserBan = useCallback((userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: u.status === "banned" ? "active" : "banned" } : u))
    );
  }, []);

  const toggleArtistBan = useCallback((artistId: string) => {
    setArtists((prev) =>
      prev.map((a) => (a.id === artistId ? { ...a, status: a.status === "banned" ? "active" : "banned" } : a))
    );
  }, []);

  // Quick toggle used by the general "Manage Artists" table: flips between
  // verified and pending without requiring a reason. The formal
  // approve/reject-with-reason flow lives in the dedicated verification
  // queue below (approveArtistVerification / rejectArtistVerification).
  const toggleArtistVerifiedFlag = useCallback((artistId: string) => {
    setArtists((prev) =>
      prev.map((a) =>
        a.id === artistId
          ? {
              ...a,
              verificationStatus: a.verificationStatus === "verified" ? "pending" : "verified",
              rejectionReason: a.verificationStatus === "verified" ? a.rejectionReason : undefined,
            }
          : a
      )
    );
  }, []);

  const approveArtistVerification = useCallback((artistId: string) => {
    setArtists((prev) =>
      prev.map((a) =>
        a.id === artistId ? { ...a, verificationStatus: "verified", rejectionReason: undefined } : a
      )
    );
  }, []);

  const rejectArtistVerification = useCallback((artistId: string, reason: string) => {
    setArtists((prev) =>
      prev.map((a) => (a.id === artistId ? { ...a, verificationStatus: "rejected", rejectionReason: reason } : a))
    );
  }, []);

  const sendTicketReply = useCallback((ticketId: string, message: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: t.status === "open" ? "answered" : t.status,
              replies: [
                ...t.replies,
                {
                  id: `${ticketId}_r${t.replies.length + 1}`,
                  authorName: mockCurrentStaffUser.displayName,
                  authorRole: "staff",
                  message,
                  sentDate: new Date().toISOString().slice(0, 10),
                },
              ],
            }
          : t
      )
    );
  }, []);

  const closeTicket = useCallback((ticketId: string) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: "closed" } : t)));
  }, []);

  const settlePayout = useCallback((payoutId: string) => {
    setPayouts((prev) => prev.map((p) => (p.id === payoutId ? { ...p, payoutStatus: "settled" } : p)));
  }, []);

  const updateSubscriptionPrices = useCallback((prices: SubscriptionPrices) => {
    setSubscriptionPrices(prices);
  }, []);

  const stats = useMemo(() => computePlatformStats(users, artists, tickets), [users, artists, tickets]);
  const monthlyRevenue = useMemo(
    () => computeMonthlyRevenue(subscriptionPrices, subscriptionDistribution),
    [subscriptionPrices, subscriptionDistribution]
  );

  const value: SupportDataContextValue = {
    users,
    artists,
    tickets,
    stats,
    payouts,
    subscriptionPrices,
    subscriptionDistribution,
    monthlyRevenue,
    toggleUserBan,
    toggleArtistBan,
    toggleArtistVerifiedFlag,
    approveArtistVerification,
    rejectArtistVerification,
    sendTicketReply,
    closeTicket,
    settlePayout,
    updateSubscriptionPrices,
  };

  return <SupportDataContext.Provider value={value}>{children}</SupportDataContext.Provider>;
}

export function useSupportData(): SupportDataContextValue {
  const ctx = useContext(SupportDataContext);
  if (!ctx) {
    throw new Error("useSupportData must be used within a SupportDataProvider");
  }
  return ctx;
}