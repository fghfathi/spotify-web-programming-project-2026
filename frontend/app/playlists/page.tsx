// frontend/app/playlists/page.tsx
"use client";

// Playlists page — backed by the API (Bug 1). Lists the user's playlists and
// supports create / rename / delete against /api/playlists/. Playlist count
// limits are derived from the real subscription tier.

import { useCallback, useEffect, useState } from "react";
import { SUBSCRIPTION_LIMITS } from "@/data/mockHomeData";
import { Playlist } from "@/types/home";
import PlaylistCard from "@/components/playlists/PlaylistCard";
import RouteGuard from "@/components/shared/RouteGuard";
import { LoadingState, ErrorState } from "@/components/shared/UIStates";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPost, apiPatch, apiDelete, unwrapList } from "@/lib/api";

interface RawPlaylist {
  id: number | string;
  title: string;
  coverImageUrl?: string | null;
  trackCount: number;
}

function limitForTier(tier?: string): number {
  if (tier === "gold") return SUBSCRIPTION_LIMITS.gold;
  if (tier === "silver") return SUBSCRIPTION_LIMITS.silver;
  return SUBSCRIPTION_LIMITS.base;
}

function PlaylistsContent() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const limit = limitForTier(user?.subscription);
  const canCreate = playlists.length < limit;

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiGet<unknown>("/playlists/");
      setPlaylists(
        unwrapList<RawPlaylist>(data).map((p) => ({
          id: String(p.id),
          title: p.title,
          coverImageUrl: p.coverImageUrl ?? undefined,
          trackCount: p.trackCount,
        }))
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!canCreate) {
      alert(
        `Limit reached! Your ${user?.subscription ?? "free"} plan allows max ${
          limit === Infinity ? "unlimited" : limit
        } playlists.`
      );
      return;
    }
    const name = prompt("Enter playlist name:");
    if (!name) return;
    await apiPost("/playlists/", { title: name });
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;
    await apiDelete(`/playlists/${Number(id)}/`);
    await load();
  };

  const handleRename = async (id: string) => {
    const pl = playlists.find((p) => p.id === id);
    const newName = prompt("Enter new name:", pl?.title);
    if (!newName) return;
    await apiPatch(`/playlists/${Number(id)}/`, { title: newName });
    await load();
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Playlists</h1>
          <p className="text-zinc-400 mt-1">
            Plan:{" "}
            <span className="text-amber-400 capitalize">
              {user?.subscription ?? "free"}
            </span>{" "}
            ({playlists.length} / {limit === Infinity ? "∞" : limit})
          </p>
        </div>

        {playlists.length > 0 && (
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="bg-green-500 hover:bg-green-400 disabled:bg-zinc-700 text-black font-bold py-3 px-8 rounded-full transition"
          >
            Create New Playlist
          </button>
        )}
      </header>

      {loading ? (
        <LoadingState label="Loading your playlists…" />
      ) : error ? (
        <ErrorState message="Couldn't load your playlists." onRetry={load} />
      ) : playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl">
          <div className="bg-zinc-900 p-6 rounded-full mb-6">
            <svg className="w-12 h-12 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2ZM21 16c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">No playlists yet</h2>
          <p className="text-zinc-400 mb-8 text-center max-w-xs">
            Create your first playlist and start building your collection.
          </p>
          <button
            onClick={handleCreate}
            className="bg-white text-black font-bold py-3 px-10 rounded-full hover:bg-zinc-200 transition"
          >
            Create Your First Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((pl) => (
            <PlaylistCard
              key={pl.id}
              playlist={pl}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlaylistsPage() {
  return (
    <RouteGuard>
      <PlaylistsContent />
    </RouteGuard>
  );
}
