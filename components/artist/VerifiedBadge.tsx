// Small badge shown next to an artist's name once they've been verified
// by supporters. Presentational only — no props needed.
export default function VerifiedBadge() {
  return (
    <span
      title="Verified Artist"
      className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-500/15 px-2.5 py-0.5 text-xs font-semibold text-sky-300"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.4 2.1 3.1-.6.9 3 2.8 1.4-.9 3.1.9 3.1-2.8 1.4-.9 3-3.1-.6L12 22l-2.4-2.1-3.1.6-.9-3-2.8-1.4.9-3.1-.9-3.1 2.8-1.4.9-3 3.1.6L12 2Z" />
        <path
          d="M9 12.2l2 2 4-4.4"
          stroke="black"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Verified Artist
    </span>
  );
}