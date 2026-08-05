"use client";

// Settings page (Step 5) — preferences now persist to the backend so they
// sync across devices. On boot we load from /api/me/settings/ (with a
// localStorage cache for instant paint) and apply the volume to the player.
// Every change is debounced and PATCHed to the database.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import NotificationLimitsSection from "@/components/settings/NotificationLimitsSection";
import VolumeControlSection from "@/components/settings/VolumeControlSection";
import LanguageSection from "@/components/settings/LanguageSection";
import SubscriptionSection from "@/components/settings/SubscriptionSection";
import DeleteAccountSection from "@/components/settings/DeleteAccountSection";
import RouteGuard from "@/components/shared/RouteGuard";
import { LoadingState } from "@/components/shared/UIStates";
import { loadSettings, saveSettings } from "@/lib/settingsStorage";
import { AppSettings, NotificationSettings } from "@/types/settings";
import { apiGet, apiPatch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useMusicPlayer } from "@/context/MusicPlayerContext";

interface BackendSettings {
  volume: number; // 0-100
  language: AppSettings["language"];
  notifications: NotificationSettings;
}

function SettingsContent() {
  const { user } = useAuth();
  const { setVolume } = useMusicPlayer();
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [isLoaded, setIsLoaded] = useState(false);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted settings from the backend on mount, then apply the volume.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<BackendSettings>("/me/settings/");
        if (cancelled) return;
        const next: AppSettings = {
          notifications: data.notifications,
          volume: data.volume,
          language: data.language,
        };
        setSettings(next);
        saveSettings(next);
        setVolume(data.volume / 100); // apply playback volume on boot
      } catch {
        // Fall back to the locally cached settings on failure.
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setVolume]);

  // Debounced persistence: cache locally immediately, PATCH the DB after a
  // short pause so rapid toggles collapse into a single request.
  const persist = useCallback((next: AppSettings) => {
    saveSettings(next);
    setSavingState("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await apiPatch("/me/settings/", {
          volume: next.volume,
          language: next.language,
          notifications: next.notifications,
        });
        setSavingState("saved");
        setTimeout(() => setSavingState("idle"), 1500);
      } catch {
        setSavingState("idle");
      }
    }, 500);
  }, []);

  const applyChange = useCallback(
    (next: AppSettings) => {
      setSettings(next);
      if (isLoaded) persist(next);
    },
    [isLoaded, persist]
  );

  const updateNotifications = (notifications: NotificationSettings) =>
    applyChange({ ...settings, notifications });

  const updateVolume = (volume: number) => {
    setVolume(volume / 100); // live-apply to the player
    applyChange({ ...settings, volume });
  };

  const updateLanguage = (language: AppSettings["language"]) =>
    applyChange({ ...settings, language });

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black">
        <LoadingState label="Loading your settings…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage notifications, playback, language, and your account.
              {savingState === "saving" && (
                <span className="ml-2 text-zinc-500">Saving…</span>
              )}
              {savingState === "saved" && (
                <span className="ml-2 text-emerald-400">Saved</span>
              )}
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

          <VolumeControlSection value={settings.volume} onChange={updateVolume} />

          <LanguageSection value={settings.language} onChange={updateLanguage} />

          <SubscriptionSection
            subscription={
              user?.subscription === "gold"
                ? "gold"
                : user?.subscription === "silver"
                ? "silver"
                : "normal"
            }
          />

          <DeleteAccountSection />
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RouteGuard>
      <SettingsContent />
    </RouteGuard>
  );
}
