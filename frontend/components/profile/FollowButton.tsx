"use client";

import { useState } from "react";

interface FollowButtonProps {
  initiallyFollowed: boolean;
}

// Local-only follow/unfollow state for Phase 1. Phase 2 will replace the
// state update with an API call and likely lift state to a parent/store.
export default function FollowButton({ initiallyFollowed }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initiallyFollowed);

  return (
    <button
      type="button"
      onClick={() => setIsFollowing((prev) => !prev)}
      aria-pressed={isFollowing}
      className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
        isFollowing
          ? "border border-zinc-700 bg-transparent text-white hover:border-red-500/60 hover:text-red-400"
          : "bg-white text-black hover:bg-zinc-200"
      }`}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}