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

let globalAudio: HTMLAudioElement | null = null;
function getGlobalAudio(): HTMLAudioElement {
  if (!globalAudio) {
    globalAudio = document.createElement("audio");
    globalAudio.preload = "metadata";
    globalAudio.style.display = "none";
    document.body.appendChild(globalAudio);
  }
  return globalAudio;
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(getGlobalAudio());
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
    const audio = getGlobalAudio();
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      const q = queueRef.current;
      if (q.length > 0) {
        const next = q[0];
        setQueue(q.slice(1));
        playEpisodeRef.current(next);
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    if (audio.src && !audio.paused) {
      setIsPlaying(true);
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    }

    return () => {
      console.log("AUDIO_PROVIDER: re-mounting (audio persists via singleton)");
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
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
