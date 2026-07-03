// Mock data for Phase 1. No backend calls — this is the single source of
// truth for the Profile Page until the Django API is wired up.

import { UserProfile } from "@/types/profile";

export const mockProfile: UserProfile = {
  id: "u_001",
  username: "alex.rivera_84", // system-assigned, read-only
  personalInfo: {
    fullName: "Alex Rivera",
    email: "alex.rivera@example.com",
    birthdate: "1998-04-12",
    gender: "Other",
    bio: "Always looking for the next late-night playlist.",
  },
  profileImageUrl: undefined, // missing on purpose -> demonstrates fallback avatar
  subscription: "normal", // try "gold" / "silver" to see avatar-edit lock toggle
  followerCount: 1240,
  followingCount: 318,
  dailyStreams: 47,
  isFollowedByCurrentUser: false,
};