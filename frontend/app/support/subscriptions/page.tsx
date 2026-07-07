"use client";

import { useSupportData } from "@/context/SupportDataContext";
import { useCurrentUser } from "@/context/CurrentUserContext";
import SubscriptionPriceForm from "@/components/support/SubscriptionPriceForm";
import RevenueStatsCards from "@/components/support/RevenueStatsCards";
import SubscriptionPieChart from "@/components/support/SubscriptionPieChart";

export default function SubscriptionSettingsPage() {
  const { subscriptionPrices, subscriptionDistribution, monthlyRevenue, updateSubscriptionPrices } =
    useSupportData();
  const { role } = useCurrentUser();

  if (role !== "admin") {
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
        <SubscriptionPriceForm prices={subscriptionPrices} onUpdate={updateSubscriptionPrices} />
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-white md:text-2xl">Revenue & Analytics</h2>
      </div>

      <div className="mb-6">
        <RevenueStatsCards monthlyRevenue={monthlyRevenue} distribution={subscriptionDistribution} />
      </div>

      <SubscriptionPieChart distribution={subscriptionDistribution} />
    </>
  );
}