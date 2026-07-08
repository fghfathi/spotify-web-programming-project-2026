"use client";

// frontend/components/player/ProgressBar.tsx

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function ProgressBar({
  currentTime,
  duration,
  onSeek,
}: ProgressBarProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex w-full items-center gap-2 text-xs text-zinc-400">
      <span className="w-9 shrink-0 text-right tabular-nums">
        {formatTime(currentTime)}
      </span>

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full accent-emerald-500"
        style={{
          background: `linear-gradient(to right, #10b981 ${progress}%, #3f3f46 ${progress}%)`,
        }}
        aria-label="Seek"
      />

      <span className="w-9 shrink-0 tabular-nums">{formatTime(duration)}</span>
    </div>
  );
}
