import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function DebtWarningCard({ transactions, profile }) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (dismissed) return null;

  const income = profile?.monthly_income || 3000;
  const wantsCategories = ["food_delivery", "subscriptions", "shopping", "food_beverages"];
  const wantsTotal = transactions.filter(tx => wantsCategories.includes(tx.category)).reduce((s, t) => s + t.amount, 0);
  const wantsPercent = Math.round((wantsTotal / income) * 100);

  if (wantsPercent < 35) return null;

  const tier = wantsPercent >= 55 ? 3 : wantsPercent >= 45 ? 2 : 1;
  const configs = {
    1: { bg: "bg-amber-500/10 border-amber-500/30", icon: "⚠️", text: "text-amber-400", label: "Spending Pattern Alert", msg: `Your wants spending is ${wantsPercent}% of income. This is how debt starts. Let's course-correct now.` },
    2: { bg: "bg-orange-500/10 border-orange-500/30", icon: "🚨", text: "text-orange-400", label: "Low Balance Forecast", msg: `At this rate, you may run short before month-end. Pause non-essential spending for 5 days.` },
    3: { bg: "bg-red-500/10 border-red-500/30", icon: "🔴", text: "text-red-400", label: "Financial Resilience Alert", msg: `Your spending is outpacing your income. Maya has prepared an emergency recovery plan.` },
  };
  const c = configs[tier];

  return (
    <div className={`rounded-2xl p-4 border ${c.bg}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1">
          <span className="text-lg">{c.icon}</span>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wide ${c.text}`}>{c.label}</p>
            <p className="text-xs text-foreground/80 mt-1 leading-relaxed">{c.msg}</p>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground ml-2 mt-0.5">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <Button onClick={() => navigate("/insights")} variant="outline" className={`flex-1 h-8 rounded-lg text-xs border-current ${c.text}`}>
          See Breakdown
        </Button>
        <Button onClick={() => navigate("/accounts")} className="flex-1 h-8 rounded-lg text-xs gradient-purple-pink text-white border-0">
          Recovery Plan
        </Button>
      </div>
    </div>
  );
}