"use client";

// Support & Management portal data layer (parts 10-11), backed by the Django
// REST API. Loading/error states are handled here so every support page gets
// them for free.
//
// Reporting (3.7): `stats` is fetched wholesale from GET /api/reports/support/.
// This context used to derive those figures on the client by counting the
// `users` / `tickets` arrays; it no longer performs any aggregation. Because
// the numbers now live on the server, every mutating handler refetches the
// report so the stat cards stay in step with the tables.

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ArtistPayout,
  ManagedArtist,
  ManagedUser,
  SubscriptionPrices,
  SupportTicket,
} from "@/types/support";
import { SupportReport } from "@/types/reports";
import { apiGet, apiPatch, apiPost, unwrapList } from "@/lib/api";
import { fetchSupportReport } from "@/lib/reports";
import { LoadingState, ErrorState } from "@/components/shared/UIStates";

interface SupportDataContextValue {
  users: ManagedUser[];
  artists: ManagedArtist[];
  tickets: SupportTicket[];
  /** The support report, computed entirely by GET /api/reports/support/. */
  stats: SupportReport;
  payouts: ArtistPayout[];
  subscriptionPrices: SubscriptionPrices;

  toggleUserBan: (userId: string) => void;
  toggleArtistBan: (artistId: string) => void;
  toggleArtistVerifiedFlag: (artistId: string) => void;
  approveArtistVerification: (artistId: string) => void;
  rejectArtistVerification: (artistId: string, reason: string) => void;
  sendTicketReply: (ticketId: string, message: string) => void;
  closeTicket: (ticketId: string) => void;
  settlePayout: (payoutId: string) => void;
  updateSubscriptionPrices: (prices: SubscriptionPrices) => void;
}

const SupportDataContext = createContext<SupportDataContextValue | undefined>(
  undefined
);

// --- API payload mappers (coerce numeric ids to strings for the UI types) ---
type RawUser = Omit<ManagedUser, "id"> & { id: number | string };
type RawArtist = Omit<ManagedArtist, "id" | "rejectionReason"> & {
  id: number | string;
  rejectionReason?: string | null;
};
interface RawTicketReply {
  id: number | string;
  authorName: string;
  authorRole: "staff" | "user";
  message: string;
  sentDate: string;
}
type RawTicket = Omit<SupportTicket, "id" | "replies"> & {
  id: number | string;
  replies: RawTicketReply[];
};
type RawPayout = Omit<ArtistPayout, "id"> & { id: number | string };

const mapUser = (u: RawUser): ManagedUser => ({ ...u, id: String(u.id) });
const mapArtist = (a: RawArtist): ManagedArtist => ({
  ...a,
  id: String(a.id),
  rejectionReason: a.rejectionReason ?? undefined,
});
const mapTicket = (t: RawTicket): SupportTicket => ({
  ...t,
  id: String(t.id),
  replies: t.replies.map((r) => ({ ...r, id: String(r.id) })),
});
const mapPayout = (p: RawPayout): ArtistPayout => ({ ...p, id: String(p.id) });

interface SubscriptionInfo {
  prices: SubscriptionPrices;
}

