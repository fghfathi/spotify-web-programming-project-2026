"use client";

// Thin compatibility layer over AuthContext.
//
// Historically this provided a hardcoded ACTIVE_ROLE for Phase 1. It now
// derives the role from the authenticated user (AuthContext) so every page —
// home, artist dashboard, and the whole /support portal — reads the real
// logged-in role. `setRole` is kept as an optional manual override used only
// by testing utilities; by default the role follows the authenticated user.

import { createContext, ReactNode, useContext, useState } from "react";
import { UserRole } from "@/types/home";
import { useAuth } from "@/context/AuthContext";

interface CurrentUserContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(
  undefined
);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [override, setOverride] = useState<UserRole | null>(null);
  const role: UserRole = override ?? user?.role ?? "listener";

  return (
    <CurrentUserContext.Provider value={{ role, setRole: setOverride }}>
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
