"use client";

import { useState } from "react";
import { apiPost, apiDelete } from "@/lib/api";

interface ArtistFollowButtonProps {
  artistId: string;
  artistName: string;
  initialIsFollowing: boolean;
}

// Follow/unfollow, wired to /api/users/<id>/follow/ (POST to follow, DELETE to
// unfollow). Uses an optimistic toggle that reverts if the request fails.
export default function ArtistFollowButton({
  artistId,
  artistName,
  initialIsFollowing,
}: ArtistFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    const next = !isFollowing;
    setIsFollowing(next);
    setBusy(true);
    try {
      if (next) {
        await apiPost(`/users/${Number(artistId)}/follow/`);
      } else {
        await apiDelete(`/users/${Number(artistId)}/follow/`);
      }
    } catch {
      setIsFollowing(!next); // revert on failure
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={isFollowing}
      aria-label={isFollowing ? `Unfollow ${artistName}` : `Follow ${artistName}`}
      className={`h-fit rounded-lg px-5 py-2 text-sm font-semibold transition disabled:opacity-60 ${
        isFollowing
          ? "border border-zinc-700 bg-zinc-800 text-white hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
          : "bg-white text-black hover:bg-zinc-200"
      }`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
