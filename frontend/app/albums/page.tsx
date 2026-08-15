"use client";

// Albums & Singles (Browse) page — backed by the API (Bug 1 + Bug 2).
// Albums, singles and the user's playlists come from the backend; playback is
// driven by the global music player and playlist membership is persisted via
// /api/playlists/<id>/tracks/.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Song, Album, Playlist } from "@/types/music";
import AlbumCard from "@/components/albums/AlbumCard";
import SingleCard from "@/components/albums/SingleCard";
import PlaylistSelector from "@/components/albums/PlaylistSelector";
import RouteGuard from "@/components/shared/RouteGuard";
import { LoadingState, ErrorState } from "@/components/shared/UIStates";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { apiGet, apiPost, apiDelete, unwrapList } from "@/lib/api";
import { ApiSong, toSongs } from "@/lib/mappers";

interface RawAlbum {
  id: number | string;
  title: string;
  artistId: string;
  artistName: string;
  releaseDate: string;
  coverUrl?: string | null;
  songs: ApiSong[];
}
interface RawPlaylist {
  id: number | string;
  title: string;
  trackCount: number;
  songs: ApiSong[];
}

function mapAlbum(a: RawAlbum): Album {
  return {
    id: String(a.id),
    title: a.title,
    artistId: a.artistId,
    artistName: a.artistName,
    releaseDate: a.releaseDate,
    coverUrl: a.coverUrl ?? undefined,
    songs: toSongs(a.songs),
  };
}
function mapPlaylist(p: RawPlaylist): Playlist {
  return {
    id: String(p.id),
    title: p.title,
    trackCount: p.trackCount,
    songs: toSongs(p.songs),
  };
}

function AlbumsContent() {
  const router = useRouter();
  const { playSong } = useMusicPlayer();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"plays" | "date">("plays");

  const loadPlaylists = useCallback(async () => {
    const data = await apiGet<unknown>("/playlists/");
    setPlaylists(unwrapList<RawPlaylist>(data).map(mapPlaylist));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [albumsRaw, songsRaw] = await Promise.all([
        apiGet<unknown>("/albums/"),
        apiGet<unknown>("/songs/"),
      ]);
      setAlbums(unwrapList<RawAlbum>(albumsRaw).map(mapAlbum));
      setSongs(toSongs(unwrapList<ApiSong>(songsRaw)));
      await loadPlaylists();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [loadPlaylists]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTogglePlaylist = async (playlistId: string, song: Song) => {
    const pl = playlists.find((p) => p.id === playlistId);
    const already = pl?.songs?.some((s) => s.id === song.id);
    try {
      if (already) {
        await apiDelete(`/playlists/${Number(playlistId)}/tracks/${Number(song.id)}/`);
      } else {
        await apiPost(`/playlists/${Number(playlistId)}/tracks/`, {
          songId: Number(song.id),
        });
      }
      await loadPlaylists();
    } catch {
      /* ignore — the selector simply won't reflect the change */
    }
  };

  const handleArtistClick = (artistId: string) => router.push(`/artist/${artistId}`);
  const handleAlbumClick = (albumId: string) => {
    const album = albums.find((a) => a.id === albumId);
    if (album) setSelectedAlbum(album);
  };

  const sortedAlbums = useMemo(() => {
    const filtered = albums.filter(
      (a) =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.artistName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return [...filtered].sort(
      (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );
  }, [albums, searchTerm]);

  const sortedSongs = useMemo(() => {
    const filtered = songs.filter(
      (s) =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.artistName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      if (sortBy === "plays") return b.playsCount - a.playsCount;
      return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
    });
  }, [songs, searchTerm, sortBy]);

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 pb-32">
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Music Archive</h1>
        <p className="text-zinc-400 text-sm">Explore albums, singles, and artists.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 mb-8">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search songs or artists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500 transition"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs text-zinc-400 shrink-0">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "plays" | "date")}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-green-500 transition cursor-pointer text-zinc-300 w-full md:w-40"
          >
            <option value="plays">Popularity (Plays)</option>
            <option value="date">Release Date</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading the music archive…" />
      ) : error ? (
        <ErrorState message="Couldn't load the catalog." onRetry={load} />
      ) : (
        <div className="space-y-12">
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span>Albums</span>
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                {sortedAlbums.length}
              </span>
            </h2>
            {sortedAlbums.length === 0 ? (
              <p className="text-sm text-zinc-500">No albums found.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {sortedAlbums.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    onAlbumClick={handleAlbumClick}
                    onArtistClick={handleArtistClick}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span>Singles & Tracks</span>
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                {sortedSongs.length}
              </span>
            </h2>
            {sortedSongs.length === 0 ? (
              <p className="text-sm text-zinc-500">No tracks found.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {sortedSongs.map((song) => (
                  <SingleCard
                    key={song.id}
                    song={song}
                    playlists={playlists}
                    onPlay={(sg) => playSong(sg, sortedSongs)}
                    onArtistClick={handleArtistClick}
                    onAlbumClick={handleAlbumClick}
                    onTogglePlaylist={handleTogglePlaylist}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {selectedAlbum && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-green-500 font-bold">Album View</span>
                <h2 className="text-2xl font-bold text-white mt-1">{selectedAlbum.title}</h2>
                <p className="text-zinc-400 text-sm mt-0.5">by {selectedAlbum.artistName}</p>
              </div>
              <button
                onClick={() => setSelectedAlbum(null)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3">
              <p className="text-xs text-zinc-500">Released: {selectedAlbum.releaseDate}</p>
              <div className="space-y-2 mt-4">
                {selectedAlbum.songs.map((song, idx) => (
                  <div
                    key={song.id}
                    onClick={() => {
                      playSong(song, selectedAlbum.songs);
                      setSelectedAlbum(null);
                    }}
                    className="flex justify-between items-center bg-zinc-950 hover:bg-zinc-800 p-3 rounded-lg cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500 font-mono text-xs">{idx + 1}</span>
                      <span className="text-sm font-semibold text-zinc-200">{song.title}</span>
                      {song.genre && (
                        <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                          {song.genre}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-zinc-500">{song.duration}</span>
                      <PlaylistSelector
                        song={song}
                        playlists={playlists}
                        onTogglePlaylist={handleTogglePlaylist}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlbumsAndSinglesPage() {
  return (
    <RouteGuard>
      <AlbumsContent />
    </RouteGuard>
  );
}
