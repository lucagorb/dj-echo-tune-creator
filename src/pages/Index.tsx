import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Pause, Play, SkipBack, SkipForward, Settings } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Placeholder data
  const currentTrack = {
    title: "Waiting for Echo…",
    artist: "Press the mic to start",
    cover: null as string | null,
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-4 py-8 md:py-12 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />

      {/* Top bar */}
      <header className="w-full max-w-md flex items-center justify-between relative z-10">
        <div>
          <p className="text-xs font-mono tracking-[0.3em] uppercase text-primary">
            DJ Echo
          </p>
        </div>
        <button
          onClick={() => navigate("/settings")}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/80"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </header>

      {/* Album Art + Track Info */}
      <div className="flex flex-col items-center gap-6 relative z-10">
        {/* Cover */}
        <div className="w-56 h-56 md:w-64 md:h-64 rounded-2xl bg-card border border-border flex items-center justify-center overflow-hidden shadow-lg">
          {currentTrack.cover ? (
            <img
              src={currentTrack.cover}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-12 w-12 rounded-full border-2 border-dashed border-border" />
              <span className="text-xs font-mono">No track</span>
            </div>
          )}
        </div>

        {/* Track info */}
        <div className="text-center">
          <h2 className="text-lg font-semibold tracking-tight">
            {currentTrack.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentTrack.artist}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-8 relative z-10 w-full max-w-md pb-4">
        {/* Playback controls */}
        <div className="flex items-center gap-6">
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/80"
            aria-label="Previous track"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-card border border-border text-foreground transition-all hover:border-primary/40"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </button>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/80"
            aria-label="Next track"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        {/* Talk to DJ button */}
        <button
          onClick={() => setIsListening(!isListening)}
          className={`flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-semibold transition-all ${
            isListening
              ? "bg-primary text-primary-foreground animate-pulse-glow"
              : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
          }`}
          aria-label="Talk to DJ Echo"
        >
          <Mic className="h-4 w-4" />
          {isListening ? "Listening…" : "Talk to Echo"}
        </button>
      </div>
    </div>
  );
};

export default Index;
