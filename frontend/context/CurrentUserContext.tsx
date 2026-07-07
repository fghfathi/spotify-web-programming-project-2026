"use client";

import { createContext, ReactNode, useContext, useState } from "react";
import { UserRole } from "@/types/home";
import { ACTIVE_ROLE } from "@/data/mockHomeData";

interface CurrentUserContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void; // exposed for quick manual role-switch testing only
}

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(undefined);

// Single source of truth for "which role is logged in" during Phase 1.
// Mounted once in the root layout, so every page (home, artist dashboard,
// support portal, etc.) reads the SAME role — this is what eliminates the
// role-leakage and delayed-sidebar bugs: no page can use a different or
// stale role source anymore.
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(ACTIVE_ROLE);
  return (
    <CurrentUserContext.Provider value={{ role, setRole }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  }
  return ctx;
}