// Phase 1 mock data for the Settings page.
// Replace with a real user fetch (e.g. Django REST /me endpoint) once the
// backend phase begins.

import { SubscriptionType } from "@/types/profile";

export interface MockSettingsUser {
  id: string;
  displayName: string;
  email: string;
  subscription: SubscriptionType;
}

export const mockSettingsUser: MockSettingsUser = {
  id: "u_1001",
  displayName: "Alex Rivera",
  email: "alex.rivera@example.com",
  subscription: "silver",
};

export const SUBSCRIPTION_LABELS: Record<SubscriptionType, string> = {
  gold: "Gold",
  silver: "Silver",
  normal: "Basic",
};
