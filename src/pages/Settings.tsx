import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Cloud, Clock, ListMusic, ArrowRight } from "lucide-react";

const features = [
  { id: "weather", label: "Weather", description: "Match vibes to current weather conditions", icon: Cloud },
  { id: "timeOfDay", label: "Time of Day", description: "Adapt selections based on the hour", icon: Clock },
  { id: "recentlyPlayed", label: "Recently Played", description: "Factor in your listening history", icon: ListMusic },
];

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const, staggerChildren: 0.12 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const childVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const Settings = () => {
  const navigate = useNavigate();
  const [weights, setWeights] = useState<Record<string, number>>({
    weather: 0.5, timeOfDay: 0.5, recentlyPlayed: 0.5,
  });

  const handleWeightChange = (id: string, value: number[]) => {
    setWeights((prev) => ({ ...prev, [id]: Math.round(value[0] * 10) / 10 }));
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
    >
      {/* Header */}
      <motion.div variants={childVariants} className="mb-12 text-center">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-primary mb-3">DJ Echo</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Tune Your Preferences</h1>
        <p className="text-muted-foreground text-sm max-w-md">Adjust how much each feature influences your mix.</p>
      </motion.div>

      {/* Feature Sliders */}
      <div className="w-full max-w-md space-y-6">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          const value = weights[feature.id];

          return (
            <motion.div
              key={feature.id}
              variants={childVariants}
              whileHover={{ scale: 1.01, borderColor: "hsl(160 84% 39% / 0.3)" }}
              className="group rounded-xl border border-border bg-card p-5 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ rotate: 8 }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-semibold">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
                <motion.span
                  key={value}
                  initial={{ scale: 1.3, color: "hsl(160 84% 50%)" }}
                  animate={{ scale: 1, color: "hsl(160 84% 39%)" }}
                  transition={{ duration: 0.2 }}
                  className="font-mono text-sm tabular-nums"
                >
                  {value.toFixed(1)}
                </motion.span>
              </div>

              <Slider
                value={[value]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={(v) => handleWeightChange(feature.id, v)}
                className="cursor-pointer"
              />

              <div className="flex justify-between mt-2 text-[10px] font-mono text-muted-foreground">
                <span>0</span>
                <span>1</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <motion.button
        variants={childVariants}
        whileHover={{ scale: 1.05, gap: "12px" }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/")}
        className="mt-10 flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
      >
        Start Mixing
        <ArrowRight className="h-4 w-4" />
      </motion.button>
    </motion.div>
  );
};

export default Settings;
