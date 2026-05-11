import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LineChart, Line, Tooltip } from "recharts";
import BottomNav from "@/components/BottomNav";
import GlassCard from "@/components/ui/GlassCard";
import TransactionItem from "@/components/dashboard/TransactionItem";
import { DEFAULT_TRANSACTIONS, DEFAULT_PROFILE, DEFAULT_PLAN } from "@/lib/financialDna";
import { useLanguage } from "@/lib/useLanguage";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Calendar, Target, ArrowRight } from "lucide-react";

const CATEGORY_LABELS = {
  food_delivery: "Food Delivery", transport: "Transport", food_beverages: "F&B",
  subscriptions: "Subscriptions", shopping: "Shopping", education: "Education",
  utilities: "Utilities", petrol: "Petrol", savings: "Savings"
};

const COLORS = [
  "hsl(263,70%,55%)", "hsl(330,80%,60%)", "hsl(200,70%,50%)",
  "hsl(45,90%,55%)", "hsl(150,60%,45%)", "hsl(0,70%,55%)",
  "hsl(280,60%,50%)", "hsl(30,80%,55%)"
];

const WANTS_CATS = ["food_delivery", "subscriptions", "shopping", "food_beverages"];
const NEEDS_CATS = ["transport", "utilities", "petrol", "education"];

// Simulated heatmap data
const HEATMAP = Array.from({ length: 28 }, (_, i) => {
  const day = i + 1;
  const isWeekend = (day % 7 === 0 || day % 7 === 6);
  const rand = Math.random();
  return {
    day,
    status: isWeekend ? (rand > 0.4 ? "red" : "yellow") : (rand > 0.3 ? "green" : "yellow"),
    label: isWeekend ? "Weekend" : `Day ${day}`
  };
});

// Simulated timeline
const TIMELINE = [
  { month: "Jan", score: 52, savings: 280 },
  { month: "Feb", score: 58, savings: 320 },
  { month: "Mar", score: 55, savings: 290 },
  { month: "Apr", score: 63, savings: 380 },
  { month: "May", score: 68, savings: 420 },
];

