"use client";

import { useState } from "react";
import ArtistFileDropzone from "./ArtistFileDropzone";
import ArtistCollaboratorsInput from "./ArtistCollaboratorsInput";
import { ArtistTrack, AudioFormat, Collaborator, ReleaseType } from "@/types/artistDashboard";
import { ARTIST_GENRES } from "@/data/mockArtistDashboardData";

const MAX_AUDIO_SIZE_MB = 50;
const MAX_COVER_SIZE_MB = 5;
const ALLOWED_AUDIO_EXTENSIONS = ["mp3", "wav", "flac"];
const ALLOWED_COVER_TYPES = ["image/png", "image/jpeg", "image/webp"];

interface ArtistUploadFormProps {
  onSubmit: (track: ArtistTrack) => void;
}

function getExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

// Phase 1: files are validated and held in memory (object URLs / file names)
// only — nothing is actually uploaded to a server yet. Phase 2: swap the
// onSubmit body for a multipart request to the Django upload endpoint.
export default function ArtistUploadForm({ onSubmit }: ArtistUploadFormProps) {
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

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!title.trim()) {
      nextErrors.title = "Track title is required.";
    }

    if (!genre) {
      nextErrors.genre = "Please select a genre.";
    }

    if (!year || year < 1900 || year > currentYear + 1) {
      nextErrors.year = `Enter a valid year between 1900 and ${currentYear + 1}.`;
    }

    if (!audioFile) {
      nextErrors.audio = "An audio file is required.";
    } else {
      const extension = getExtension(audioFile.name);
      if (!ALLOWED_AUDIO_EXTENSIONS.includes(extension)) {
        nextErrors.audio = "Audio must be MP3, WAV, or FLAC.";
      } else if (audioFile.size > MAX_AUDIO_SIZE_MB * 1024 * 1024) {
        nextErrors.audio = `Audio file must be under ${MAX_AUDIO_SIZE_MB}MB.`;
      }
    }

    if (coverFile) {
      if (!ALLOWED_COVER_TYPES.includes(coverFile.type)) {
        nextErrors.cover = "Cover image must be PNG, JPEG, or WebP.";
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage("");

    if (!validate() || !audioFile) return;

    const newTrack: ArtistTrack = {
      id: `trk_${Date.now()}`,
      title: title.trim(),
      releaseType,
      genre,
      year,
      lyrics: lyrics.trim(),
      collaborators,
      coverImageUrl: coverFile ? URL.createObjectURL(coverFile) : undefined,
      audioFileName: audioFile.name,
      audioFormat: getExtension(audioFile.name) as AudioFormat,
      uploadedAt: new Date().toISOString().slice(0, 10),
      analytics: { streams: 0, uniqueListeners: 0 },
    };

    onSubmit(newTrack);
    setSuccessMessage(`"${newTrack.title}" was uploaded successfully.`);
    resetForm();
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
          accept=".mp3,.wav,.flac"
          hint="MP3, WAV, or FLAC — up to 50MB"
          file={audioFile}
          onFileSelect={setAudioFile}
          error={errors.audio}
        />
        <ArtistFileDropzone
          label="Cover Image (optional)"
          accept="image/png,image/jpeg,image/webp"
          hint="PNG, JPEG, or WebP — up to 5MB"
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

      <button
        type="submit"
        className="w-full rounded-lg bg-white py-2.5 font-semibold text-black hover:bg-zinc-200 sm:w-auto sm:px-8"
      >
        Publish Release
      </button>
    </form>
  );
}