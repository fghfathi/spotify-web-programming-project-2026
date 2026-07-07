"use client";

interface ArtistFileDropzoneProps {
  label: string;
  accept: string;
  hint: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  error?: string;
}

// Generic drag-and-drop / click-to-browse file picker, reused for both
// audio and cover image uploads in the Upload form.
export default function ArtistFileDropzone({
  label,
  accept,
  hint,
  file,
  onFileSelect,
  error,
}: ArtistFileDropzoneProps) {
  const inputId = `dropzone-${label.replace(/\s+/g, "-").toLowerCase()}`;

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFileSelect(dropped);
  };

  return (
    <div>
      <label className="mb-2 block text-sm text-zinc-300">{label}</label>
      <label
        htmlFor={inputId}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition ${
          error
            ? "border-red-500/50 bg-red-500/5"
            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500"
        }`}
      >
        <svg
          className="h-6 w-6 text-zinc-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {file ? (
          <p className="max-w-full truncate text-sm font-medium text-white">{file.name}</p>
        ) : (
          <>
            <p className="text-sm text-zinc-300">Drag &amp; drop or click to browse</p>
            <p className="text-xs text-zinc-500">{hint}</p>
          </>
        )}

        <input
          id={inputId}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)}
        />
      </label>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}

      {file && (
        <button
          type="button"
          onClick={() => onFileSelect(null)}
          className="mt-1.5 text-xs text-zinc-500 hover:text-white"
        >
          Remove file
        </button>
      )}
    </div>
  );
}