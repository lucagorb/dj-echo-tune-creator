import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { Cloud, Clock, ListMusic, ArrowRight } from "lucide-react";

const features = [
  {
    id: "weather",
    label: "Weather",
    description: "Match vibes to current weather conditions",
    icon: Cloud,
  },
  {
    id: "timeOfDay",
    label: "Time of Day",
    description: "Adapt selections based on the hour",
    icon: Clock,
  },
  {
    id: "recentlyPlayed",
    label: "Recently Played",
    description: "Factor in your listening history",
    icon: ListMusic,
  },
];

const Settings = () => {
  const navigate = useNavigate();
  const [weights, setWeights] = useState<Record<string, number>>({
    weather: 0.5,
    timeOfDay: 0.5,
    recentlyPlayed: 0.5,
  });

  const handleWeightChange = (id: string, value: number[]) => {
    setWeights((prev) => ({ ...prev, [id]: Math.round(value[0] * 10) / 10 }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-primary mb-3">
          DJ Echo
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Tune Your Preferences
        </h1>
        <p className="text-muted-foreground text-sm max-w-md">
          Adjust how much each feature influences your mix.
        </p>
      </div>

      {/* Feature Sliders */}
      <div className="w-full max-w-md space-y-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          const value = weights[feature.id];

          return (
            <div
              key={feature.id}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm text-primary tabular-nums">
                  {value.toFixed(1)}
                </span>
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
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate("/")}
        className="mt-10 group flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:gap-3"
      >
        Start Mixing
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
};

export default Settings;
