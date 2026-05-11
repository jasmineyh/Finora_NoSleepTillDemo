import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown } from "lucide-react";

// Static benchmark data by income bracket
const BENCHMARKS = {
  low: { avgSavings: 12, topSavings: 22, avgAmount: 360, ageGroup: "20–25" },
  medium: { avgSavings: 18, topSavings: 28, avgAmount: 540, ageGroup: "20–25" },
  high: { avgSavings: 22, topSavings: 35, avgAmount: 880, ageGroup: "22–28" },
};

export default function SocialComparisonCard({ profile }) {
  const navigate = useNavigate();
  const income = profile?.monthly_income || 3000;
  const savingsGoal = profile?.savings_goal || 500;
  const userSavingsRate = Math.round((savingsGoal / income) * 100);

  const bracket = income < 2000 ? "low" : income < 5000 ? "medium" : "high";
  const bench = BENCHMARKS[bracket];
  const diff = bench.avgSavings - userSavingsRate;
  const isAbove = userSavingsRate >= bench.avgSavings;
  const gap = Math.max(0, Math.round((bench.avgSavings - userSavingsRate) / 100 * income));

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        📊 How You Compare
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        Among users aged {bench.ageGroup} with similar income:
      </p>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Average peer savings rate</span>
          <span className="text-sm font-semibold text-foreground">{bench.avgSavings}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Your savings rate</span>
          <span className={`text-sm font-bold flex items-center gap-1 ${isAbove ? "text-emerald-400" : "text-amber-400"}`}>
            {isAbove ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {userSavingsRate}%
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-border/30 pt-2">
          <span className="text-xs text-muted-foreground">Top savers in your group</span>
          <span className="text-sm font-semibold text-primary">{bench.topSavings}%</span>
        </div>
      </div>

      {isAbove ? (
        <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-emerald-400">
          🌟 You're above average! Keep it up and aim for {bench.topSavings}%.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Saving RM{gap}/month more would put you at the peer average.
          </p>
          <Button
            onClick={() => navigate("/accounts")}
            className="w-full h-9 rounded-xl gradient-purple-pink text-white font-semibold border-0 text-xs"
          >
            Boost My Savings Rate →
          </Button>
        </div>
      )}
    </GlassCard>
  );
}