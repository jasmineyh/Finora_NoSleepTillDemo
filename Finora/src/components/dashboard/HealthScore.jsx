import GlassCard from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

export default function HealthScore({ score }) {
  const getColor = (s) => {
    if (s >= 80) return "text-emerald-400";
    if (s >= 60) return "text-amber-400";
    return "text-red-400";
  };

  const getLabel = (s) => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Good";
    if (s >= 40) return "Needs Work";
    return "At Risk";
  };

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <GlassCard className="flex items-center gap-4">
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(263, 70%, 55%)" />
              <stop offset="100%" stopColor="hsl(330, 80%, 60%)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-lg font-bold", getColor(score))}>{score}</span>
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Financial Health</p>
        <p className={cn("text-lg font-bold", getColor(score))}>{getLabel(score)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Based on your spending patterns</p>
      </div>
    </GlassCard>
  );
}