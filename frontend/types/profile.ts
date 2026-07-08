// Domain types for the User Profile feature.
// Mirrors what a Django REST endpoint would eventually return.

export type SubscriptionType = "gold" | "silver" | "normal";

export interface PersonalInfo {
  fullName: string;
  email: string;
  birthdate: string; // ISO date string
  gender: string;
  bio: string;
}

export interface UserProfile {
  id: string;
  username: string; // system-assigned, not user-editable
  personalInfo: PersonalInfo;
  profileImageUrl?: string; // optional -> fallback avatar used when missing
  subscription: SubscriptionType;
  followerCount: number;
  followingCount: number;
  dailyStreams: number; // songs streamed today
  isFollowedByCurrentUser: boolean; // drives Follow/Unfollow button state
}

// Generic shape for any field that supports an inline "edit" UI action.
// Phase 1 only triggers a callback; Phase 2 wires this to a real edit flow.
export interface EditableFieldProps {
  label: string;
  value: string;
  onEdit: () => void;
}

// Centralizes the Phase 2 rule: which subscription tiers may change the avatar.
// Kept as a function (not a hardcoded boolean) so the rule has one source of truth.
export function canEditProfileImage(subscription: SubscriptionType): boolean {
  return subscription === "gold" || subscription === "silver";
}