import { ReactNode } from "react";

interface SettingsCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function SettingsCard({
  title,
  description,
  children,
}: SettingsCardProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl backdrop-blur">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}
