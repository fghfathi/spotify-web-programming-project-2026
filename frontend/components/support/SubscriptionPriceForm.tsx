"use client";

import { useState } from "react";
import { SubscriptionPrices } from "@/types/support";

interface SubscriptionPriceFormProps {
  prices: SubscriptionPrices;
  onUpdate: (prices: SubscriptionPrices) => void;
}

// 11.2.3 — pricing control panel. State updates are local mock state only;
// no backend call is made in Phase 1.
export default function SubscriptionPriceForm({ prices, onUpdate }: SubscriptionPriceFormProps) {
  const [silver, setSilver] = useState(String(prices.silver));
  const [gold, setGold] = useState(String(prices.gold));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSilver = parseFloat(silver);
    const parsedGold = parseFloat(gold);
    if (Number.isNaN(parsedSilver) || Number.isNaN(parsedGold)) return;
    onUpdate({ silver: parsedSilver, gold: parsedGold });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">Subscription Pricing</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="silver-price" className="mb-1.5 block text-sm text-zinc-400">
            Silver Price (USD / month)
          </label>
          <input
            id="silver-price"
            type="number"
            min="0"
            step="0.01"
            value={silver}
            onChange={(e) => setSilver(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white outline-none focus:border-white"
          />
        </div>

        <div>
          <label htmlFor="gold-price" className="mb-1.5 block text-sm text-zinc-400">
            Gold Price (USD / month)
          </label>
          <input
            id="gold-price"
            type="number"
            min="0"
            step="0.01"
            value={gold}
            onChange={(e) => setGold(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white outline-none focus:border-white"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-4 w-full rounded-lg bg-white py-2.5 font-semibold text-black hover:bg-zinc-200 sm:w-auto sm:px-6"
      >
        Update Prices
      </button>
    </form>
  );
}