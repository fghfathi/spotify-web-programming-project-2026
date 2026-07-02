"use client";

import Link from "next/link";
import { NavItem } from "@/types/home";

interface SidebarProps {
  navItems: NavItem[];
}

// Simple inline icon set so we avoid an external icon dependency in Phase 1.
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
  }
}

export default function Sidebar({ navItems }: SidebarProps) {
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
        {navItems.map((item) => (
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