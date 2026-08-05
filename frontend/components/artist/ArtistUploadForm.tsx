"use client";

import { useState } from "react";
import ArtistFileDropzone from "./ArtistFileDropzone";
import ArtistCollaboratorsInput from "./ArtistCollaboratorsInput";
import { Collaborator, ReleaseType } from "@/types/artistDashboard";
import { ARTIST_GENRES } from "@/data/mockArtistDashboardData";
import { apiUploadWithProgress, ApiError } from "@/lib/api";

// Limits mirror the backend validators (Step 4): audio .mp3/.wav/.m4a up to
// 20MB, cover .jpg/.jpeg/.png up to 2MB.
const MAX_AUDIO_SIZE_MB = 20;
const MAX_COVER_SIZE_MB = 2;
const ALLOWED_AUDIO_EXTENSIONS = ["mp3", "wav", "m4a"];
const ALLOWED_COVER_TYPES = ["image/png", "image/jpeg"];

interface ArtistUploadFormProps {
  // Called after a successful upload so the dashboard can refresh its list.
  onUploaded: () => void;
}

function getExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

// Reads the audio file's duration (seconds) client-side so the stored
// metadata matches the file. Resolves 0 if it cannot be determined.
function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0);
    };
    audio.onerror = () => resolve(0);
    audio.src = URL.createObjectURL(file);
  });
}

export default function ArtistUploadForm({ onUploaded }: ArtistUploadFormProps) {
  const currentYear = new Date().getFullYear();

  const [title, setTitle] = useState("");
  const [releaseType, setReleaseType] = useState<ReleaseType>("single");
  const [genre, setGenre] = useState(ARTIST_GENRES[0]);
  const [year, setYear] = useState(currentYear);
  const [lyrics, setLyrics] = useState("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!title.trim()) nextErrors.title = "Track title is required.";
    if (!genre) nextErrors.genre = "Please select a genre.";
    if (!year || year < 1900 || year > currentYear + 1) {
      nextErrors.year = `Enter a valid year between 1900 and ${currentYear + 1}.`;
    }

    if (!audioFile) {
      nextErrors.audio = "An audio file is required.";
    } else {
      const extension = getExtension(audioFile.name);
      if (!ALLOWED_AUDIO_EXTENSIONS.includes(extension)) {
        nextErrors.audio = "Audio must be MP3, WAV, or M4A.";
      } else if (audioFile.size > MAX_AUDIO_SIZE_MB * 1024 * 1024) {
        nextErrors.audio = `Audio file must be under ${MAX_AUDIO_SIZE_MB}MB.`;
      }
    }

    if (coverFile) {
      if (!ALLOWED_COVER_TYPES.includes(coverFile.type)) {
        nextErrors.cover = "Cover image must be PNG or JPEG.";
      } else if (coverFile.size > MAX_COVER_SIZE_MB * 1024 * 1024) {
        nextErrors.cover = `Cover image must be under ${MAX_COVER_SIZE_MB}MB.`;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setTitle("");
    setReleaseType("single");
    setGenre(ARTIST_GENRES[0]);
    setYear(currentYear);
    setLyrics("");
    setCollaborators([]);
    setAudioFile(null);
    setCoverFile(null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage("");
    if (!validate() || !audioFile) return;

    const duration = await readAudioDuration(audioFile);

    const form = new FormData();
    form.append("title", title.trim());
    form.append("audio_file", audioFile);
    if (coverFile) form.append("cover_image", coverFile);
    form.append("genre", genre);
    form.append("lyrics", lyrics.trim());
    form.append("duration_seconds", String(duration));
    // The backend derives single vs album from album membership; new uploads
    // are standalone tracks. release_date uses the chosen year.
    form.append("release_date", `${year}-01-01`);

    setUploading(true);
    setProgress(0);
    try {
      await apiUploadWithProgress("/me/tracks/", form, setProgress, "POST");
      setSuccessMessage(`"${title.trim()}" was uploaded successfully.`);
      resetForm();
      onUploaded();
    } catch (err) {
      setErrors({
        submit:
          err instanceof ApiError ? err.message : "Upload failed. Try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 md:p-6"
    >
      <div>
        <h2 className="text-lg font-semibold text-white">Upload New Release</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Add a new single or album to your catalog.
        </p>
      </div>

      {successMessage && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {successMessage}
        </p>
      )}
      {errors.submit && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errors.submit}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm text-zinc-300">Track / Album Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Neon Hours"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-white"
          />
          {errors.title && <p className="mt-1.5 text-xs text-red-400">{errors.title}</p>}
        </div>

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
          {errors.genre && <p className="mt-1.5 text-xs text-red-400">{errors.genre}</p>}
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
          {errors.year && <p className="mt-1.5 text-xs text-red-400">{errors.year}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ArtistFileDropzone
          label="Audio File"
          accept=".mp3,.wav,.m4a"
          hint="MP3, WAV, or M4A — up to 20MB"
          file={audioFile}
          onFileSelect={setAudioFile}
          error={errors.audio}
        />
        <ArtistFileDropzone
          label="Cover Image (optional)"
          accept="image/png,image/jpeg"
          hint="PNG or JPEG — up to 2MB"
          file={coverFile}
          onFileSelect={setCoverFile}
          error={errors.cover}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-zinc-300">Lyrics (optional)</label>
        <textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          rows={5}
          placeholder="Paste the lyrics here..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-white"
        />
      </div>

      <ArtistCollaboratorsInput collaborators={collaborators} onChange={setCollaborators} />

      {uploading && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-zinc-400">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={uploading}
        className="w-full rounded-lg bg-white py-2.5 font-semibold text-black hover:bg-zinc-200 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {uploading ? "Publishing…" : "Publish Release"}
      </button>
    </form>
  );
}
