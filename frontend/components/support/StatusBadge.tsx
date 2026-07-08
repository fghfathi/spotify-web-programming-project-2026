type BadgeTone = "green" | "red" | "amber" | "blue" | "gray";

interface StatusBadgeProps {
  label: string;
  tone: BadgeTone;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  red: "bg-red-500/15 text-red-300 border-red-500/30",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  blue: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  gray: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
};

// Generic pill badge reused for user status, artist verification, and
// ticket status. Callers decide the label/tone; this component only renders.
export default function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}