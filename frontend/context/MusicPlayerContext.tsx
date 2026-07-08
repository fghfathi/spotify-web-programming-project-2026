"use client";

// frontend/context/MusicPlayerContext.tsx
//
// Global playback state, backed by a single native <audio> element.
// Mounted once in app/layout.tsx so the player (and playback) survives
// route changes. Components read/act on the player via useMusicPlayer().

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { Song } from "@/types/music";
import { RepeatMode } from "@/types/player";

interface MusicPlayerContextValue {
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number; // 0-1
  currentTime: number; // seconds
  duration: number; // seconds
  repeatMode: RepeatMode;
  isShuffled: boolean;
  isQueueOpen: boolean;
  isLyricsOpen: boolean;

  playSong: (song: Song, queue?: Song[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  toggleQueuePanel: () => void;
  toggleLyricsPanel: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | undefined>(
  undefined
);

const VOLUME_STORAGE_KEY = "shpotify_player_volume";

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [isShuffled, setIsShuffled] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);

  // Mirrors the latest queue/index/repeatMode so stable callbacks (attached
  // once as event listeners) always read fresh values instead of a stale
  // closure from the render they were created in.
  const stateRef = useRef({ queue, currentIndex });
  useEffect(() => {
    stateRef.current = { queue, currentIndex };
  }, [queue, currentIndex]);

  const repeatModeRef = useRef(repeatMode);
  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  // Keeps the pre-shuffle order so shuffle can be toggled off cleanly.
  const originalQueueRef = useRef<Song[]>([]);

  const currentSong =
    currentIndex >= 0 ? queue[currentIndex] ?? null : null;

  const playIndex = useCallback((index: number) => {
    const audio = audioRef.current;
    const q = stateRef.current.queue;
    if (!audio || index < 0 || index >= q.length) return;

    const song = q[index];
    stateRef.current = { queue: q, currentIndex: index };
    setCurrentIndex(index);

    audio.src = song.audioUrl || "";
    audio.currentTime = 0;
    setCurrentTime(0);

    if (song.audioUrl) {
      audio.play().catch(() => {
        // Autoplay can be blocked by the browser; UI still reflects intent.
      });
      setIsPlaying(true);
    } else {
      // Phase 1 mock songs may not have a real audio source. Keep the UI
      // functional (track "selected") without pretending audio is playing.
      setIsPlaying(false);
    }
  }, []);

  const playNext = useCallback(() => {
    const { queue: q, currentIndex: idx } = stateRef.current;
    if (q.length === 0) return;

    if (idx + 1 < q.length) {
      playIndex(idx + 1);
    } else if (repeatModeRef.current === "all") {
      playIndex(0);
    } else {
      setIsPlaying(false);
    }
  }, [playIndex]);

  const playPrevious = useCallback(() => {
    const { queue: q, currentIndex: idx } = stateRef.current;
    if (q.length === 0) return;
    const audio = audioRef.current;

    // Restart the current track instead of going back, once it's more
    // than a few seconds in — matches common player behavior.
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (idx - 1 >= 0) {
      playIndex(idx - 1);
    } else if (repeatModeRef.current === "all") {
      playIndex(q.length - 1);
    }
  }, [playIndex]);

  const handleEnded = useCallback(() => {
    const audio = audioRef.current;
    if (repeatModeRef.current === "one" && audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }
    playNext();
  }, [playNext]);

  // Create the audio element once, client-side only, and wire up its events.
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const savedVolume =
      typeof window !== "undefined"
        ? window.localStorage.getItem(VOLUME_STORAGE_KEY)
        : null;
    const initialVolume = savedVolume ? Number(savedVolume) : 0.7;
    audio.volume = initialVolume;
    setVolumeState(initialVolume);

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
    };
  }, [handleEnded]);

  const playSong = useCallback(
    (song: Song, newQueue?: Song[]) => {
      const q = newQueue && newQueue.length > 0 ? newQueue : [song];
      originalQueueRef.current = q;
      const index = q.findIndex((s) => s.id === song.id);

      setQueue(q);
      stateRef.current = { queue: q, currentIndex: index >= 0 ? index : 0 };
      playIndex(index >= 0 ? index : 0);
    },
    [playIndex]
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || stateRef.current.queue.length === 0) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((next: number) => {
    const audio = audioRef.current;
    const clamped = Math.min(1, Math.max(0, next));
    if (audio) audio.volume = clamped;
    setVolumeState(clamped);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      const next = !prev;
      const current = stateRef.current.queue[stateRef.current.currentIndex];

      if (next) {
        // Shuffle everything except the current track, which stays first.
        const rest = originalQueueRef.current.filter(
          (s) => s.id !== current?.id
        );
        const shuffled = [...rest].sort(() => Math.random() - 0.5);
        const newQueue = current ? [current, ...shuffled] : shuffled;

        setQueue(newQueue);
        stateRef.current = { queue: newQueue, currentIndex: 0 };
        setCurrentIndex(0);
      } else {
        const restored = originalQueueRef.current;
        const idx = current
          ? restored.findIndex((s) => s.id === current.id)
          : 0;

        setQueue(restored);
        stateRef.current = { queue: restored, currentIndex: idx < 0 ? 0 : idx };
        setCurrentIndex(idx < 0 ? 0 : idx);
      }

      return next;
    });
  }, []);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) =>
      prev === "off" ? "all" : prev === "all" ? "one" : "off"
    );
  }, []);

  const addToQueue = useCallback((song: Song) => {
    setQueue((prev) => {
      const next = [...prev, song];
      stateRef.current = { queue: next, currentIndex: stateRef.current.currentIndex };
      return next;
    });
    originalQueueRef.current = [...originalQueueRef.current, song];
  }, []);

  const removeFromQueue = useCallback((songId: string) => {
    setQueue((prev) => {
      const removeIdx = prev.findIndex((s) => s.id === songId);
      if (removeIdx === -1) return prev;

      const next = prev.filter((s) => s.id !== songId);
      let newIndex = stateRef.current.currentIndex;

      if (removeIdx < newIndex) {
        newIndex -= 1;
      } else if (removeIdx === newIndex) {
        newIndex = Math.min(newIndex, next.length - 1);
      }

      stateRef.current = { queue: next, currentIndex: newIndex };
      setCurrentIndex(newIndex);
      return next;
    });
    originalQueueRef.current = originalQueueRef.current.filter(
      (s) => s.id !== songId
    );
  }, []);

  const toggleQueuePanel = useCallback(() => setIsQueueOpen((v) => !v), []);
  const toggleLyricsPanel = useCallback(() => setIsLyricsOpen((v) => !v), []);

  const value: MusicPlayerContextValue = {
    currentSong,
    queue,
    currentIndex,
    isPlaying,
    volume,
    currentTime,
    duration,
    repeatMode,
    isShuffled,
    isQueueOpen,
    isLyricsOpen,
    playSong,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeatMode,
    addToQueue,
    removeFromQueue,
    toggleQueuePanel,
    toggleLyricsPanel,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer(): MusicPlayerContextValue {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) {
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
  }
  return ctx;
}
