"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SettingsCard from "./SettingsCard";
import { SubscriptionType } from "@/types/profile";
import { SUBSCRIPTION_LABELS } from "@/data/mockSettingsData";
import { apiGet } from "@/lib/api";

interface SubscriptionSectionProps {
  subscription: SubscriptionType;
}

// Shape returned by GET /api/me/subscription/. `subscription` is null whenever
// the user has no *currently active* entitlement — this covers missing,
// expired and cancelled subscriptions alike (the backend collapses them all).
interface ActiveSubscription {
  endDate: string;
  isActive: boolean;
}

interface MySubscriptionResponse {
  tier: string;
  subscription: ActiveSubscription | null;
}

const BADGE_STYLES: Record<SubscriptionType, string> = {
  gold: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  silver: "bg-zinc-400/15 text-zinc-200 border-zinc-400/30",
  normal: "bg-zinc-700/40 text-zinc-300 border-zinc-600/40",
};

// Render the backend's ISO datetime as an exact YYYY-MM-DD calendar date.
function formatExpiry(iso: string): string {
  return iso.slice(0, 10);
}

export default function SubscriptionSection({
  subscription,
}: SubscriptionSectionProps) {
  const [status, setStatus] = useState<"loading" | "error" | "ready">(
    "loading"
  );
  const [sub, setSub] = useState<ActiveSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<MySubscriptionResponse>("/me/subscription/");
        if (cancelled) return;
        setSub(data.subscription);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SettingsCard
      title="Subscription"
      description="Your current plan and billing tier."
    >
      <div className="flex items-center justify-between gap-4">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${BADGE_STYLES[subscription]}`}
        >
          {SUBSCRIPTION_LABELS[subscription]}
        </span>

        {/* Links to the real checkout flow (Step 6). */}
        <Link
          href="/subscription"
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
        >
          Upgrade / change plan
        </Link>
      </div>

      {/* Subscription expiry (comes straight from the backend, never computed
          on the client) with explicit loading / error / no-subscription copy. */}
      <p className="mt-3 text-sm text-zinc-400" role="status" aria-live="polite">
        {status === "loading" ? (
          "Checking your subscription…"
        ) : status === "error" ? (
          "Couldn't load your subscription status."
        ) : sub ? (
          <>
            Subscription expires on:{" "}
            <span className="font-medium text-white">
              {formatExpiry(sub.endDate)}
            </span>
          </>
        ) : (
          "You do not currently have an active subscription."
        )}
      </p>
    </SettingsCard>
  );
}
