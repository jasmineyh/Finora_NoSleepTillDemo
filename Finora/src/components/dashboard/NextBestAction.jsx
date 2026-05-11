import { useNavigate } from "react-router-dom";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

const ACTIONS = [
  { key: "save_now", message: "Move RM50 into savings today", icon: "💰", route: "/accounts" },
  { key: "food_lock", message: "Avoid food delivery for 2 days", icon: "🛵", route: "/accounts" },
  { key: "subscription", message: "Cancel one unused subscription", icon: "📺", route: "/insights" },
  { key: "daily_limit", message: "Keep spending below RM25 today", icon: "🎯", route: "/" },
  { key: "fd", message: "Move surplus to FD Autopilot", icon: "🏦", route: "/accounts" },
];

export default function NextBestAction({ plan, lang }) {
  const navigate = useNavigate();
  // Pick action based on plan data
  const idx = plan?.health_score
    ? plan.health_score < 50 ? 0 : plan.health_score < 70 ? 3 : 4
    : 0;
  const action = ACTIONS[idx];

  return (
    <GlassCard className="border border-primary/20 bg-primary/5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl gradient-purple-pink flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/20">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-0.5">Next Best Action</p>
          <p className="text-sm font-medium text-foreground leading-snug">{action.icon} {action.message}</p>
        </div>
      </div>
      <Button
        onClick={() => navigate(action.route)}
        className="w-full mt-3 h-9 rounded-xl gradient-purple-pink text-white font-semibold border-0 text-xs"
      >
        Do It Now →
      </Button>
    </GlassCard>
  );
}