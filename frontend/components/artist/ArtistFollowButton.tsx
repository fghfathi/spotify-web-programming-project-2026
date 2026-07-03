"use client";

import { useState } from "react";

interface ArtistFollowButtonProps {
  artistName: string;
  initialIsFollowing: boolean;
}

// Phase 1: follow state is local only. Phase 2: wire onClick to the
// follow/unfollow API endpoint and drop the local useState.
export default function ArtistFollowButton({
  artistName,
  initialIsFollowing,
}: ArtistFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

  return (
    <button
      type="button"
      onClick={() => setIsFollowing((prev) => !prev)}
      aria-pressed={isFollowing}
      aria-label={isFollowing ? `Unfollow ${artistName}` : `Follow ${artistName}`}
      className={`h-fit rounded-lg px-5 py-2 text-sm font-semibold transition ${
        isFollowing
          ? "border border-zinc-700 bg-zinc-800 text-white hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
          : "bg-white text-black hover:bg-zinc-200"
      }`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}