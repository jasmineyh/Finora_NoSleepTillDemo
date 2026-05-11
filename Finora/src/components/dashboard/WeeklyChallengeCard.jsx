import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const CHALLENGES = {
  spender: { text: "No GrabFood for 3 days", why: "Builds impulse control and saves RM30+", target: 3, savings: 30, icon: "🛵" },
  avoider: { text: "Check your balance every day this week", why: "Builds financial awareness habit", target: 7, savings: 0, icon: "📊" },
  hoarder: { text: "Move RM100 into FD or Savings", why: "Compounds your savings faster", target: 1, savings: 100, icon: "🏦" },
  planner: { text: "Stay under your daily safe-to-spend limit", why: "Maintains your planning discipline", target: 5, savings: 50, icon: "🎯" },
};

export default function WeeklyChallengeCard({ profile }) {
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [lastMarked, setLastMarked] = useState(null);
  const [skipped, setSkipped] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const dna = profile?.financial_dna || "planner";
  const challenge = CHALLENGES[dna];

  const handleMarkDone = () => {
    const today = new Date().toDateString();
    if (lastMarked === today) return;

    const newProgress = progress + 1;
    setProgress(newProgress);
    setLastMarked(today);

    if (newProgress >= challenge.target) {
      setCompleted(true);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  if (skipped) return null;

  const progressPercent = Math.min(Math.round((progress / challenge.target) * 100), 100);

  return (
    <GlassCard className="relative overflow-hidden">
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 z-10 rounded-2xl"
        >
          <div className="text-center">
            <p className="text-3xl">🎉</p>
            <p className="text-sm font-bold text-emerald-400 mt-1">Challenge Complete!</p>
            <p className="text-xs text-muted-foreground">+10 Resilience XP</p>
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">⚡ Weekly Challenge</h3>
        {completed && <span className="text-[10px] bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">Completed!</span>}
      </div>

      <div className="flex items-start gap-3">
        <span className="text-2xl">{challenge.icon}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{challenge.text}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{challenge.why}</p>
          {challenge.savings > 0 && (
            <p className="text-[11px] text-emerald-400 font-medium mt-0.5">Estimated saving: RM{challenge.savings}</p>
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Progress</span>
          <span className="text-primary font-medium">{progress}/{challenge.target} {challenge.target > 1 ? "days" : "done"}</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-purple-pink rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {!completed && (
        <div className="flex gap-2 mt-3">
          <Button
            onClick={handleMarkDone}
            disabled={lastMarked === new Date().toDateString()}
            className="flex-1 h-9 rounded-xl gradient-purple-pink text-white font-semibold border-0 text-xs"
          >
            {lastMarked === new Date().toDateString() ? "✓ Done Today" : "Mark Today Done"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setSkipped(true)}
            className="h-9 px-3 rounded-xl border-border/50 text-xs text-muted-foreground"
          >
            Skip
          </Button>
        </div>
      )}
    </GlassCard>
  );
}