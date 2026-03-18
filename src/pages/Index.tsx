import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Pause, Play, SkipBack, SkipForward, Settings } from "lucide-react";
import Equalizer from "@/components/Equalizer";
import { Room, RoomEvent, Track, createLocalAudioTrack, type TrackPublishOptions } from "livekit-client";

const API = "https://dj-echo-production.up.railway.app";

type Phase = "landing" | "greeting" | "main";

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
  const [phase, setPhase] = useState<Phase>("landing");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [livekitRoom, setLivekitRoom] = useState<Room | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [greetingMessage, setGreetingMessage] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState({
    title: "Waiting for Echo…",
    artist: "Press the mic to start",
    cover: null as string | null,
  });

  const fetchPlayer = useCallback(async () => {
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
  }, []);

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
  }, [fetchPlayer]);

  useEffect(() => {
    return () => {
      livekitRoom?.disconnect();
    };
  }, [livekitRoom]);

  const handleStartSession = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch(`${API}/livekit/token`, { credentials: "include" });
      const { token, url } = await res.json();
      const room = new Room();
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const audioEl = track.attach();
          audioEl.autoplay = true;
          document.body.appendChild(audioEl);
        }
      });
      await room.startAudio();
      await room.connect(url, token);
      setLivekitRoom(room);
      setPhase("greeting");

      // Fallback: move to main after 10s
      const fallbackTimer = setTimeout(() => {
        fetchPlayer();
        setPhase("main");
      }, 10000);

      room.on(RoomEvent.DataReceived, (data: Uint8Array) => {
        try {
          const parsed = JSON.parse(new TextDecoder().decode(data));
          if (parsed.djResponse) {
            setGreetingMessage(parsed.djResponse);
            clearTimeout(fallbackTimer);
            setTimeout(() => {
              fetchPlayer();
              setPhase("main");
            }, 4000);
          }
        } catch (err) {
          console.error("Failed to parse data", err);
        }
      });
    } catch (e) {
      console.error("LiveKit connection failed", e);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleToggleMic = async () => {
    if (!livekitRoom) return;
    if (isListening) {
      const publications = livekitRoom.localParticipant.audioTrackPublications;
      publications.forEach((pub) => {
        if (pub.track) {
          livekitRoom.localParticipant.unpublishTrack(pub.track);
        }
      });
      setIsListening(false);
    } else {
      try {
        const track = await createLocalAudioTrack();
        await livekitRoom.localParticipant.publishTrack(track, {} as TrackPublishOptions);
        setIsListening(true);
      } catch (e) {
        console.error("Mic publish failed", e);
        setIsListening(false);
      }
    }
  };

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

      <AnimatePresence mode="wait">
        {phase === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center justify-center gap-6 relative z-10 flex-1"
          >
            <motion.div
              className="w-20 h-20 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Mic className="h-8 w-8 text-primary/60" />
            </motion.div>
            <div className="text-center">
              <h2 className="text-xl font-semibold tracking-tight">Ready to vibe?</h2>
              <p className="text-sm text-muted-foreground mt-1">Start a session to talk to Echo</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleStartSession}
              disabled={isConnecting}
              className="flex items-center gap-2.5 rounded-full px-8 py-4 text-sm font-semibold bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {isConnecting ? "Connecting…" : "Start Session"}
            </motion.button>
          </motion.div>
        )}

        {phase === "greeting" && (
          <motion.div
            key="greeting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center justify-center gap-8 relative z-10 flex-1"
          >
            <motion.div
              className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"
              animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                className="w-8 h-8 rounded-full bg-primary/30"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              />
            </motion.div>

            <AnimatePresence mode="wait">
              {greetingMessage ? (
                <motion.blockquote
                  key="quote"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center max-w-xs"
                >
                  <p className="text-lg font-medium italic text-foreground leading-relaxed">
                    "{greetingMessage}"
                  </p>
                  <footer className="text-xs text-muted-foreground mt-3 font-mono tracking-widest uppercase">— Echo</footer>
                </motion.blockquote>
              ) : (
                <motion.p
                  key="tuning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-muted-foreground font-mono tracking-wider"
                >
                  Echo is tuning in…
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {phase === "main" && (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-6 relative z-10"
          >
            {/* Album Art */}
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
        )}
      </AnimatePresence>

      {/* Controls - only in main phase */}
      {phase === "main" && (
        <motion.div
          variants={childVariants}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center gap-8 relative z-10 w-full max-w-md pb-4"
        >
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
              onClick={async () => {
                try {
                  await fetch(`${API}/next`, { method: "POST", credentials: "include" });
                  setTimeout(fetchPlayer, 1000);
                } catch (e) {
                  console.error("Skip failed", e);
                }
              }}
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
            onClick={handleToggleMic}
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
      )}

      {/* Spacer for non-main phases */}
      {phase !== "main" && <div />}
    </motion.div>
  );
};

export default Index;
