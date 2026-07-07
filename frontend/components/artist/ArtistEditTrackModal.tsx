"use client";

import { useState } from "react";
import { ArtistTrack, Collaborator, ReleaseType } from "@/types/artistDashboard";
import { ARTIST_GENRES } from "@/data/mockArtistDashboardData";
import ArtistCollaboratorsInput from "./ArtistCollaboratorsInput";

interface ArtistEditTrackModalProps {
  track: ArtistTrack;
  onSave: (updated: ArtistTrack) => void;
  onClose: () => void;
}

// Edits metadata only. Swapping the underlying audio file is intentionally
// out of scope here — the release must be deleted and re-uploaded instead,
// which keeps validation logic in one place (ArtistUploadForm).
export default function ArtistEditTrackModal({
  track,
  onSave,
  onClose,
}: ArtistEditTrackModalProps) {
  const currentYear = new Date().getFullYear();

  const [title, setTitle] = useState(track.title);
  const [releaseType, setReleaseType] = useState<ReleaseType>(track.releaseType);
  const [genre, setGenre] = useState(track.genre);
  const [year, setYear] = useState(track.year);
  const [lyrics, setLyrics] = useState(track.lyrics);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(track.collaborators);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Track title is required.");
      return;
    }
    if (!year || year < 1900 || year > currentYear + 1) {
      setError(`Enter a valid year between 1900 and ${currentYear + 1}.`);
      return;
    }

    onSave({
      ...track,
      title: title.trim(),
      releaseType,
      genre,
      year,
      lyrics: lyrics.trim(),
      collaborators,
    });
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Edit Release</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <div>
            <label className="mb-2 block text-sm text-zinc-300">Track / Album Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Release Type</label>
              <select
                value={releaseType}
                onChange={(e) => setReleaseType(e.target.value as ReleaseType)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-white"
              >
                <option value="single">Single</option>
                <option value="album">Album</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-white"
              >
                {ARTIST_GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">Release Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={1900}
              max={currentYear + 1}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">Lyrics</label>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white outline-none focus:border-white"
            />
          </div>

          <ArtistCollaboratorsInput collaborators={collaborators} onChange={setCollaborators} />

          <p className="text-xs text-zinc-500">
            Audio file: <span className="text-zinc-300">{track.audioFileName}</span>. To replace
            the audio file, delete this release and upload it again.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-700 py-2.5 font-semibold text-white hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-white py-2.5 font-semibold text-black hover:bg-zinc-200"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}