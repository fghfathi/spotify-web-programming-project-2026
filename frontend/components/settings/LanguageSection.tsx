"use client";

import SettingsCard from "./SettingsCard";
import { Language, LANGUAGE_LABELS } from "@/types/settings";

interface LanguageSectionProps {
  value: Language;
  onChange: (value: Language) => void;
}

const LANGUAGES: Language[] = ["en", "fa"];

export default function LanguageSection({
  value,
  onChange,
}: LanguageSectionProps) {
  return (
    <SettingsCard
      title="Language"
      description="Choose the language used across the app."
    >
      <div className="grid grid-cols-2 gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => onChange(lang)}
            aria-pressed={value === lang}
            dir={lang === "fa" ? "rtl" : "ltr"}
            className={`rounded-lg py-2.5 text-sm font-medium transition ${
              value === lang
                ? "bg-white text-black"
                : "bg-zinc-800 text-zinc-300 hover:text-white"
            }`}
          >
            {LANGUAGE_LABELS[lang]}
          </button>
        ))}
      </div>

      {value === "fa" && (
        <p className="mt-3 text-xs text-zinc-500">
          Full right-to-left layout support is planned for a future phase.
          This selection is saved and will be applied then.
        </p>
      )}
    </SettingsCard>
  );
}
