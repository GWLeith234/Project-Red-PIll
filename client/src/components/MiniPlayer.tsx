import { useState } from "react";
import { useAudioPlayer } from "./AudioPlayerProvider";
import { Play, Pause, SkipBack, SkipForward, X, Volume2, VolumeX, ChevronDown, Mic, ListMusic } from "lucide-react";

function formatTime(seconds: number) {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function FullScreenPlayer({ onClose }: { onClose: () => void }) {
  const {
    currentEpisode, isPlaying, currentTime, duration, volume, playbackRate,
    pause, resume, seek, setVolume, setPlaybackRate, queue,
  } = useAudioPlayer();

  if (!currentEpisode) return null;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[200] bg-gray-950 flex flex-col" data-testid="fullscreen-player">
      <div className="flex items-center justify-between px-4 py-3 safe-area-top">
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors" data-testid="button-close-fullscreen">
          <ChevronDown className="h-6 w-6" />
        </button>
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Now Playing</span>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 max-w-lg mx-auto w-full">
        <div className="w-full aspect-square max-w-[320px] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 mb-8">
          {currentEpisode.coverImage ? (
            <img src={currentEpisode.coverImage} alt="" className="w-full h-full object-cover" data-testid="img-fullscreen-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <Mic className="h-20 w-20 text-gray-600" />
            </div>
          )}
        </div>

        <div className="w-full text-center mb-6">
          <h2 className="text-xl font-bold text-white truncate" data-testid="text-fullscreen-title">{currentEpisode.title}</h2>
          <p className="text-sm text-gray-400 mt-1 truncate" data-testid="text-fullscreen-podcast">{currentEpisode.podcastTitle}</p>
        </div>

        <div className="w-full mb-6">
          <div
            className="relative w-full h-2 bg-gray-800 rounded-full cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seek(pct * duration);
            }}
            data-testid="slider-fullscreen-progress"
          >
            <div className="absolute left-0 top-0 h-full bg-amber-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-4 w-4 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, marginLeft: "-8px" }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500 font-mono">{formatTime(currentTime)}</span>
            <span className="text-xs text-gray-500 font-mono">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 mb-8">
          <button
            onClick={() => seek(Math.max(0, currentTime - 15))}
            className="p-3 text-gray-300 hover:text-white transition-colors relative"
            data-testid="button-fullscreen-skip-back"
          >
            <SkipBack className="h-7 w-7" />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 font-mono">15</span>
          </button>
          <button
            onClick={() => (isPlaying ? pause() : resume())}
            className="h-16 w-16 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            data-testid="button-fullscreen-play-pause"
          >
            {isPlaying ? (
              <Pause className="h-7 w-7 text-gray-900" />
            ) : (
              <Play className="h-7 w-7 text-gray-900 ml-0.5" />
            )}
          </button>
          <button
            onClick={() => seek(Math.min(duration, currentTime + 30))}
            className="p-3 text-gray-300 hover:text-white transition-colors relative"
            data-testid="button-fullscreen-skip-forward"
          >
            <SkipForward className="h-7 w-7" />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 font-mono">30</span>
          </button>
        </div>

        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setVolume(volume === 0 ? 1 : 0)}
              className="text-gray-400 hover:text-white transition-colors"
              data-testid="button-fullscreen-mute"
            >
              {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-1 accent-amber-500"
              data-testid="slider-fullscreen-volume"
            />
          </div>
          <button
            onClick={() => {
              const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
              const idx = rates.indexOf(playbackRate);
              setPlaybackRate(rates[(idx + 1) % rates.length]);
            }}
            className="px-3 py-1 text-xs font-mono text-gray-400 hover:text-white border border-gray-700 rounded-full hover:border-gray-500 transition-colors"
            data-testid="button-fullscreen-speed"
          >
            {playbackRate}x
          </button>
          {queue.length > 0 && (
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <ListMusic className="h-3.5 w-3.5" />
              <span>{queue.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MiniPlayer() {
  const { currentEpisode, isPlaying, currentTime, duration, pause, resume, seek } = useAudioPlayer();
  const [expanded, setExpanded] = useState(false);

  if (!currentEpisode) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (expanded) {
    return <FullScreenPlayer onClose={() => setExpanded(false)} />;
  }

  return (
    <div
      className="fixed left-0 right-0 bottom-14 lg:bottom-0 z-40 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800/50"
      data-testid="mini-player"
    >
      <div
        className="absolute top-0 left-0 h-[2px] bg-amber-500 transition-all"
        style={{ width: `${progress}%` }}
        data-testid="mini-player-progress"
      />

      <div className="max-w-[1400px] mx-auto px-3 py-2 flex items-center gap-3">
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
          data-testid="button-expand-player"
        >
          <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
            {currentEpisode.coverImage ? (
              <img src={currentEpisode.coverImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Mic className="h-4 w-4 text-gray-500" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate" data-testid="text-mini-title">{currentEpisode.title}</p>
            <p className="text-xs text-gray-400 truncate" data-testid="text-mini-podcast">{currentEpisode.podcastTitle}</p>
          </div>
        </button>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => seek(Math.max(0, currentTime - 15))}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            data-testid="button-mini-skip-back"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            onClick={() => (isPlaying ? pause() : resume())}
            className="p-2 text-white hover:text-amber-500 transition-colors"
            data-testid="button-mini-play-pause"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
          <button
            onClick={() => seek(Math.min(duration, currentTime + 30))}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            data-testid="button-mini-skip-forward"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
