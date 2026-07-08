"use client";

import { useSupportData } from "@/context/SupportDataContext";
import { useCurrentUser } from "@/context/CurrentUserContext";
import FinanceAuditTable from "@/components/support/FinanceAuditTable";

export default function FinanceAuditPage() {
  const { payouts, settlePayout } = useSupportData();
  const { role } = useCurrentUser();
  const isAdmin = role === "admin";

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white md:text-3xl">Finance & Auditing</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Monthly artist reward calculations
          {!isAdmin && " — settlement actions are restricted to admin accounts."}
        </p>
      </div>

      <FinanceAuditTable payouts={payouts} canSettle={isAdmin} onSettle={settlePayout} />
    </>
  );
}