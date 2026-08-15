"use client";

// Subscription checkout (Step 6). Lists the active plans grouped by tier
// (Silver / Gold), lets the user pick a duration (1 / 3 / 6 / 12 months), and
// starts a real payment for the chosen tier+duration: POST /api/payments/create/
// returns the gateway redirect URL and the browser is sent there to pay.
//
// Durations and prices are NOT hardcoded here — they come from the plan rows
// returned by /api/plans/, so the backend remains the single source of truth
// for which tier/duration combinations exist and what each one costs.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RouteGuard from "@/components/shared/RouteGuard";
import { LoadingState, ErrorState } from "@/components/shared/UIStates";
import { apiGet, apiPost, ApiError, unwrapList } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Plan {
  id: number;
  title: string;
  tier: "silver" | "gold";
  durationDays: number;
  durationMonths: number;
  price: number;
  features: string[];
  isActive: boolean;
}

interface CreateResponse {
  redirectUrl: string;
  invoiceId: string;
}

// Render Silver before Gold regardless of API ordering.
const TIER_ORDER: Plan["tier"][] = ["silver", "gold"];

function monthsLabel(months: number): string {
  return months === 1 ? "1 month" : `${months} months`;
}

function SubscriptionContent() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiGet<unknown>("/plans/");
      setPlans(unwrapList<Plan>(data));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Durations available across all plans, ascending — derived from the backend
  // data so adding/removing a plan row automatically updates the selector.
  const durations = useMemo(
    () =>
      Array.from(new Set(plans.map((p) => p.durationMonths))).sort(
        (a, b) => a - b
      ),
    [plans]
  );

  // Effective selection: the user's pick, else the shortest available duration.
  // Derived at render (no defaulting effect needed).
  const activeMonths =
    selectedMonths ?? (durations.length > 0 ? durations[0] : null);

  const tiers = useMemo(() => {
    const present = new Set(plans.map((p) => p.tier));
    return TIER_ORDER.filter((t) => present.has(t));
  }, [plans]);

  const planFor = useCallback(
    (tier: Plan["tier"], months: number | null) =>
      plans.find((p) => p.tier === tier && p.durationMonths === months) ?? null,
    [plans]
  );

  const startCheckout = async (planId: number) => {
    setPayError(null);
    setPayingId(planId);
    try {
      const res = await apiPost<CreateResponse>("/payments/create/", { planId });
      // Hand off to the payment gateway.
      window.location.href = res.redirectUrl;
    } catch (err) {
      setPayError(
        err instanceof ApiError ? err.message : "Could not start the payment."
      );
      setPayingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 md:py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Choose your plan</h1>
            <p className="mt-1 text-sm text-zinc-400">
              You are currently on the{" "}
              <span className="font-semibold text-white capitalize">
                {user?.subscription ?? "free"}
              </span>{" "}
              plan.
            </p>
          </div>
          <Link
            href="/settings"
            className="hidden shrink-0 text-sm text-zinc-400 hover:text-white sm:block"
          >
            Back to Settings
          </Link>
        </div>

        {payError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
            {payError}
          </div>
        )}

        {loading ? (
          <LoadingState label="Loading plans…" />
        ) : error ? (
          <ErrorState message="Couldn't load subscription plans." onRetry={load} />
        ) : plans.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
            No plans are available right now.
          </p>
        ) : (
          <>
            {/* Duration selector — applies to both tiers below. */}
            <div className="mb-6">
              <span className="mb-2 block text-sm font-medium text-white">
                Billing period
              </span>
              <div
                role="tablist"
                aria-label="Subscription duration"
                className="inline-flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1"
              >
                {durations.map((months) => {
                  const active = months === activeMonths;
                  return (
                    <button
                      key={months}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedMonths(months)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-white text-black"
                          : "text-zinc-300 hover:text-white"
                      }`}
                    >
                      {monthsLabel(months)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {tiers.map((tier) => {
                const plan = planFor(tier, activeMonths);
                if (!plan) return null;
                const isCurrent = user?.subscription === tier;
                return (
                  <div
                    key={tier}
                    className={`flex flex-col rounded-2xl border p-6 ${
                      tier === "gold"
                        ? "border-amber-400/40 bg-amber-400/[0.04]"
                        : "border-zinc-700 bg-zinc-900/60"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white">
                        {plan.title}
                      </h2>
                      {tier === "gold" && (
                        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-black">
                          BEST
                        </span>
                      )}
                    </div>

                    <p className="mb-4 text-2xl font-bold text-white">
                      {plan.price.toLocaleString()}{" "}
                      <span className="text-sm font-normal text-zinc-400">
                        Toman / {monthsLabel(plan.durationMonths)}
                      </span>
                    </p>

                    <ul className="mb-6 flex-1 space-y-2 text-sm text-zinc-300">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <span className="mt-0.5 text-emerald-400">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isCurrent && (
                      <p className="mb-2 text-xs font-medium text-emerald-400">
                        Your current tier — buy again to extend.
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={payingId !== null}
                      onClick={() => startCheckout(plan.id)}
                      className="rounded-lg bg-white py-2.5 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
                    >
                      {payingId === plan.id
                        ? "Redirecting…"
                        : `Pay for ${plan.title} · ${monthsLabel(
                            plan.durationMonths
                          )}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <RouteGuard>
      <SubscriptionContent />
    </RouteGuard>
  );
}
