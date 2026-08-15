"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export default function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleProps) {
  return (
    <label
      className={`flex items-center justify-between gap-4 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      <span>
        <span className="block text-sm font-medium text-white">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-zinc-400">
            {description}
          </span>
        )}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
          checked ? "bg-emerald-500" : "bg-zinc-700"
        }`}
      >
        {/* Track is 44px (w-11); thumb is 20px (w-5) inset 2px (left-0.5/top-0.5)
            from the left/top. ON translates by 44 − 20 − 2×2 = 20px (translate-x-5),
            so the thumb spans 22→42px and always stays fully inside the track. */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}
