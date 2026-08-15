"use client";

import { useState } from "react";
import { PersonalInfo } from "@/types/profile";
import EditButton from "@/components/shared/EditButton";

// Which PersonalInfo fields can be edited (email + username are managed by the
// system / auth and are not user-editable through this form).
type EditableField = "fullName" | "birthdate" | "gender" | "bio";

interface PersonalInfoSectionProps {
  info: PersonalInfo;
  username: string;
  // Persists a single edited field to the backend. When omitted, rows render
  // read-only (used before the page is wired to the API).
  onSave?: (field: EditableField, value: string) => Promise<void>;
}

interface FieldRowProps {
  label: string;
  value: string;
  field?: EditableField;
  inputType?: string;
  onSave?: (field: EditableField, value: string) => Promise<void>;
}

function FieldRow({ label, value, field, inputType = "text", onSave }: FieldRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const editable = Boolean(field && onSave);
  const displayValue = value && value.trim().length > 0 ? value : "Not set";

  const commit = async () => {
    if (!field || !onSave) return;
    setSaving(true);
    try {
      await onSave(field, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-800 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-500">{label}</p>
        {editing ? (
          <div className="mt-1 flex items-center gap-2">
            <input
              type={inputType}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white outline-none focus:border-emerald-400"
            />
            <button
              type="button"
              onClick={commit}
              disabled={saving}
              className="rounded-md bg-emerald-500 px-2 py-1 text-xs font-semibold text-black disabled:opacity-50"
            >
              {saving ? "…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(value);
                setEditing(false);
              }}
              className="rounded-md bg-zinc-700 px-2 py-1 text-xs text-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <p className="truncate text-sm text-white">{displayValue}</p>
        )}
      </div>

      {editable && !editing && (
        <EditButton label={`Edit ${label}`} onClick={() => setEditing(true)} />
      )}
    </div>
  );
}

export default function PersonalInfoSection({
  info,
  username,
  onSave,
}: PersonalInfoSectionProps) {
  return (
    <section
      aria-label="Personal information"
      className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 md:p-5"
    >
      <h2 className="mb-2 text-lg font-semibold text-white">
        Personal Information
      </h2>

      <div>
        {/* Username and email are system/auth managed and not editable here. */}
        <FieldRow label="Username" value={username} />
        <FieldRow label="Email" value={info.email} />
        <FieldRow label="Full Name" value={info.fullName} field="fullName" onSave={onSave} />
        <FieldRow
          label="Birthdate"
          value={info.birthdate}
          field="birthdate"
          inputType="date"
          onSave={onSave}
        />
        <FieldRow label="Gender" value={info.gender} field="gender" onSave={onSave} />
        <FieldRow label="Bio" value={info.bio} field="bio" onSave={onSave} />
      </div>
    </section>
  );
}
