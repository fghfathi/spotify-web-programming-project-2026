"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NotificationLimitsSection from "@/components/settings/NotificationLimitsSection";
import VolumeControlSection from "@/components/settings/VolumeControlSection";
import LanguageSection from "@/components/settings/LanguageSection";
import SubscriptionSection from "@/components/settings/SubscriptionSection";
import DeleteAccountSection from "@/components/settings/DeleteAccountSection";
import { loadSettings, saveSettings } from "@/lib/settingsStorage";
import { AppSettings, DEFAULT_SETTINGS, NotificationSettings } from "@/types/settings";
import { mockSettingsUser } from "@/data/mockSettingsData";

// Phase 1: settings are mocked and persisted to localStorage only.
// Replace loadSettings/saveSettings in lib/settingsStorage.ts with real API
// calls once the backend phase begins; this page and its sections don't
// need to change.
export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted settings once, on mount (client only).
  useEffect(() => {
    setSettings(loadSettings());
    setIsLoaded(true);
  }, []);

  // Persist any change, but skip the very first render so we don't
  // immediately overwrite stored data with the default state.
  useEffect(() => {
    if (!isLoaded) return;
    saveSettings(settings);
  }, [settings, isLoaded]);

  const updateNotifications = (notifications: NotificationSettings) =>
    setSettings((prev) => ({ ...prev, notifications }));

  const updateVolume = (volume: number) =>
    setSettings((prev) => ({ ...prev, volume }));

  const updateLanguage = (language: AppSettings["language"]) =>
    setSettings((prev) => ({ ...prev, language }));

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage notifications, playback, language, and your account.
            </p>
          </div>

          <Link
            href="/home"
            className="hidden shrink-0 text-sm text-zinc-400 hover:text-white sm:block"
          >
            Back to Home
          </Link>
        </div>

        <div className="space-y-5">
          <NotificationLimitsSection
            value={settings.notifications}
            onChange={updateNotifications}
          />

          <VolumeControlSection
            value={settings.volume}
            onChange={updateVolume}
          />

          <LanguageSection
            value={settings.language}
            onChange={updateLanguage}
          />

          <SubscriptionSection subscription={mockSettingsUser.subscription} />

          <DeleteAccountSection />
        </div>
      </div>
    </div>
  );
}
