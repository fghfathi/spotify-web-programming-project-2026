"use client";

// Payment result page (Step 6). The backend callback redirects here with
// ?status=success|failed&invoice=<id>. We confirm the transaction status from
// the API, refresh the user's subscription, and show the outcome.

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { LoadingState } from "@/components/shared/UIStates";

interface Transaction {
  invoiceId: string;
  amount: number;
  status: "pending" | "success" | "failed";
  planTitle: string | null;
  trackingNumber: string | null;
}

function PaymentResultInner() {
  const params = useSearchParams();
  const { refreshUser } = useAuth();
  const invoice = params.get("invoice");
  const statusParam = params.get("status");

  const [txn, setTxn] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Pull the authoritative status from the API (not just the URL param).
      if (invoice) {
        try {
          const data = await apiGet<Transaction>(`/payments/${invoice}/`);
          if (!cancelled) setTxn(data);
        } catch {
          /* fall back to the URL status below */
        }
      }
      // A successful payment activates the subscription — refresh the user.
      await refreshUser();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [invoice, refreshUser]);

  const succeeded =
    txn?.status === "success" || (!txn && statusParam === "success");

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <LoadingState label="Confirming your payment…" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 text-center">
        <div
          className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            succeeded ? "bg-emerald-500/15" : "bg-red-500/15"
          }`}
        >
          <span className={succeeded ? "text-emerald-400" : "text-red-400"}>
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {succeeded ? (
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </span>
        </div>

        <h1 className="text-xl font-bold text-white">
          {succeeded ? "Payment successful" : "Payment failed"}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          {succeeded
            ? `Your ${txn?.planTitle ?? ""} subscription is now active.`
            : "Your payment was not completed. No charge was made."}
        </p>

        {txn && (
          <div className="mt-5 space-y-1 rounded-lg bg-zinc-800/60 p-4 text-left text-xs text-zinc-400">
            <p>
              Invoice: <span className="text-zinc-200">{txn.invoiceId}</span>
            </p>
            <p>
              Amount:{" "}
              <span className="text-zinc-200">
                {txn.amount.toLocaleString()} Toman
              </span>
            </p>
            {txn.trackingNumber && (
              <p>
                Tracking:{" "}
                <span className="text-zinc-200">{txn.trackingNumber}</span>
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Link
            href="/home"
            className="w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-black hover:bg-zinc-200"
          >
            Go to Home
          </Link>
          {!succeeded && (
            <Link
              href="/subscription"
              className="w-full rounded-lg bg-zinc-800 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
            >
              Try again
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black">
          <LoadingState label="Loading…" />
        </div>
      }
    >
      <PaymentResultInner />
    </Suspense>
  );
}
