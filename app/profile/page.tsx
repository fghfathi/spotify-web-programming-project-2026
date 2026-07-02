'use client'; 

import Sidebar from "@/components/home/Sidebar";
import { sidebarNavItems } from "@/data/mockHomeData";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import SubscriptionBadge from "@/components/profile/SubscriptionBadge";
import FollowButton from "@/components/profile/FollowButton";
import StatCard from "@/components/profile/StatCard";
import PersonalInfoSection from "@/components/profile/PersonalInfoSection";
import { mockProfile } from "@/data/mockProfileData";

// Phase 1: profile data is mocked. Replace mockProfile with a fetch from the
// Django API in Phase 2 — the component tree below should not need to change.
export default function ProfilePage() {
  const profile = mockProfile;

  return (
    <div className="flex min-h-screen flex-col bg-black md:flex-row">
      <Sidebar navItems={sidebarNavItems} />

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <main className="flex-1 px-4 py-6 md:px-8">
          {/* Profile header card */}
          <section className="mb-6 flex flex-col items-center gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-center sm:flex-row sm:items-center sm:text-left">
            <ProfileAvatar
              name={profile.personalInfo.fullName}
              imageUrl={profile.profileImageUrl}
              subscription={profile.subscription}
            />

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">
                {profile.personalInfo.fullName}
              </h1>
              <p className="mt-0.5 text-sm text-zinc-500">@{profile.username}</p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <SubscriptionBadge subscription={profile.subscription} />
              </div>

              <p className="mt-3 max-w-md text-sm text-zinc-400">
                {profile.personalInfo.bio || "No bio added yet."}
              </p>
            </div>

            <div className="shrink-0">
              <FollowButton initiallyFollowed={profile.isFollowedByCurrentUser} />
            </div>
          </section>

          {/* Social and listening stats */}
          <section
            aria-label="Profile statistics"
            className="mb-6 flex gap-4"
          >
            <StatCard label="Followers" value={profile.followerCount} />
            <StatCard label="Following" value={profile.followingCount} />
            <StatCard label="Songs streamed today" value={profile.dailyStreams} />
          </section>

          {/* Editable personal information */}
          <PersonalInfoSection
            info={profile.personalInfo}
            username={profile.username}
          />
        </main>
      </div>
    </div>
  );
}