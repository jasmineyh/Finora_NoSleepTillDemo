import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import { Check } from "lucide-react";

const STAGES = [
  { label: "At Risk", emoji: "😰", min: 0, max: 20, color: "text-red-400" },
  { label: "Struggling", emoji: "😟", min: 21, max: 40, color: "text-orange-400" },
  { label: "Stable", emoji: "😐", min: 41, max: 60, color: "text-amber-400" },
  { label: "Growing", emoji: "😊", min: 61, max: 80, color: "text-emerald-400" },
  { label: "Resilient", emoji: "💪", min: 81, max: 100, color: "text-primary" },
];

const MILESTONES_BY_STAGE = {
  0: [
    { label: "Save for 4 consecutive weeks", done: false },
    { label: "Keep wants spending below 35%", done: false },
    { label: "Build emergency buffer above RM500", done: false },
  ],
  1: [
    { label: "Complete 2 weekly challenges", done: false },
    { label: "Maintain savings for 2 months", done: false },
    { label: "Activate FD Autopilot", done: false },
  ],
  2: [
    { label: "Stay under budget for 2 months", done: false },
    { label: "Increase savings rate to 20%+", done: false },
    { label: "Zero risky spending for 2 weeks", done: false },
  ],
  3: [
    { label: "Reach 80% of savings goal", done: false },
    { label: "Maintain planner DNA for 30 days", done: false },
    { label: "Complete 4 weekly challenges", done: false },
  ],
  4: [
    { label: "You've achieved full resilience!", done: true },
    { label: "Mentor a friend on budgeting", done: false },
    { label: "Keep FD active for 6 months", done: false },
  ],
};

export default function ResilienceJourneyCard({ healthScore }) {
  const score = healthScore || 65;
  const stageIdx = STAGES.findIndex(s => score >= s.min && score <= s.max);
  const currentStage = STAGES[stageIdx] || STAGES[2];
  const milestones = MILESTONES_BY_STAGE[stageIdx] || MILESTONES_BY_STAGE[2];

  const progressInStage = ((score - currentStage.min) / (currentStage.max - currentStage.min)) * 100;

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        🗺️ Financial Resilience Journey
      </h3>

      {/* Stage path */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {STAGES.map((stage, i) => (
          <div key={stage.label} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex flex-col items-center gap-0.5 ${i === stageIdx ? "scale-110" : ""} transition-transform`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg
                ${i < stageIdx ? "bg-primary/20" : i === stageIdx ? "gradient-purple-pink shadow-lg shadow-primary/30" : "bg-secondary/50"}`}>
                <span className={`text-base ${i === stageIdx ? "" : "opacity-60"}`}>{stage.emoji}</span>
              </div>
              <span className={`text-[9px] font-medium ${i === stageIdx ? stage.color : "text-muted-foreground/50"}`}>
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`h-0.5 w-4 rounded-full flex-shrink-0 ${i < stageIdx ? "bg-primary" : "bg-secondary"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Current stage details */}
      <div className="glass-card rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-sm font-bold ${currentStage.color}`}>{currentStage.emoji} {currentStage.label}</span>
          <span className="text-xs text-muted-foreground">Score: {score}/100</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-purple-pink rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressInStage}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>

      {/* Milestones to next stage */}
      {stageIdx < STAGES.length - 1 && (
        <div>
          <p className="text-[11px] text-muted-foreground mb-2">To reach <span className="text-foreground font-medium">{STAGES[stageIdx + 1]?.label}</span>:</p>
          <div className="space-y-1.5">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${m.done ? "bg-emerald-500" : "bg-secondary/70 border border-border/50"}`}>
                  {m.done && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className={`text-xs ${m.done ? "text-emerald-400 line-through" : "text-foreground/70"}`}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}