export default function Insights() {
  const navigate = useNavigate();
  const lang = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        const [txs, profiles, plans] = await Promise.all([
          base44.entities.Transaction.list("-date", 50),
          base44.entities.UserProfile.filter({ created_by: me.email }),
          base44.entities.FinancialPlan.list("-created_date", 1),
        ]);
        setTransactions(txs.length > 0 ? txs : DEFAULT_TRANSACTIONS);
        setProfile(profiles[0] || DEFAULT_PROFILE);
        setPlan(plans[0] || DEFAULT_PLAN);
      } catch {
        setTransactions(DEFAULT_TRANSACTIONS);
        setProfile(DEFAULT_PROFILE);
        setPlan(DEFAULT_PLAN);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const income = (profile?.monthly_income || 3000);
  const categoryTotals = transactions.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {});

  const totalSpent = transactions.reduce((s, tx) => s + tx.amount, 0);
  const wantsTotal = WANTS_CATS.reduce((s, c) => s + (categoryTotals[c] || 0), 0);
  const needsTotal = NEEDS_CATS.reduce((s, c) => s + (categoryTotals[c] || 0), 0);
  const savingsTotal = Math.max(0, income - totalSpent);
  const unaccounted = Math.max(0, income - totalSpent - savingsTotal);
  const debtRisk = (categoryTotals.subscriptions || 0) + (categoryTotals.shopping || 0);

  const incomeBreakdown = [
    { label: "Needs", amount: needsTotal, pct: Math.round(needsTotal / income * 100), color: "bg-primary" },
    { label: "Wants", amount: wantsTotal, pct: Math.round(wantsTotal / income * 100), color: "bg-accent" },
    { label: "Savings", amount: savingsTotal, pct: Math.round(savingsTotal / income * 100), color: "bg-emerald-500" },
    { label: "Debt Risk", amount: debtRisk, pct: Math.round(debtRisk / income * 100), color: "bg-red-500" },
    { label: "Unaccounted", amount: Math.max(0, income - needsTotal - wantsTotal - savingsTotal), pct: Math.max(0, 100 - Math.round(needsTotal / income * 100) - Math.round(wantsTotal / income * 100) - Math.round(savingsTotal / income * 100)), color: "bg-secondary" },
  ];

  const plannedTotal = needsTotal;
  const impulseTotal = wantsTotal;
  const totalForRatio = plannedTotal + impulseTotal || 1;
  const impulsePct = Math.round(impulseTotal / totalForRatio * 100);
  const plannedPct = 100 - impulsePct;

  const topFoodDelivery = categoryTotals.food_delivery || 0;
  const chartData = Object.entries(categoryTotals)
    .map(([cat, total]) => ({ name: CATEGORY_LABELS[cat] || cat, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);

  const heatmapColors = { green: "bg-emerald-500/70", yellow: "bg-amber-400/70", red: "bg-red-500/70" };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-12 max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between mb-0">
          <h1 className="text-xl font-bold text-foreground">Financial Insights</h1>
        </div>

        {/* 1. Income Utilisation */}
        <GlassCard>
          <h3 className="text-sm font-semibold text-foreground mb-3">Income Utilisation</h3>
          <p className="text-xs text-muted-foreground mb-3">RM{income.toLocaleString()} income this month</p>
          <div className="space-y-2.5">
            {incomeBreakdown.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-foreground font-medium">RM{item.amount.toFixed(0)} · {item.pct}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.min(item.pct, 100)}%`, transition: "width 1s" }} />
                </div>
              </div>
            ))}
          </div>
          {incomeBreakdown[4].amount > 50 && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              RM{incomeBreakdown[4].amount.toFixed(0)} is unaccounted for. This is how debt quietly starts.
            </div>
          )}
        </GlassCard>

        {/* 2. Spending by Category */}
        <GlassCard>
          <h3 className="text-sm font-semibold text-foreground mb-4">Spending by Category</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "hsl(270,5%,55%)" }} axisLine={false} tickLine={false} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={14}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* 3. Impulse vs Planned */}
        <GlassCard>
          <h3 className="text-sm font-semibold text-foreground mb-3">Impulse vs Planned Spending</h3>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <div className="h-3 bg-secondary rounded-full overflow-hidden flex">
                <div className="h-full bg-primary rounded-l-full" style={{ width: `${plannedPct}%` }} />
                <div className="h-full bg-accent" style={{ width: `${impulsePct}%` }} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary">{plannedPct}%</p>
              <p className="text-xs text-muted-foreground">Planned</p>
              <p className="text-xs text-foreground font-medium">RM{plannedTotal.toFixed(0)}</p>
            </div>
            <div className="glass-card rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-accent">{impulsePct}%</p>
              <p className="text-xs text-muted-foreground">Impulse</p>
              <p className="text-xs text-foreground font-medium">RM{impulseTotal.toFixed(0)}</p>
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            <p>Peak impulse window: <span className="text-foreground">Fri 8PM – Sun 12AM</span></p>
            <p>Most impulsive: <span className="text-accent">{chartData[0]?.name || "Food Delivery"}</span></p>
          </div>
          {impulsePct > 40 && (
            <Button onClick={() => navigate("/accounts")} variant="outline" className="w-full h-9 rounded-xl border-border/50 text-xs mt-3">
              Set Weekend Spending Limit →
            </Button>
          )}
        </GlassCard>

        {/* 4. Budget Adherence Heatmap */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Budget Adherence — May</h3>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-3">
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <div key={i} className="text-center text-[10px] text-muted-foreground">{d}</div>
            ))}
            {HEATMAP.map((d) => (
              <div key={d.day} className={`aspect-square rounded-md ${heatmapColors[d.status]} flex items-center justify-center`}>
                <span className="text-[9px] text-white/80 font-medium">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70 inline-block" /> Under budget</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400/70 inline-block" /> Near limit</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/70 inline-block" /> Overspent</span>
          </div>
          <p className="text-xs text-muted-foreground">Weekends are your financial weak spots. You overspent on {HEATMAP.filter(d => d.status === "red" && (d.day % 7 === 0 || d.day % 7 === 6)).length} of 8 weekend days.</p>
        </GlassCard>

        {/* 5. Financial Health Timeline */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Financial Health Timeline</h3>
          </div>
          <div className="h-32 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TIMELINE}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(270,5%,55%)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(270,10%,10%)", border: "1px solid hsl(270,10%,18%)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="score" stroke="hsl(263,70%,55%)" strokeWidth={2} dot={{ fill: "hsl(263,70%,55%)", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground">Your resilience grew <span className="text-emerald-400 font-medium">30% since January</span>. March dip coincided with exam period — a stress-spending pattern Maya flagged.</p>
          <Button onClick={() => navigate("/")} variant="outline" className="w-full h-9 rounded-xl border-border/50 text-xs mt-3">
            Set Next Month Target →
          </Button>
        </GlassCard>

        {/* 6. Grab-Linked */}
        <GlassCard>
          <h3 className="text-sm font-semibold text-foreground mb-2">GrabFood Tracker</h3>
          <p className="text-xs text-muted-foreground">
            Your GrabFood spending is <span className="text-accent font-semibold">RM{topFoodDelivery.toFixed(2)}</span> this month.
            {topFoodDelivery > 50 ? " That's above average — try cooking at home 2x/week to save RM60+." : " You're managing food delivery well!"}
          </p>
        </GlassCard>

        {/* All Transactions with filtering */}
        <GlassCard>
          <h3 className="text-sm font-semibold text-foreground mb-3">All Transactions</h3>
          <div className="flex gap-2 mb-3 flex-wrap">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="flex-1 h-8 px-2 rounded-lg bg-secondary/50 border border-border/50 text-xs text-foreground">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="flex-1 h-8 px-2 rounded-lg bg-secondary/50 border border-border/50 text-xs text-foreground">
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="divide-y divide-border/30">
            {[...transactions]
              .filter(tx => filterCategory === "all" || tx.category === filterCategory)
              .sort((a, b) => {
                if (sortBy === "newest") return new Date(b.date) - new Date(a.date);
                if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
                if (sortBy === "highest") return b.amount - a.amount;
                if (sortBy === "lowest") return a.amount - b.amount;
                return 0;
              })
              .map((tx, i) => <TransactionItem key={tx.id || i} transaction={tx} />)}
          </div>
        </GlassCard>
      </div>
      <BottomNav lang={profile?.language || "en"} />
    </div>
  );
}