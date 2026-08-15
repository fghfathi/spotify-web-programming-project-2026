// Presentation-only constants for the subscription tiers.
//
// Counts, shares and labels all come from the backend report. Colors are a
// styling decision, so they live here rather than travelling over the API.

import { SubscriptionAnalytics, SubscriptionTierKey } from "@/types/analytics";
import { AdminReport } from "@/types/reports";

// Validated for colorblind-safe separation on the dark panel surface
// (worst-adjacent CVD ΔE ≈ 30+, well above the ≥12 target). "Basic" reuses the
// Spotify green, "Gold" a warm gold, "Silver" a cool steel.
export const TIER_COLORS: Record<SubscriptionTierKey, string> = {
  basic: "#1db954",
  silver: "#9db4cf",
  gold: "#f5b014",
};

/** Attach tier colors to the admin report's analytics block. No math here. */
export function toSubscriptionAnalytics(report: AdminReport): SubscriptionAnalytics {
  return {
    currency: report.analytics.currency,
    periodLabel: report.analytics.periodLabel,
    metrics: report.analytics.metrics,
    totalUsers: report.users.totalUsers,
    distribution: report.analytics.distribution.map((slice) => ({
      ...slice,
      color: TIER_COLORS[slice.key],
    })),
  };
}
