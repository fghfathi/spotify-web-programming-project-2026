"use client";

import SettingsCard from "./SettingsCard";
import Toggle from "./Toggle";
import {
  NotificationSettings,
  NotificationFrequency,
  NOTIFICATION_FREQUENCY_LABELS,
} from "@/types/settings";

interface NotificationLimitsSectionProps {
  value: NotificationSettings;
  onChange: (value: NotificationSettings) => void;
}

const FREQUENCIES: NotificationFrequency[] = ["all", "important", "none"];

export default function NotificationLimitsSection({
  value,
  onChange,
}: NotificationLimitsSectionProps) {
  const isLimitDisabled = !value.enabled || value.frequency === "none";

  return (
    <SettingsCard
      title="Notification limits"
      description="Choose which notifications reach you and how many you get per day."
    >
      <div className="space-y-5">
        <Toggle
          label="Enable notifications"
          description="Turn all notifications on or off."
          checked={value.enabled}
          onChange={(enabled) => onChange({ ...value, enabled })}
        />

        <div className={!value.enabled ? "opacity-50" : ""}>
          <label className="mb-2 block text-sm font-medium text-white">
            Frequency
          </label>
          <div className="grid grid-cols-3 gap-2">
            {FREQUENCIES.map((freq) => (
              <button
                key={freq}
                type="button"
                disabled={!value.enabled}
                onClick={() => onChange({ ...value, frequency: freq })}
                className={`rounded-lg py-2 text-xs font-medium transition disabled:cursor-not-allowed ${
                  value.frequency === freq
                    ? "bg-white text-black"
                    : "bg-zinc-800 text-zinc-300 hover:text-white"
                }`}
              >
                {NOTIFICATION_FREQUENCY_LABELS[freq]}
              </button>
            ))}
          </div>
        </div>

        <div className={isLimitDisabled ? "opacity-50" : ""}>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-white">
              Daily limit
            </label>
            <span className="text-sm text-zinc-400">
              {value.dailyLimit} / day
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            step={1}
            disabled={isLimitDisabled}
            value={value.dailyLimit}
            onChange={(e) =>
              onChange({ ...value, dailyLimit: Number(e.target.value) })
            }
            className="w-full accent-emerald-500 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </SettingsCard>
  );
}
