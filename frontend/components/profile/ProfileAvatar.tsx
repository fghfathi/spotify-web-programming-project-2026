"use client";

import { useRef, useState } from "react";
import { SubscriptionType, canEditProfileImage } from "@/types/profile";

interface ProfileAvatarProps {
  name: string;
  imageUrl?: string;
  subscription: SubscriptionType;
  // Uploads the chosen image to the backend (Step 4). When omitted the
  // control is display-only.
  onUpload?: (file: File) => Promise<void>;
}

function FallbackAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      aria-hidden="true"
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700 text-4xl font-semibold text-white"
    >
      {initial}
    </div>
  );
}

// Displays the profile picture (or fallback) and the upload control.
// Enabled/disabled state is driven by canEditProfileImage — the same rule the
// backend enforces. Shows a live preview before the upload completes.
export default function ProfileAvatar({
  name,
  imageUrl,
  subscription,
  onUpload,
}: ProfileAvatarProps) {
  const canEdit = canEditProfileImage(subscription) && Boolean(onUpload);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;
    setError(null);
    // Instant local preview.
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const shown = preview ?? imageUrl;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-zinc-800 sm:h-32 sm:w-32">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- media URLs come from the API host / object URLs
          <img
            src={shown}
            alt={`${name}'s profile picture`}
            className="h-full w-full object-cover"
          />
        ) : (
          <FallbackAvatar name={name} />
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white">
            Uploading…
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFile}
      />

      <button
        type="button"
        disabled={!canEdit || uploading}
        onClick={() => inputRef.current?.click()}
        className={`mt-3 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
          canEdit
            ? "bg-zinc-800 text-white hover:bg-zinc-700"
            : "cursor-not-allowed bg-zinc-900 text-zinc-600"
        }`}
        title={
          canEdit
            ? "Change profile picture"
            : "Upgrade your subscription to change your profile picture"
        }
      >
        Change photo
      </button>

      {!canEditProfileImage(subscription) && (
        <p className="mt-1 max-w-[10rem] text-center text-[11px] text-zinc-600">
          Photo changes require Silver or Gold
        </p>
      )}
      {error && (
        <p className="mt-1 max-w-[11rem] text-center text-[11px] text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
