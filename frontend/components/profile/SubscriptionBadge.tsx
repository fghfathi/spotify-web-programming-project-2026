import { SubscriptionType } from "@/types/profile";

interface SubscriptionBadgeProps {
  subscription: SubscriptionType;
}

const STYLES: Record<SubscriptionType, string> = {
  gold: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  silver: "border-zinc-400/40 bg-zinc-400/10 text-zinc-200",
  normal: "border-zinc-700 bg-zinc-800 text-zinc-400",
};

const LABELS: Record<SubscriptionType, string> = {
  gold: "Gold",
  silver: "Silver",
  normal: "Normal",
};

export default function SubscriptionBadge({ subscription }: SubscriptionBadgeProps) {
  return (
    <span
      className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${STYLES[subscription]}`}
    >
      {LABELS[subscription]} Member
    </span>
  );
}