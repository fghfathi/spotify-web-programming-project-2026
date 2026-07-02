import { ReactNode } from "react";

interface ContentSectionProps {
  title: string;
  emptyMessage: string;
  children: ReactNode[];
}

// Generic horizontal-scroll section wrapper with built-in empty state.
export default function ContentSection({
  title,
  emptyMessage,
  children,
}: ContentSectionProps) {
  const hasContent = children.length > 0;

  return (
    <section className="mb-8" aria-label={title}>
      <h2 className="mb-3 text-lg font-semibold text-white md:text-xl">
        {title}
      </h2>

      {hasContent ? (
        <div className="flex gap-4 overflow-x-auto pb-2">{children}</div>
      ) : (
        <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}