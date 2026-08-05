"use client";

// Client-side route guard (Bug 3 / Step 3 RBAC).
//
// - Redirects anonymous users to /login.
// - Optionally restricts a page to specific roles (redirects others to /home).
// - Optionally requires a paid subscription (redirects free users to the
//   subscription page), used to gate premium-only content.

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/home";
import { LoadingState } from "@/components/shared/UIStates";

interface RouteGuardProps {
  children: ReactNode;
  roles?: UserRole[]; // if set, only these roles may view the page
  requireSubscription?: boolean; // if true, free users are redirected
}

export default function RouteGuard({
  children,
  roles,
  requireSubscription = false,
}: RouteGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // The login/register form lives at the root route.
      router.replace("/");
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace("/home");
      return;
    }
    if (requireSubscription && user.subscription === "free") {
      router.replace("/subscription");
    }
  }, [user, loading, roles, requireSubscription, router]);

  // While auth is resolving or a redirect is imminent, show a loader instead
  // of flashing protected content.
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black">
        <LoadingState label="Checking your session…" />
      </div>
    );
  }
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-black">
        <LoadingState label="Redirecting…" />
      </div>
    );
  }
  return <>{children}</>;
}
