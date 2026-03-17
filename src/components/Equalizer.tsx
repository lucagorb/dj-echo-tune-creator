import { motion } from "framer-motion";

const barCount = 5;

const Equalizer = ({ active }: { active: boolean }) => {
  return (
    <div className="flex items-end gap-[3px] h-6">
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-primary"
          animate={
            active
              ? {
                  height: ["6px", `${12 + Math.random() * 14}px`, "8px", `${10 + Math.random() * 16}px`, "6px"],
                }
              : { height: "4px" }
          }
          transition={
            active
              ? {
                  duration: 0.8 + Math.random() * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
};

export default Equalizer;
