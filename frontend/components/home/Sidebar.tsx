// frontend/components/home/Sidebar.tsx
"use client";

import Link from "next/link";
import { NavItem } from "@/types/home";
import { sidebarNavItems } from "@/data/mockHomeData";
import { useCurrentUser } from "@/context/CurrentUserContext";

interface SidebarProps {
  // Optional now. Sidebar filters by role itself, so pages no longer need
  // to pre-filter before passing items in. If omitted, it defaults to the
  // full nav item list. Even if a page still passes an unfiltered list
  // (e.g. the Artist Dashboard previously did), Sidebar re-filters it
  // against the current role anyway — so no page can leak items by
  // forgetting to filter.
  navItems?: NavItem[];
}

function NavIcon({ name }: { name: NavItem["icon"] }) {
  const common = "h-5 w-5 shrink-0";
  switch (name) {
    case "playlist":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 6h12M4 12h12M4 18h8" strokeLinecap="round" />
          <circle cx="19" cy="17" r="2.2" />
          <path d="M21 17V8l-2 .6" strokeLinecap="round" />
        </svg>
      );
    case "profile":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2 1.2L10 21h4l.4-2.6c.7-.3 1.4-.7 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "albums":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="2.2" />
        </svg>
      );
    case "notifications":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "artist":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" strokeLinecap="round" />
          <path d="M12 18v3M9 21h6" strokeLinecap="round" />
        </svg>
      );
    case "manageUsers":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c.8-3.2 3-5 6-5s5.2 1.8 6 5" strokeLinecap="round" />
          <circle cx="17" cy="9" r="2.2" />
          <path d="M15.5 20c.4-2.2 1.6-3.6 3.5-4" strokeLinecap="round" />
        </svg>
      );
    case "manageArtists":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" strokeLinejoin="round" />
          <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "tickets":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" strokeLinejoin="round" />
          <path d="M10 6v12" strokeDasharray="2 2" strokeLinecap="round" />
        </svg>
      );
    case "stats":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 20V10M11 20V4M18 20v-7" strokeLinecap="round" />
        </svg>
      );
    case "finance":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7v10M9.5 9.5c0-1.4 1.2-2 2.5-2s2.5.7 2.5 1.8c0 2.4-5 1.4-5 3.9 0 1.1 1.2 1.8 2.5 1.8s2.5-.6 2.5-2" strokeLinecap="round" />
        </svg>
      );
    case "subscriptions":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 12V6a2 2 0 0 1 2-2h6l8 8-8 8-8-8Z" strokeLinejoin="round" />
          <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar({ navItems = sidebarNavItems }: SidebarProps) {
  const { role } = useCurrentUser();

  // The one and only filtering pass. Computed synchronously during render
  // (not in an effect), so there is no post-mount delay, and it always
  // reads the same centralized role — so no route can diverge from another.
  const visibleNavItems = navItems.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <aside
      aria-label="Main navigation"
      className="
        flex shrink-0 flex-row gap-1 border-t border-zinc-800 bg-zinc-950/95 px-2 py-2
        md:w-60 md:flex-col md:gap-2 md:border-t-0 md:border-r md:px-4 md:py-6
        fixed bottom-0 left-0 right-0 z-20 md:static
      "
    >
      <div className="mb-4 hidden px-2 md:block">
        <span className="text-xl font-bold text-white">Shpotify</span>
      </div>

      <nav className="flex w-full flex-row justify-around md:flex-col md:gap-1">
        {visibleNavItems.map((item) => (
          <Link
            key={item.route}
            href={item.route}
            className="
              flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] text-zinc-400
              transition hover:bg-zinc-800 hover:text-white
              md:flex-none md:flex-row md:justify-start md:gap-3 md:px-3 md:py-2.5 md:text-sm
            "
          >
            <NavIcon name={item.icon} />
            <span className="md:font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}