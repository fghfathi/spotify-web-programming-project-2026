"use client";

import Link from "next/link";
import SettingsCard from "./SettingsCard";
import { SubscriptionType } from "@/types/profile";
import { SUBSCRIPTION_LABELS } from "@/data/mockSettingsData";

interface SubscriptionSectionProps {
  subscription: SubscriptionType;
}

const BADGE_STYLES: Record<SubscriptionType, string> = {
  gold: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  silver: "bg-zinc-400/15 text-zinc-200 border-zinc-400/30",
  normal: "bg-zinc-700/40 text-zinc-300 border-zinc-600/40",
};

export default function SubscriptionSection({
  subscription,
}: SubscriptionSectionProps) {
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
    </SettingsCard>
  );
}
