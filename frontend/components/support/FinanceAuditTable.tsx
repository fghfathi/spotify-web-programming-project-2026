import { ArtistPayout } from "@/types/support";
import StatusBadge from "./StatusBadge";

interface FinanceAuditTableProps {
  payouts: ArtistPayout[];
  canSettle: boolean; // 11.2.2 — settlement action is admin-only
  onSettle: (payoutId: string) => void;
}

export default function FinanceAuditTable({ payouts, canSettle, onSettle }: FinanceAuditTableProps) {
  if (payouts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
        No payout records for this period.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Artist</th>
            <th scope="col" className="px-4 py-3 font-medium">Unique Listeners</th>
            <th scope="col" className="px-4 py-3 font-medium">Total Streams</th>
            <th scope="col" className="px-4 py-3 font-medium">Reward Amount</th>
            <th scope="col" className="px-4 py-3 font-medium">Payout Status</th>
            {canSettle && <th scope="col" className="px-4 py-3 font-medium text-right">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {payouts.map((payout) => (
            <tr key={payout.id} className="bg-zinc-950/40 hover:bg-zinc-900/60">
              <td className="px-4 py-3">
                <p className="font-medium text-white">{payout.artistName}</p>
                <p className="text-xs text-zinc-500">{payout.period}</p>
              </td>
              <td className="px-4 py-3 text-zinc-300">{payout.uniqueListeners.toLocaleString()}</td>
              <td className="px-4 py-3 text-zinc-300">{payout.totalStreams.toLocaleString()}</td>
              <td className="px-4 py-3 font-medium text-white">${payout.rewardAmount.toFixed(2)}</td>
              <td className="px-4 py-3">
                <StatusBadge
                  label={payout.payoutStatus === "settled" ? "Settled" : "Pending Payment"}
                  tone={payout.payoutStatus === "settled" ? "green" : "amber"}
                />
              </td>
              {canSettle && (
                <td className="px-4 py-3 text-right">
                  {payout.payoutStatus === "pending" && (
                    <button
                      type="button"
                      onClick={() => onSettle(payout.id)}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-black hover:bg-emerald-400"
                    >
                      Mark as Settled
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}