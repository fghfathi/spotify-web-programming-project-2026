// Domain types for the Admin → Subscription "Analytics & Reporting" section.
// These map 1:1 to the `analytics` block of `GET /api/reports/admin/` (see
// backend/apps/reports/services.py). One exception: `color` is a styling
// choice, so it stays on the client — see lib/tierColors.ts.

export type SubscriptionTierKey = "basic" | "silver" | "gold";

// One slice of the tier-distribution donut. Both `users` and `sharePct` arrive
// precomputed from the backend; the chart plots them, it never derives them.
export interface TierDistributionDatum {
  key: SubscriptionTierKey;
  label: string; // English label, e.g. "Basic"
  labelFa: string; // Persian label, e.g. "پایه"
  users: number; // number of users currently on this tier
  sharePct: number; // this tier's share of all users, computed backend-side
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
// section needs arrives through this one prop-shaped object, straight from the
// admin report's `analytics` block (plus client-side tier colors).
export interface SubscriptionAnalytics {
  currency: string; // display currency symbol/code, e.g. "$"
  periodLabel: string; // human label for the reporting window, e.g. "This Month"
  distribution: TierDistributionDatum[];
  metrics: RevenueMetric[];
  totalUsers: number; // denominator behind `sharePct`, shown in the donut center
}
