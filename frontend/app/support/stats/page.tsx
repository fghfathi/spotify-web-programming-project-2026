"use client";

import { useSupportData } from "@/context/SupportDataContext";
import PlatformStatsCards from "@/components/support/PlatformStatsCards";

export default function PlatformStatsPage() {
  const { stats } = useSupportData();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white md:text-3xl">Platform Statistics</h1>
        <p className="mt-1 text-sm text-zinc-400">A snapshot of current platform activity.</p>
      </div>

      <PlatformStatsCards stats={stats} />
    </>
  );
}