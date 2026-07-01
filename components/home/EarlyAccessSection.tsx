import { EarlyAccessItem } from "@/types/home";
import ContentCard from "./ContentCard";

interface EarlyAccessSectionProps {
  items: EarlyAccessItem[];
}

// Gold-only section. The page decides whether to render this component at all,
// keeping the subscription check at the composition layer rather than buried here.
export default function EarlyAccessSection({ items }: EarlyAccessSectionProps) {
  return (
    <section
      aria-label="Early Access"
      className="mb-8 rounded-xl border border-amber-400/30 bg-amber-400/[0.04] p-4 md:p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-black">
          GOLD
        </span>
        <h2 className="text-lg font-semibold text-white md:text-xl">
          Early Access
        </h2>
      </div>

      {items.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {items.map((item) => (
            <ContentCard
              key={item.id}
              title={item.title}
              subtitle={item.artistName}
              coverImageUrl={item.coverImageUrl}
              badge="Early"
              artistId={item.artistId}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-amber-400/20 px-4 py-6 text-sm text-zinc-500">
          No early access releases right now. Check back soon.
        </p>
      )}
    </section>
  );
}