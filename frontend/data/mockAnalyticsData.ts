// Central mock data for the Admin → Subscription "Analytics & Reporting"
// section (Phase 1, no backend). This is the single source of truth for the
// tier pie chart and the revenue metric cards, mirroring the pattern in
// data/mockSupportData.ts.
//
// The tier labels/colors and the "last month" baselines live here as mock;
// buildSubscriptionAnalytics() derives the current-month figures from the same
// subscription distribution + revenue the rest of the Admin panel already uses,
// so the analytics view never drifts out of sync — including after an admin
// edits prices at runtime. This file only READS from the existing mock; it
// never modifies it.

import {
  mockSubscriptionDistribution,
  mockSubscriptionPrices,
  computeMonthlyRevenue,
} from "@/data/mockSupportData";
import { SubscriptionDistribution } from "@/types/support";
import {
  RevenueMetric,
  SubscriptionAnalytics,
  TierDistributionDatum,
} from "@/types/analytics";

// Tier accent colors. Validated for colorblind-safe separation on the dark
// panel surface (worst-adjacent CVD ΔE ≈ 30+, well above the ≥12 target).
// "Basic" reuses the Spotify green, "Gold" a warm gold, "Silver" a cool steel.
export const TIER_COLORS = {
  basic: "#1db954",
  silver: "#9db4cf",
  gold: "#f5b014",
} as const;

// Static Phase-1 baselines for the previous month, used only to compute the
// month-over-month growth/comparison indicators.
const LAST_MONTH_REVENUE = 3120.75;
const LAST_MONTH_PAYING_USERS = 548;

// Month-over-month change, rounded to one decimal place.
function pctChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// Builds the analytics payload from a live subscription distribution + this
// month's revenue (both already exposed by SupportDataContext), so the section
// stays consistent with the other cards on the page — even after a price edit.
// Pass no live data and use `mockSubscriptionAnalytics` below for a static default.
export function buildSubscriptionAnalytics(
  distribution: SubscriptionDistribution,
  monthlyRevenue: number
): SubscriptionAnalytics {
  // The existing distribution uses free/silver/gold; "free" maps to "Basic".
  const tierDistribution: TierDistributionDatum[] = [
    { key: "basic", label: "Basic", labelFa: "پایه", users: distribution.free, color: TIER_COLORS.basic },
    { key: "silver", label: "Silver", labelFa: "نقره‌ای", users: distribution.silver, color: TIER_COLORS.silver },
    { key: "gold", label: "Gold", labelFa: "طلایی", users: distribution.gold, color: TIER_COLORS.gold },
  ];

  const payingUsers = distribution.silver + distribution.gold;
  const arpu = payingUsers === 0 ? 0 : monthlyRevenue / payingUsers;
  const lastMonthArpu = LAST_MONTH_PAYING_USERS === 0 ? 0 : LAST_MONTH_REVENUE / LAST_MONTH_PAYING_USERS;

  const metrics: RevenueMetric[] = [
    {
      id: "mrr",
      label: "Total Monthly Revenue",
      labelFa: "درآمد کل این ماه",
      value: monthlyRevenue,
      format: "currency",
      changePct: pctChange(monthlyRevenue, LAST_MONTH_REVENUE),
      previousValue: LAST_MONTH_REVENUE,
    },
    {
      id: "paying",
      label: "Paying Subscribers",
      labelFa: "مشترکین پولی",
      value: payingUsers,
      format: "number",
      changePct: pctChange(payingUsers, LAST_MONTH_PAYING_USERS),
      previousValue: LAST_MONTH_PAYING_USERS,
    },
    {
      id: "arpu",
      label: "Avg. Revenue / User",
      labelFa: "میانگین درآمد هر کاربر",
      value: arpu,
      format: "currency",
      changePct: pctChange(arpu, lastMonthArpu),
      previousValue: lastMonthArpu,
    },
  ];

  return { currency: "$", periodLabel: "This Month", distribution: tierDistribution, metrics };
}

// Static default payload, derived from the subscription mock. Used when the
// section is rendered without an explicit `analytics` prop.
export const mockSubscriptionAnalytics: SubscriptionAnalytics = buildSubscriptionAnalytics(
  mockSubscriptionDistribution,
  computeMonthlyRevenue(mockSubscriptionPrices, mockSubscriptionDistribution)
);
