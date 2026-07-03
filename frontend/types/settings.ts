// Domain types for the Settings feature.
// Mirrors what a Django REST endpoint would eventually accept/return.
// Phase 1: persisted only to localStorage (see lib/settingsStorage.ts).

export type Language = "en" | "fa";

export type NotificationFrequency = "all" | "important" | "none";

export interface NotificationSettings {
  enabled: boolean;
  frequency: NotificationFrequency; // controls which notifications are allowed through
  dailyLimit: number; // max notifications per day, ignored when frequency is "none"
}

export interface AppSettings {
  notifications: NotificationSettings;
  volume: number; // 0-100
  language: Language;
}

export const DEFAULT_SETTINGS: AppSettings = {
  notifications: {
    enabled: true,
    frequency: "important",
    dailyLimit: 10,
  },
  volume: 70,
  language: "en",
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  fa: "فارسی",
};

export const NOTIFICATION_FREQUENCY_LABELS: Record<NotificationFrequency, string> = {
  all: "All notifications",
  important: "Important only",
  none: "None",
};
