"use client";

// Profile page — backed by the real authenticated user (Bug 1) with a working
// avatar upload (Step 4) and inline personal-info editing that PATCHes /api/me/.

import { useMemo } from "react";
import Sidebar from "@/components/home/Sidebar";
import { sidebarNavItems } from "@/data/mockHomeData";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import SubscriptionBadge from "@/components/profile/SubscriptionBadge";
import StatCard from "@/components/profile/StatCard";
import PersonalInfoSection from "@/components/profile/PersonalInfoSection";
import RouteGuard from "@/components/shared/RouteGuard";
import { LoadingState } from "@/components/shared/UIStates";
import { useAuth } from "@/context/AuthContext";
import { apiPatch, apiUpload } from "@/lib/api";
import { SubscriptionType } from "@/types/profile";

type EditableField = "fullName" | "birthdate" | "gender" | "bio";

function ProfileContent() {
  const { user, refreshUser } = useAuth();

  // Map the auth subscription tier to the profile badge's tier vocabulary.
  const subscription: SubscriptionType = useMemo(() => {
    if (user?.subscription === "gold") return "gold";
    if (user?.subscription === "silver") return "silver";
    return "normal";
  }, [user?.subscription]);

  if (!user) {
    return (
      <div className="min-h-screen bg-black">
        <LoadingState label="Loading your profile…" />
      </div>
    );
  }

  const handleAvatarUpload = async (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    await apiUpload("/me/", form, "PATCH");
    await refreshUser();
  };

  const handleFieldSave = async (field: EditableField, value: string) => {
    // Map the frontend field name to the backend serializer field.
    const body: Record<string, string> = {};
    if (field === "fullName") body.fullName = value;
    else body[field] = value;
    await apiPatch("/me/", body);
    await refreshUser();
  };

  return (
    <div className="flex min-h-screen flex-col bg-black md:flex-row">
      <Sidebar navItems={sidebarNavItems} />

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <main className="flex-1 px-4 py-6 md:px-8">
          <section className="mb-6 flex flex-col items-center gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-center sm:flex-row sm:items-center sm:text-left">
            <ProfileAvatar
              name={user.personalInfo.fullName || user.displayName}
              imageUrl={user.profileImageUrl ?? undefined}
              subscription={subscription}
              onUpload={handleAvatarUpload}
            />

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">
                {user.personalInfo.fullName || user.displayName}
              </h1>
              <p className="mt-0.5 text-sm text-zinc-500">@{user.username}</p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <SubscriptionBadge subscription={subscription} />
              </div>

              <p className="mt-3 max-w-md text-sm text-zinc-400">
                {user.personalInfo.bio || "No bio added yet."}
              </p>
            </div>
          </section>

          <section aria-label="Profile statistics" className="mb-6 flex gap-4">
            <StatCard label="Followers" value={user.followerCount} />
            <StatCard label="Following" value={user.followingCount} />
            <StatCard label="Songs streamed today" value={user.dailyStreams} />
          </section>

          <PersonalInfoSection
            info={user.personalInfo}
            username={user.username}
            onSave={handleFieldSave}
          />
        </main>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RouteGuard>
      <ProfileContent />
    </RouteGuard>
  );
}
