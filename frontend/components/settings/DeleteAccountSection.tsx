"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SettingsCard from "./SettingsCard";
import Modal from "./Modal";
import { clearMockAccount } from "@/lib/settingsStorage";

export default function DeleteAccountSection() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleConfirmDelete = () => {
    setIsDeleting(true);

    // Phase 1: no backend call. Simulate deletion by clearing the mock
    // session and settings, then sending the user back to login/register.
    clearMockAccount();
    router.push("/");
  };

  return (
    <SettingsCard
      title="Delete account"
      description="Permanently remove your account and all associated data."
    >
      <div className="flex flex-col gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-300">
          This action cannot be undone. You will be signed out immediately.
        </p>

        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="shrink-0 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400"
        >
          Delete account
        </button>
      </div>

      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Delete your account?"
      >
        <p>
          This will permanently remove your account. This action cannot be
          undone.
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            disabled={isDeleting}
            className="w-full rounded-lg bg-zinc-800 py-2.5 font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="w-full rounded-lg bg-red-500 py-2.5 font-semibold text-white hover:bg-red-400 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Yes, delete"}
          </button>
        </div>
      </Modal>
    </SettingsCard>
  );
}
