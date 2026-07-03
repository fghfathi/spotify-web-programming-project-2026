import { SubscriptionType, canEditProfileImage } from "@/types/profile";

interface ProfileAvatarProps {
  name: string;
  imageUrl?: string;
  subscription: SubscriptionType;
}

function FallbackAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      aria-hidden="true"
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700 text-4xl font-semibold text-white"
    >
      {initial}
    </div>
  );
}

// Displays the profile picture (or fallback) and the upload control.
// The upload control's enabled/disabled state is driven by canEditProfileImage,
// which is the single rule Phase 2 will enforce server-side as well.
export default function ProfileAvatar({
  name,
  imageUrl,
  subscription,
}: ProfileAvatarProps) {
  const canEdit = canEditProfileImage(subscription);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-zinc-800 sm:h-32 sm:w-32">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- mock data may use arbitrary external URLs
          <img
            src={imageUrl}
            alt={`${name}'s profile picture`}
            className="h-full w-full object-cover"
          />
        ) : (
          <FallbackAvatar name={name} />
        )}
      </div>

      <button
        type="button"
        disabled={!canEdit}
        className={`mt-3 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
          canEdit
            ? "bg-zinc-800 text-white hover:bg-zinc-700"
            : "cursor-not-allowed bg-zinc-900 text-zinc-600"
        }`}
        title={
          canEdit
            ? "Change profile picture"
            : "Upgrade your subscription to change your profile picture"
        }
      >
        Change photo
      </button>

      {!canEdit && (
        <p className="mt-1 max-w-[10rem] text-center text-[11px] text-zinc-600">
          Photo changes require Silver or Gold
        </p>
      )}
    </div>
  );
}