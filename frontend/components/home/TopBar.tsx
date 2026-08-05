"use client";

import { useRouter } from "next/navigation";
import { User } from "@/types/home";
import { useAuth } from "@/context/AuthContext";

interface TopBarProps {
  user: User;
}

// Renders a colored initial avatar when no profile image is available.
function FallbackAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      aria-hidden="true"
      className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-base font-semibold text-white"
    >
      {initial}
    </div>
  );
}

export default function TopBar({ user }: TopBarProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-4 backdrop-blur md:px-8">
      <div>
        <p className="text-xs text-zinc-500">Welcome back</p>
        <h1 className="text-lg font-semibold text-white md:text-xl">
          {user.displayName}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {user.subscription === "gold" && (
          <span className="hidden rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300 sm:inline-block">
            Gold Member
          </span>
        )}

        {user.profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- media URLs come from the API host
          <img
            src={user.profileImageUrl}
            alt={`${user.displayName}'s profile picture`}
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <FallbackAvatar name={user.displayName} />
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
