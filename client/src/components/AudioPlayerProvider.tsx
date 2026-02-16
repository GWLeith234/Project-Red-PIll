import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";

export interface AudioEpisode {
  id: string;
  title: string;
  podcastTitle: string;
  audioUrl: string;
  coverImage?: string | null;
  duration?: string | null;
  podcastId?: string;
}

interface AudioPlayerContextType {
  currentEpisode: AudioEpisode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  queue: AudioEpisode[];
  play: (episode: AudioEpisode) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  setPlaybackRate: (r: number) => void;
  addToQueue: (episode: AudioEpisode) => void;
  playNext: () => void;
  playPrevious: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return ctx;
}

export function useAudioPlayerOptional() {
  return useContext(AudioPlayerContext);
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<AudioEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [queue, setQueue] = useState<AudioEpisode[]>([]);
  const [history, setHistory] = useState<AudioEpisode[]>([]);

  const queueRef = useRef(queue);
  const historyRef = useRef(history);
  const currentEpisodeRef = useRef(currentEpisode);
  const volumeRef = useRef(volume);
  const playbackRateRef = useRef(playbackRate);

  queueRef.current = queue;
  historyRef.current = history;
  currentEpisodeRef.current = currentEpisode;
  volumeRef.current = volume;
  playbackRateRef.current = playbackRate;

  const playEpisodeRef = useRef<(episode: AudioEpisode) => void>(() => {});

  useEffect(() => {
    console.log("AUDIO_PROVIDER: mounting");
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.style.display = "none";
    document.body.appendChild(audio);
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("durationchange", () => setDuration(audio.duration || 0));
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration || 0));
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      const q = queueRef.current;
      if (q.length > 0) {
        const next = q[0];
        setQueue(q.slice(1));
        playEpisodeRef.current(next);
      }
    });

    return () => {
      console.log("AUDIO_PROVIDER: unmounting - THIS SHOULD ONLY HAPPEN ON APP CLOSE");
      audio.pause();
      audio.src = "";
      document.body.removeChild(audio);
    };
  }, []);

  const playEpisode = useCallback((episode: AudioEpisode) => {
    console.log("AUDIO_PROVIDER: playing", episode.title);
    const audio = audioRef.current;
    if (!audio) return;
    if (!episode.audioUrl) {
      console.warn("No audio URL for episode:", episode.title);
      return;
    }

    const cur = currentEpisodeRef.current;
    if (cur) {
      setHistory((h) => [cur, ...h.slice(0, 49)]);
    }

    setCurrentEpisode(episode);
    audio.src = episode.audioUrl;
    audio.volume = volumeRef.current;
    audio.playbackRate = playbackRateRef.current;
    audio.play().catch((err) => console.error("Audio play error:", err));

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: episode.title,
        artist: episode.podcastTitle,
        album: "MediaTech Empire",
        artwork: episode.coverImage
          ? [{ src: episode.coverImage, sizes: "512x512", type: "image/png" }]
          : [],
      });
    }
  }, []);

  playEpisodeRef.current = playEpisode;

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const audio = audioRef.current;
    if (!audio) return;

    navigator.mediaSession.setActionHandler("play", () => audio.play());
    navigator.mediaSession.setActionHandler("pause", () => audio.pause());
    navigator.mediaSession.setActionHandler("seekbackward", () => {
      audio.currentTime = Math.max(0, audio.currentTime - 15);
    });
    navigator.mediaSession.setActionHandler("seekforward", () => {
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 30);
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      const h = historyRef.current;
      if (h.length > 0) {
        const prev = h[0];
        setHistory(h.slice(1));
        playEpisodeRef.current(prev);
      }
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      const q = queueRef.current;
      if (q.length > 0) {
        const next = q[0];
        setQueue(q.slice(1));
        playEpisodeRef.current(next);
      }
    });
  }, []);

  const pause = useCallback(() => {
    console.log("AUDIO_PROVIDER: paused");
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const setPlaybackRateHandler = useCallback((r: number) => {
    setPlaybackRateState(r);
    if (audioRef.current) audioRef.current.playbackRate = r;
  }, []);

  const addToQueue = useCallback((episode: AudioEpisode) => {
    setQueue((q) => [...q, episode]);
  }, []);

  const playNext = useCallback(() => {
    const q = queueRef.current;
    if (q.length > 0) {
      const next = q[0];
      setQueue(q.slice(1));
      playEpisode(next);
    }
  }, [playEpisode]);

  const playPrevious = useCallback(() => {
    const h = historyRef.current;
    if (h.length > 0) {
      const prev = h[0];
      setHistory(h.slice(1));
      playEpisode(prev);
    }
  }, [playEpisode]);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentEpisode,
        isPlaying,
        currentTime,
        duration,
        volume,
        playbackRate,
        queue,
        play: playEpisode,
        pause,
        resume,
        seek,
        setVolume,
        setPlaybackRate: setPlaybackRateHandler,
        addToQueue,
        playNext,
        playPrevious,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}
