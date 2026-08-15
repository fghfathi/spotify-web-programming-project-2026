import { SubscriptionAnalytics } from "@/types/analytics";
import RevenueMetricCards from "@/components/support/RevenueMetricCards";
import TierDistributionChart from "@/components/support/TierDistributionChart";

interface AnalyticsReportingSectionProps {
  // The `analytics` block of GET /api/reports/admin/ with tier colors attached
  // (lib/tierColors.ts). Required — there is deliberately no local fallback, so
  // every figure in this section can only have come from the backend report.
  analytics: SubscriptionAnalytics;
}

// "Analytics & Reporting" dashboard block for the Admin Subscription Settings
// page. Composes the revenue metric cards and the tier-distribution pie chart.
export default function AnalyticsReportingSection({
  analytics,
}: AnalyticsReportingSectionProps) {
  return (
    <section aria-labelledby="analytics-reporting-heading">
      <div className="mb-5">
        <h2 id="analytics-reporting-heading" className="text-xl font-bold text-white md:text-2xl">
          Analytics &amp; Reporting
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Subscription distribution and revenue performance for {analytics.periodLabel.toLowerCase()}.
          <span className="ml-1.5 text-zinc-500" lang="fa" dir="rtl">
            تحلیل و گزارش‌گیری
          </span>
        </p>
      </div>

      <div className="space-y-5">
        <RevenueMetricCards metrics={analytics.metrics} currency={analytics.currency} />
        <TierDistributionChart
          data={analytics.distribution}
          totalUsers={analytics.totalUsers}
        />
      </div>
    </section>
  );
}
