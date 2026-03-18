import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Pause, Play, SkipBack, SkipForward, Settings } from "lucide-react";
import Equalizer from "@/components/Equalizer";

const API = "https://dj-echo-production.up.railway.app";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const, staggerChildren: 0.1 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const childVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const Index = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTrack, setCurrentTrack] = useState({
    title: "Waiting for Echo…",
    artist: "Press the mic to start",
    cover: null as string | null,
  });

  const fetchPlayer = async () => {
    try {
      const res = await fetch(`${API}/player`, { credentials: "include" });
      const data = await res.json();
      setCurrentTrack({
        title: data.track,
        artist: data.artists.join(", "),
        cover: null,
      });
      setIsPlaying(data.is_playing);
    } catch (e) {
      console.error("Failed to fetch player", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${API}/auth/status`, { credentials: "include" });
        const data = await res.json();
        if (!data.loggedIn) {
          window.location.href = `${API}/auth/login`;
          return;
        }
        fetchPlayer();
        const interval = setInterval(fetchPlayer, 5000);
        return () => clearInterval(interval);
      } catch (e) {
        console.error("Auth check failed", e);
      }
    };

    let cleanup: (() => void) | undefined;
    init().then((fn) => { cleanup = fn; });
    return () => { cleanup?.(); };
  }, []);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen flex flex-col items-center justify-between px-4 py-8 md:py-12 relative overflow-hidden"
    >
      {/* Background glow */}
      <motion.div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]"
        animate={isPlaying ? { scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] } : { scale: 1, opacity: 0.5 }}
        transition={isPlaying ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : { duration: 0.5 }}
      />

      {/* Top bar */}
      <motion.header variants={childVariants} className="w-full max-w-md flex items-center justify-between relative z-10">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-primary">DJ Echo</p>
        <div className="flex items-center gap-3">
          <Equalizer active={isPlaying} />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/settings")}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/80"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.header>

      {/* Album Art + Track Info */}
      <motion.div variants={childVariants} className="flex flex-col items-center gap-6 relative z-10">
        <motion.div
          className="w-56 h-56 md:w-64 md:h-64 rounded-2xl bg-card border border-border flex items-center justify-center overflow-hidden shadow-lg"
          animate={isPlaying ? { rotate: [0, 0.5, -0.5, 0] } : {}}
          transition={isPlaying ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : {}}
        >
          {currentTrack.cover ? (
            <img src={currentTrack.cover} alt={currentTrack.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-12 w-12 rounded-full border-2 border-dashed border-border" />
              <span className="text-xs font-mono">No track</span>
            </div>
          )}
        </motion.div>

        <div className="text-center">
          <h2 className="text-lg font-semibold tracking-tight">{currentTrack.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{currentTrack.artist}</p>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div variants={childVariants} className="flex flex-col items-center gap-8 relative z-10 w-full max-w-md pb-4">
        <div className="flex items-center gap-6">
          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/80"
            aria-label="Previous track"
          >
            <SkipBack className="h-5 w-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={async () => {
              try {
                await fetch(`${API}/${isPlaying ? "pause" : "play"}`, { method: "POST", credentials: "include" });
                setIsPlaying(!isPlaying);
              } catch (e) {
                console.error("Play/pause failed", e);
              }
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-card border border-border text-foreground transition-all hover:border-primary/40"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.div key="pause" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                  <Pause className="h-6 w-6" />
                </motion.div>
              ) : (
                <motion.div key="play" initial={{ scale: 0, rotate: 90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
                  <Play className="h-6 w-6 ml-0.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/80"
            aria-label="Next track"
          >
            <SkipForward className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Talk to DJ */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsListening(!isListening)}
          className={`flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-semibold transition-all ${
            isListening
              ? "bg-primary text-primary-foreground animate-pulse-glow"
              : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
          }`}
          aria-label="Talk to DJ Echo"
        >
          <motion.div animate={isListening ? { scale: [1, 1.2, 1] } : {}} transition={isListening ? { duration: 1, repeat: Infinity } : {}}>
            <Mic className="h-4 w-4" />
          </motion.div>
          {isListening ? "Listening…" : "Talk to Echo"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default Index;
