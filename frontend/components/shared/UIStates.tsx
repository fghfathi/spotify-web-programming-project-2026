"use client";

// Reusable loading / error / empty state blocks so every page that fetches
// from the API surfaces consistent feedback (Bug 1: proper UI states).

import { ReactNode } from "react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-400" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-sm text-red-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-full bg-zinc-800 px-4 py-1.5 text-sm text-white transition hover:bg-zinc-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      {description && <p className="text-xs text-zinc-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
