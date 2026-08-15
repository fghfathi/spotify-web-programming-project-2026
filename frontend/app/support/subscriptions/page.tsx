"use client";

// Admin → Subscription Settings.
//
// Reporting (3.7): every figure below — revenue, tier distribution, ARPU,
// month-over-month growth — arrives already computed from
// GET /api/reports/admin/. This page edits prices and renders numbers; it
// derives none of them.

import { useCallback, useEffect, useState } from "react";
import { useSupportData } from "@/context/SupportDataContext";
import { useCurrentUser } from "@/context/CurrentUserContext";
import SubscriptionPriceForm from "@/components/support/SubscriptionPriceForm";
import RevenueStatsCards from "@/components/support/RevenueStatsCards";
import SubscriptionPieChart from "@/components/support/SubscriptionPieChart";
import AnalyticsReportingSection from "@/components/support/AnalyticsReportingSection";
import { LoadingState, ErrorState } from "@/components/shared/UIStates";
import { fetchAdminReport } from "@/lib/reports";
import { toSubscriptionAnalytics } from "@/lib/tierColors";
import { AdminReport } from "@/types/reports";
import { SubscriptionPrices } from "@/types/support";

export default function SubscriptionSettingsPage() {
  const { subscriptionPrices, updateSubscriptionPrices } = useSupportData();
  const { role } = useCurrentUser();

  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isAdmin = role === "admin";

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setReport(await fetchAdminReport());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The report endpoint is admin-only, so don't call it as support staff.
    if (isAdmin) load();
  }, [isAdmin, load]);

  // A price change moves revenue and ARPU, both of which live in the report.
  const handleUpdatePrices = async (prices: SubscriptionPrices) => {
    await updateSubscriptionPrices(prices);
    await load();
  };

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-6">
        <h1 className="text-lg font-semibold text-red-300">Admin Access Required</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Subscription management and advanced settings are restricted to admin accounts.
          Your current role is &ldquo;{role}&rdquo;.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-2">
        <h1 className="text-2xl font-bold text-white md:text-3xl">Subscription Settings</h1>
        <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
          Admin Only
        </span>
      </div>

      <div className="mb-8">
        <SubscriptionPriceForm prices={subscriptionPrices} onUpdate={handleUpdatePrices} />
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-white md:text-2xl">Revenue &amp; Analytics</h2>
      </div>

      {loading ? (
        <LoadingState label="Loading the platform report…" />
      ) : error || !report ? (
        <ErrorState message="Couldn't load the platform report." onRetry={load} />
      ) : (
        <>
          <div className="mb-6">
            <RevenueStatsCards
              currency={report.currency}
              monthlyRevenue={report.revenue.monthlyRecurringRevenue}
              payingUsers={report.subscriptions.payingUsers}
              totalUsers={report.users.totalUsers}
            />
          </div>

          <SubscriptionPieChart
            slices={report.analytics.distribution}
            totalUsers={report.users.totalUsers}
          />

          <div className="mt-10">
            <AnalyticsReportingSection analytics={toSubscriptionAnalytics(report)} />
          </div>
        </>
      )}
    </>
  );
}
