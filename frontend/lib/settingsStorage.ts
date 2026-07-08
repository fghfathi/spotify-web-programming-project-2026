// Phase 1 mock persistence layer.
// Wraps localStorage access so components never touch window.localStorage
// directly. Swap the bodies of these functions for real API calls in Phase 2
// without changing any component code.

import { AppSettings, DEFAULT_SETTINGS } from "@/types/settings";

const SETTINGS_KEY = "shpotify_app_settings";

// Keys that represent a logged-in session across the app. Account deletion
// clears all of these so the user is fully signed out.
const SESSION_KEYS = ["shpotify_user", "shpotify_session", "shpotify_auth_token"];

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<AppSettings>;

    // Merge with defaults so newly added fields don't break older saved data.
    return {
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...parsed.notifications,
      },
      volume: parsed.volume ?? DEFAULT_SETTINGS.volume,
      language: parsed.language ?? DEFAULT_SETTINGS.language,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage can fail (private browsing, quota). Phase 1 mock, so we
    // silently no-op rather than surfacing a broken UI.
  }
}

// Simulates deleting the account: clears the mock session and this
// device's saved settings, so the next visit starts from a clean slate.
export function clearMockAccount(): void {
  if (typeof window === "undefined") return;

  SESSION_KEYS.forEach((key) => window.localStorage.removeItem(key));
  window.localStorage.removeItem(SETTINGS_KEY);
}
