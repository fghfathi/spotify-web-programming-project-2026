"use client";

import SettingsCard from "./SettingsCard";

interface VolumeControlSectionProps {
  value: number; // 0-100
  onChange: (value: number) => void;
}

// Small inline icon so this component has no dependency on an icon
// package. Swap for lucide-react's Volume2/Volume1/VolumeX if that
// package is already part of the project.
function VolumeIcon({ level }: { level: number }) {
  if (level === 0) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-zinc-400">
        <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
        <path
          d="m16 9 5 6M21 9l-5 6"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
      <path
        d="M15.5 8.5a5 5 0 0 1 0 7"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {level > 60 && (
        <path
          d="M18 6a9 9 0 0 1 0 12"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export default function VolumeControlSection({
  value,
  onChange,
}: VolumeControlSectionProps) {
  return (
    <SettingsCard
      title="System volume"
      description="Set the overall playback volume for the app."
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={value === 0 ? "Unmute" : "Mute"}
          onClick={() => onChange(value === 0 ? 70 : 0)}
          className="shrink-0 rounded-lg bg-zinc-800 p-2 hover:bg-zinc-700"
        >
          <VolumeIcon level={value} />
        </button>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-emerald-500"
          aria-label="System volume"
        />

        <span className="w-10 shrink-0 text-right text-sm text-zinc-400">
          {value}%
        </span>
      </div>
    </SettingsCard>
  );
}
