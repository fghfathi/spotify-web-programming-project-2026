import { PersonalInfo } from "@/types/profile";
import EditButton from "@/components/shared/EditButton";

interface PersonalInfoSectionProps {
  info: PersonalInfo;
  username: string;
}

interface FieldRowProps {
  label: string;
  value: string;
  editable?: boolean;
}

function FieldRow({ label, value, editable = true }: FieldRowProps) {
  // Empty-state handling: shows a clear placeholder instead of blank space.
  const displayValue = value && value.trim().length > 0 ? value : "Not set";

  return (
    <div className="flex items-center justify-between border-b border-zinc-800 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="truncate text-sm text-white">{displayValue}</p>
      </div>

      {editable && (
        <EditButton
          label={`Edit ${label}`}
          onClick={() => {
            // Phase 1: UI-only action, no persistence.
            // eslint-disable-next-line no-console
            console.log(`Edit requested for field: ${label}`);
          }}
        />
      )}
    </div>
  );
}

export default function PersonalInfoSection({
  info,
  username,
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
        {/* Username is system-assigned and intentionally not editable. */}
        <FieldRow label="Username" value={username} editable={false} />
        <FieldRow label="Full Name" value={info.fullName} />
        <FieldRow label="Email" value={info.email} />
        <FieldRow label="Birthdate" value={info.birthdate} />
        <FieldRow label="Gender" value={info.gender} />
        <FieldRow label="Bio" value={info.bio} />
      </div>
    </section>
  );
}