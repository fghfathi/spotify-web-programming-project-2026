interface ArtistStatsProps {
  totalListeners: number;
  totalStreams: number;
}

// Gold-exclusive stats. The page decides whether to render this component at
// all, keeping the subscription check at the composition layer (same pattern
// as EarlyAccessSection on the Home page).
export default function ArtistStats({
  totalListeners,
  totalStreams,
}: ArtistStatsProps) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:max-w-sm">
      <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.04] p-4">
        <p className="text-xs text-zinc-400">Total Listeners</p>
        <p className="mt-1 text-xl font-semibold text-white">
          {totalListeners.toLocaleString()}
        </p>
      </div>
      <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.04] p-4">
        <p className="text-xs text-zinc-400">Total Streams</p>
        <p className="mt-1 text-xl font-semibold text-white">
          {totalStreams.toLocaleString()}
        </p>
      </div>
    </div>
  );
}