export function SupportDataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [artists, setArtists] = useState<ManagedArtist[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [payouts, setPayouts] = useState<ArtistPayout[]>([]);
  const [stats, setStats] = useState<SupportReport | null>(null);
  const [subscriptionPrices, setSubscriptionPrices] = useState<SubscriptionPrices>({
    silver: 0,
    gold: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [usersRaw, artistsRaw, ticketsRaw, financeRaw, subRaw, report] =
        await Promise.all([
          apiGet<unknown>("/support/users/"),
          apiGet<unknown>("/support/artists/"),
          apiGet<unknown>("/support/tickets/"),
          apiGet<{ payouts: RawPayout[] }>("/support/finance/"),
          apiGet<SubscriptionInfo>("/support/subscriptions/"),
          fetchSupportReport(),
        ]);
      setUsers(unwrapList<RawUser>(usersRaw).map(mapUser));
      setArtists(unwrapList<RawArtist>(artistsRaw).map(mapArtist));
      setTickets(unwrapList<RawTicket>(ticketsRaw).map(mapTicket));
      setPayouts((financeRaw.payouts ?? []).map(mapPayout));
      setSubscriptionPrices(subRaw.prices);
      setStats(report);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Bans, verifications and ticket transitions all move numbers in the report.
  // Recompute it where it is computed — on the server.
  const refreshStats = useCallback(async () => {
    try {
      setStats(await fetchSupportReport());
    } catch {
      // A stale stat card is better than tearing down a working page.
    }
  }, []);

  // --- Handlers (write to the API, then update local state) ---------------
  const toggleUserBan = useCallback(
    async (userId: string) => {
      const current = users.find((u) => u.id === userId);
      if (!current) return;
      const next = current.status === "banned" ? "active" : "banned";
      await apiPatch(`/support/users/${Number(userId)}/`, { status: next });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: next } : u))
      );
      await refreshStats();
    },
    [users, refreshStats]
  );

  const toggleArtistBan = useCallback(
    async (artistId: string) => {
      const current = artists.find((a) => a.id === artistId);
      if (!current) return;
      const next = current.status === "banned" ? "active" : "banned";
      await apiPatch(`/support/users/${Number(artistId)}/`, { status: next });
      setArtists((prev) =>
        prev.map((a) => (a.id === artistId ? { ...a, status: next } : a))
      );
      await refreshStats();
    },
    [artists, refreshStats]
  );

  const approveArtistVerification = useCallback(
    async (artistId: string) => {
      await apiPost(`/support/artists/${Number(artistId)}/verify/`, {
        action: "verify",
      });
      setArtists((prev) =>
        prev.map((a) =>
          a.id === artistId
            ? { ...a, verificationStatus: "verified", rejectionReason: undefined }
            : a
        )
      );
      await refreshStats();
    },
    [refreshStats]
  );

  const rejectArtistVerification = useCallback(
    async (artistId: string, reason: string) => {
      await apiPost(`/support/artists/${Number(artistId)}/verify/`, {
        action: "reject",
        reason,
      });
      setArtists((prev) =>
        prev.map((a) =>
          a.id === artistId
            ? { ...a, verificationStatus: "rejected", rejectionReason: reason }
            : a
        )
      );
      await refreshStats();
    },
    [refreshStats]
  );

  // Quick verify/unverify toggle. Only "verify" has a backend transition, so
  // unverifying is a local-only convenience; the formal flow is approve/reject.
  const toggleArtistVerifiedFlag = useCallback(
    async (artistId: string) => {
      const current = artists.find((a) => a.id === artistId);
      if (!current) return;
      if (current.verificationStatus !== "verified") {
        await approveArtistVerification(artistId);
      } else {
        setArtists((prev) =>
          prev.map((a) =>
            a.id === artistId ? { ...a, verificationStatus: "pending" } : a
          )
        );
      }
    },
    [artists, approveArtistVerification]
  );

  const sendTicketReply = useCallback(
    async (ticketId: string, message: string) => {
      const updated = await apiPost<RawTicket>(
        `/support/tickets/${Number(ticketId)}/reply/`,
        { message }
      );
      const mapped = mapTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? mapped : t)));
      // A reply flips an open ticket to "answered", which moves the counts.
      await refreshStats();
    },
    [refreshStats]
  );

  const closeTicket = useCallback(
    async (ticketId: string) => {
      await apiPatch(`/support/tickets/${Number(ticketId)}/`, { status: "closed" });
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: "closed" } : t))
      );
      await refreshStats();
    },
    [refreshStats]
  );

  const settlePayout = useCallback(async (payoutId: string) => {
    await apiPost(`/support/finance/payouts/${Number(payoutId)}/settle/`);
    setPayouts((prev) =>
      prev.map((p) =>
        p.id === payoutId ? { ...p, payoutStatus: "settled" } : p
      )
    );
  }, []);

  const updateSubscriptionPrices = useCallback(
    async (prices: SubscriptionPrices) => {
      const res = await apiPatch<{ prices: SubscriptionPrices }>(
        "/support/subscriptions/",
        { silver: prices.silver, gold: prices.gold }
      );
      setSubscriptionPrices(res.prices ?? prices);
    },
    []
  );

  if (loading) return <LoadingState label="Loading portal data…" />;
  if (error || stats === null) {
    return (
      <ErrorState message="Couldn't load the support portal." onRetry={loadAll} />
    );
  }

  const value: SupportDataContextValue = {
    users,
    artists,
    tickets,
    stats,
    payouts,
    subscriptionPrices,
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

  return (
    <SupportDataContext.Provider value={value}>
      {children}
    </SupportDataContext.Provider>
  );
}

export function useSupportData(): SupportDataContextValue {
  const ctx = useContext(SupportDataContext);
  if (!ctx) {
    throw new Error("useSupportData must be used within a SupportDataProvider");
  }
  return ctx;
}
