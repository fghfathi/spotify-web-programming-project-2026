// Domain types for the Admin → Subscription "Analytics & Reporting" section.
// Kept framework-agnostic (no React imports) so they can map 1:1 to a future
// Django REST analytics endpoint — mirroring the convention in types/support.ts.
// This file is ADDITIVE: it does not touch or re-declare any existing type.

export type SubscriptionTierKey = "basic" | "silver" | "gold";

// One slice of the tier-distribution pie: how many users sit on a tier plus the
// display metadata (English + Persian label and an accent color) the chart and
// legend need. Structured so the whole array can be passed straight in as a prop.
export interface TierDistributionDatum {
  key: SubscriptionTierKey;
  label: string; // English label, e.g. "Basic"
  labelFa: string; // Persian label, e.g. "پایه"
  users: number; // number of users currently on this tier
  color: string; // hex accent used by the donut slice + legend swatch
}

export type RevenueMetricFormat = "currency" | "number" | "percent";

// A single revenue metric card (total revenue, paying subscribers, ARPU, …).
// The optional month-over-month delta drives the up/down growth indicator.
export interface RevenueMetric {
  id: string;
  label: string; // English label
  labelFa?: string; // optional Persian label
  value: number;
  format: RevenueMetricFormat;
  // Percentage change vs. the previous month. Positive → growth (green ↑),
  // negative → decline (red ↓), 0/undefined → flat. Optional so a card can opt
  // out of the comparison indicator entirely.
  changePct?: number;
  // Optional raw previous-month value, kept for a future "vs $X last month" caption.
  previousValue?: number;
}

// The full payload the Analytics & Reporting section renders. Everything the
// section needs arrives through this one prop-shaped object.
export interface SubscriptionAnalytics {
  currency: string; // display currency symbol/code, e.g. "$"
  periodLabel: string; // human label for the reporting window, e.g. "This Month"
  distribution: TierDistributionDatum[];
  metrics: RevenueMetric[];
}
