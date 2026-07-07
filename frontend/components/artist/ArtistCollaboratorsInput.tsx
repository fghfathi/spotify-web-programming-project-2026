"use client";

import { useState } from "react";
import { Collaborator } from "@/types/artistDashboard";

interface ArtistCollaboratorsInputProps {
  collaborators: Collaborator[];
  onChange: (collaborators: Collaborator[]) => void;
}

// Tag-style input for adding/removing collaborators on a release.
export default function ArtistCollaboratorsInput({
  collaborators,
  onChange,
}: ArtistCollaboratorsInputProps) {
  const [draft, setDraft] = useState("");

  const addCollaborator = () => {
    const name = draft.trim();
    if (!name) return;

    if (collaborators.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setDraft("");
      return;
    }

    onChange([...collaborators, { id: `col_${Date.now()}`, name }]);
    setDraft("");
  };

  const removeCollaborator = (id: string) => {
    onChange(collaborators.filter((c) => c.id !== id));
  };

  return (
    <div>
      <label className="mb-2 block text-sm text-zinc-300">Collaborators (optional)</label>

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCollaborator();
            }
          }}
          placeholder="Add a collaborator and press Enter"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-white"
        />
        <button
          type="button"
          onClick={addCollaborator}
          className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white hover:border-zinc-500"
        >
          Add
        </button>
      </div>

      {collaborators.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {collaborators.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-200"
            >
              {c.name}
              <button
                type="button"
                onClick={() => removeCollaborator(c.id)}
                aria-label={`Remove ${c.name}`}
                className="text-zinc-500 hover:text-red-400"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}