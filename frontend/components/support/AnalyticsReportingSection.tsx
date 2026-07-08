import { SubscriptionAnalytics } from "@/types/analytics";
import { mockSubscriptionAnalytics } from "@/data/mockAnalyticsData";
import RevenueMetricCards from "@/components/support/RevenueMetricCards";
import TierDistributionChart from "@/components/support/TierDistributionChart";

interface AnalyticsReportingSectionProps {
  // Prop-driven: pass your own analytics payload, or omit it to use the central
  // mock (data/mockAnalyticsData.ts). This keeps the section consistent with the
  // rest of the Admin panel while staying ready for a real API payload later.
  analytics?: SubscriptionAnalytics;
}

// "Analytics & Reporting" dashboard block for the Admin Subscription Settings
// page. Composes the revenue metric cards and the tier-distribution pie chart.
export default function AnalyticsReportingSection({
  analytics = mockSubscriptionAnalytics,
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
        <TierDistributionChart data={analytics.distribution} />
      </div>
    </section>
  );
}
