interface RevenueStatsCardsProps {
  // All three figures arrive aggregated from GET /api/reports/admin/. This card
  // row used to add up the tier distribution itself to get the totals.
  monthlyRevenue: number;
  payingUsers: number;
  totalUsers: number;
  currency?: string;
}

export default function RevenueStatsCards({
  monthlyRevenue,
  payingUsers,
  totalUsers,
  currency = "$",
}: RevenueStatsCardsProps) {
  const cards = [
    {
      label: "Monthly Subscription Revenue",
      value: `${currency}${monthlyRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    { label: "Paying Subscribers", value: payingUsers.toLocaleString() },
    { label: "Total Users", value: totalUsers.toLocaleString() },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">{card.label}</p>
          <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
