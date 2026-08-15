"use client";

// Global authentication state (Step 3 / Bug 3).
//
// - Stores JWT tokens via lib/api and hydrates the current user from /api/me/
//   on boot.
// - Exposes login / register / logout and a refreshUser() to re-pull the user
//   after profile or subscription changes.
// - Every protected page reads the SAME user/role from here, so route guards
//   and role-based UI never rely on stale or mock state.

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  apiGet,
  apiPost,
  clearTokens,
  getAccessToken,
  setTokens,
} from "@/lib/api";
import { UserRole } from "@/types/home";

export type SubscriptionTier = "free" | "silver" | "gold";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  status: "active" | "banned";
  displayName: string;
  personalInfo: {
    fullName: string;
    email: string;
    birthdate: string;
    gender: string;
    bio: string;
  };
  profileImageUrl?: string | null;
  subscription: SubscriptionTier;
  followerCount: number;
  followingCount: number;
  dailyStreams: number;
  isVerified: boolean;
}

interface RegisterInput {
  email: string;
  password: string;
  fullName?: string;
  role?: "listener" | "artist";
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On boot: if a token exists, hydrate the current user.
  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!getAccessToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await apiGet<AuthUser>("/me/");
        if (!cancelled) setUserState(me);
      } catch {
        clearTokens();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiPost<AuthResponse>(
      "/auth/login/",
      { email, password },
      false
    );
    setTokens(data.access, data.refresh);
    setUserState(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await apiPost<AuthResponse>("/auth/register/", input, false);
    setTokens(data.access, data.refresh);
    setUserState(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUserState(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) return;
    try {
      const me = await apiGet<AuthUser>("/me/");
      setUserState(me);
    } catch {
      /* keep the existing user on a transient failure */
    }
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: user !== null,
    login,
    register,
    logout,
    refreshUser,
    setUser: setUserState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
