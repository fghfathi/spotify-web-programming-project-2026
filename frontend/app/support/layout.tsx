"use client";

// Support & Management portal layout — restricted to support/admin roles
// (RouteGuard) and using the real authenticated staff user in the top bar.

import Sidebar from "@/components/home/Sidebar";
import TopBar from "@/components/home/TopBar";
import RouteGuard from "@/components/shared/RouteGuard";
import { SupportDataProvider } from "@/context/SupportDataContext";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types/home";

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const staffUser: User = {
    id: String(user?.id ?? ""),
    displayName: user?.displayName ?? "",
    profileImageUrl: user?.profileImageUrl ?? undefined,
    subscription: user?.subscription === "gold" ? "gold" : "free",
    role: user?.role ?? "support",
  };

  return (
    <RouteGuard roles={["support", "admin"]}>
      <div className="flex min-h-screen flex-col bg-black md:flex-row">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
          <TopBar user={staffUser} />
          <main className="flex-1 px-4 py-6 md:px-8">
            <SupportDataProvider>{children}</SupportDataProvider>
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
