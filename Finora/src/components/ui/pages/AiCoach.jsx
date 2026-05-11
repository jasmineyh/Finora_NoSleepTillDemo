import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BottomNav from "@/components/BottomNav";
import GlassCard from "@/components/ui/GlassCard";
import DnaBadge from "@/components/DnaBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_PLAN, DEFAULT_PROFILE, DEFAULT_TRANSACTIONS, DNA_TYPES } from "@/lib/financialDna";
import { useLanguage } from "@/lib/useLanguage";
import { Bot, TrendingUp, Loader2, Send, ArrowRight, CheckCircle2, AlertCircle, Clock, Target } from "lucide-react";
import DailyLimitModal from "@/components/DailyLimitModal";
import { motion, AnimatePresence } from "framer-motion";

const QUICK_PROMPTS = [
  "Am I on track this month?",
  "Where am I overspending?",
  "Build me a savings plan",
  "Should I open an FD?",
];

const FALLBACK_ACTIONS = {
  spender: [
    { status: "warning", label: "GrabFood spending is high", action: "Set daily limit", route: "daily_limit" },
    { status: "ok", label: "Auto-save active", action: "View savings", route: "/accounts" },
    { status: "action", label: "3 subscriptions unreviewed", action: "Review now", route: "/insights" },
  ],
  hoarder: [
    { status: "ok", label: "Savings rate excellent", action: "View FD options", route: "/accounts" },
    { status: "action", label: "Move idle cash to FD", action: "Activate FD", route: "/accounts" },
    { status: "ok", label: "Emergency fund building", action: "View progress", route: "/accounts" },
  ],
  avoider: [
    { status: "action", label: "No spending tracked today", action: "Log transaction", route: "/insights" },
    { status: "warning", label: "Emergency fund at 0%", action: "Build buffer", route: "/accounts" },
    { status: "action", label: "Survey incomplete", action: "Complete survey", route: "/survey" },
  ],
  planner: [
    { status: "ok", label: "Budget on track", action: "View breakdown", route: "/insights" },
    { status: "action", label: "FD opportunity available", action: "Lock into FD", route: "/accounts" },
    { status: "ok", label: "Commitment active", action: "View progress", route: "/" },
  ],
};

function ActionStatusIcon({ status }) {
  if (status === "ok") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === "warning") return <AlertCircle className="w-4 h-4 text-amber-400" />;
  return <Clock className="w-4 h-4 text-primary" />;
}

export default function AiCoach() {
  const navigate = useNavigate();
  const lang = useLanguage();
  const chatEndRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Today's focus
  const [todayFocus, setTodayFocus] = useState(null);
  const [focusLoading, setFocusLoading] = useState(false);
  const [committed, setCommitted] = useState(false);

  const [showDailyLimit, setShowDailyLimit] = useState(false);

  // Scenario simulator
  const [scenarioType, setScenarioType] = useState("spend_more");
  const [scenarioAmount, setScenarioAmount] = useState("200");

  // Weekly debrief (simulated)
  const isMonday = new Date().getDay() === 1;

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        const [profiles, plans, txs] = await Promise.all([
          base44.entities.UserProfile.filter({ created_by: me.email }),
          base44.entities.FinancialPlan.list("-created_date", 1),
          base44.entities.Transaction.list("-date", 20),
        ]);
        const pr = profiles[0] || DEFAULT_PROFILE;
        const pl = plans[0] || DEFAULT_PLAN;
        const txList = txs.length > 0 ? txs : DEFAULT_TRANSACTIONS;
        setProfile(pr);
        setPlan(pl);
        setTransactions(txList);

        // Initial Maya greeting
        const totalSpent = txList.reduce((s, t) => s + t.amount, 0);
        const foodSpend = txList.filter(t => t.category === "food_delivery").reduce((s, t) => s + t.amount, 0);
        const greeting = buildMayaGreeting(pr, pl, totalSpent, foodSpend);
        setMessages([{ role: "assistant", content: greeting }]);

        // Today's focus
        await loadTodayFocus(txList);
      } catch {
        setProfile(DEFAULT_PROFILE);
        setPlan(DEFAULT_PLAN);
        setTransactions(DEFAULT_TRANSACTIONS);
        setMessages([{ role: "assistant", content: "Hi! I'm Maya, your AI financial coach. How can I help you today?" }]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildMayaGreeting = (pr, pl, totalSpent, foodSpend) => {
    const dna = pr.financial_dna || "planner";
    const income = pr.monthly_income || 3000;
    const healthScore = pl.health_score || 68;
    if (foodSpend > income * 0.15) {
      return `Your food delivery spend is RM${foodSpend.toFixed(0)} this month — ${Math.round(foodSpend / income * 100)}% of your income. That's above the healthy 10% range. Want me to build a recovery plan?`;
    }
    if (healthScore < 55) {
      return `Your financial health score is ${healthScore}/100. There are a few areas we can improve together. Where would you like to start?`;
    }
    return `You're doing well this month! Health score: ${healthScore}/100. Your total spending is RM${totalSpent.toFixed(0)}. Anything specific you'd like to work on?`;
  };

  const loadTodayFocus = async (txList) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const existing = await base44.entities.DailyFocus.filter({ focus_date: today });
      if (existing.length > 0) {
        setTodayFocus(existing[0]);
        setCommitted(existing[0].committed || false);
      } else {
        // Generate focus based on yesterday's spending
        const yesterday = txList.slice(0, 3);
        const recentSpend = yesterday.reduce((s, t) => s + t.amount, 0);
        const focus = {
          focus_text: `Yesterday: RM${recentSpend.toFixed(0)} spent. Keep today's spending under RM${Math.max(20, Math.round(recentSpend * 0.6))}.`,
          target_amount: Math.max(20, Math.round(recentSpend * 0.6)),
          tip_text: "Small daily limits compound into big monthly savings.",
          focus_date: today,
        };
        setTodayFocus(focus);
      }
    } catch {
      setTodayFocus({
        focus_text: "Keep today's spending under RM50.",
        target_amount: 50,
        tip_text: "Every ringgit saved today is progress.",
        focus_date: new Date().toISOString().split("T")[0],
      });
    }
  };

  const handleCommit = async () => {
    setCommitted(true);
    if (todayFocus?.id) {
      base44.entities.DailyFocus.update(todayFocus.id, { committed: true }).catch(() => {});
    } else {
      base44.entities.DailyFocus.create({ ...todayFocus, committed: true }).catch(() => {});
    }
  };

  const handleSendMessage = async (text) => {
    const msg = text || chatInput.trim();
    if (!msg) return;
    setChatInput("");

    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setChatLoading(true);

    try {
      const pr = profile || DEFAULT_PROFILE;
      const pl = plan || DEFAULT_PLAN;
      const totalSpent = transactions.reduce((s, t) => s + t.amount, 0);
      const topCategories = Object.entries(
        transactions.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {})
      ).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}: RM${v.toFixed(0)}`).join(", ");

      const prompt = `You are Maya, a friendly but direct AI financial coach for Malaysian youth. 
DNA type: ${pr.financial_dna}, Income: RM${pr.monthly_income}, Monthly spending: RM${totalSpent.toFixed(0)},
Top categories: ${topCategories}, Health score: ${pl.health_score || 68}/100, Language: ${lang}.
Use simple language, reference real RM amounts. Always end with one specific action.
User question: ${msg}`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      setMessages([...newMessages, { role: "assistant", content: response }]);
    } catch {
      const dna = profile?.financial_dna || "planner";
      const fallbacks = {
        spender: "Focus on reducing food delivery this week — that's usually the biggest drain for your profile.",
        hoarder: "Your savings are strong. Consider moving some cash to FD to earn better returns.",
        avoider: "Start by reviewing your last 5 transactions — awareness is the first step.",
        planner: "You're on track! Double-check your subscription list and see if anything can be cancelled.",
      };
      setMessages([...newMessages, { role: "assistant", content: fallbacks[dna] }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Scenario calculator
  const calcScenario = () => {
    const pr = profile || DEFAULT_PROFILE;
    const pl = plan || DEFAULT_PLAN;
    const income = pr.monthly_income || 3000;
    const currentSavings = Math.round(income * (pl.savings_percent || 20) / 100);
    const amt = parseFloat(scenarioAmount) || 0;
    const healthScore = pl.health_score || 68;

    const scenarios = {
      spend_more: {
        label: `Spend RM${amt} more this month`,
        savingsChange: -amt,
        scoreChange: Math.round(-amt / income * 20),
        balance: income - (income - currentSavings) - amt,
        risk: amt > income * 0.1 ? "High" : "Medium",
      },
      skip_savings: {
        label: "Skip savings this month",
        savingsChange: -currentSavings,
        scoreChange: -12,
        balance: income - (income - currentSavings),
        risk: "High",
      },
      fd_300: {
        label: `Open FD with RM${amt}`,
        savingsChange: 0,
        scoreChange: 8,
        balance: -amt,
        earning: Math.round(amt * 3.8 / 100 * (parseInt(scenarioAmount) < 1000 ? 0.25 : 0.5)),
        risk: "Low",
      },
      reduce_food: {
        label: `Reduce food by RM${amt}`,
        savingsChange: amt,
        scoreChange: Math.round(amt / income * 15),
        balance: amt,
        risk: "Low",
      },
      side_income: {
        label: `Add RM${amt} side income`,
        savingsChange: Math.round(amt * 0.5),
        scoreChange: 10,
        balance: amt,
        risk: "None",
      },
    };
    return scenarios[scenarioType] || scenarios.spend_more;
  };

  const scenario = calcScenario();
  const pr = profile || DEFAULT_PROFILE;
  const pl = plan || DEFAULT_PLAN;
  const dna = DNA_TYPES[pr.financial_dna] || DNA_TYPES.planner;
  const actions = FALLBACK_ACTIONS[pr.financial_dna] || FALLBACK_ACTIONS.planner;

  // Surplus for FD opportunity
  const income = pr.monthly_income || 3000;
  const fixedExp = pr.fixed_expenses || 1200;
  const totalSpent = transactions.reduce((s, t) => s + t.amount, 0);
  const surplus = Math.max(0, income - fixedExp - totalSpent * 0.6 - 400);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Maya...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-12 max-w-lg mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl gradient-purple-pink flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Maya — Finora AI Coach</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-muted-foreground">Active now · Personalized for your DNA</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <DnaBadge dnaType={pr.financial_dna || "planner"} size="sm" />
          <span className="text-xs text-muted-foreground">Health: {pl.health_score || 68}/100</span>
        </div>

        {/* Today's Focus */}
        {todayFocus && (
          <GlassCard className="border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl gradient-purple-pink flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🎯</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-0.5">Today's Focus</p>
                <p className="text-sm text-foreground leading-snug">{todayFocus.focus_text}</p>
                {todayFocus.tip_text && <p className="text-xs text-muted-foreground mt-1 italic">{todayFocus.tip_text}</p>}
              </div>
            </div>
            {!committed ? (
              <div className="flex gap-2 mt-3">
                <Button onClick={handleCommit} className="flex-1 h-9 rounded-xl gradient-purple-pink text-white border-0 text-xs font-semibold">
                  I Commit to This
                </Button>
                <Button variant="outline" onClick={() => handleSendMessage("Suggest an easier alternative for today's focus")}
                  className="flex-1 h-9 rounded-xl border-border/50 text-xs">
                  Easier Option
                </Button>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">Committed for today!</span>
              </div>
            )}
          </GlassCard>
        )}

        {/* Weekly Action Plan */}
        <GlassCard>
          <h3 className="text-sm font-semibold text-foreground mb-3">Your Action Plan — This Week</h3>
          <div className="space-y-2">
            {actions.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl glass-card">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <ActionStatusIcon status={a.status} />
                  <span className="text-xs text-foreground truncate">{a.label}</span>
                </div>
                <Button variant="ghost" onClick={() => a.route === "daily_limit" ? setShowDailyLimit(true) : navigate(a.route)}
                  className="text-xs text-primary h-7 px-2 flex-shrink-0 ml-2">
                  {a.action} <ArrowRight className="w-3 h-3 ml-0.5" />
                </Button>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* FD Opportunity */}
        {surplus >= 100 ? (
          <GlassCard className="border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">FD Opportunity Detected</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              You have an estimated RM{surplus.toFixed(0)} surplus this month. Lock it in to grow your money.
            </p>
            <div className="flex gap-2 flex-wrap text-xs text-muted-foreground mb-3">
              {["1M","3M","6M"].map(t => (
                <span key={t} className="px-2 py-1 rounded-lg bg-secondary/50">{t} · {t === "1M" ? "3.5" : t === "3M" ? "3.65" : "3.8"}% p.a.</span>
              ))}
            </div>
            <Button onClick={() => navigate("/accounts")} className="w-full h-9 rounded-xl gradient-purple-pink text-white border-0 text-xs font-semibold">
              Open FD Account →
            </Button>
          </GlassCard>
        ) : (
          <GlassCard>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">FD Opportunities</p>
            </div>
            <p className="text-xs text-muted-foreground">Build RM200 surplus first to unlock FD opportunities. You could improve your resilience score by activating FD Autopilot in the Accounts page.</p>
            <button onClick={() => navigate("/accounts")} className="text-xs text-primary hover:underline mt-1">Open FD Account →</button>
          </GlassCard>
        )}

        {/* Scenario Simulator */}
        <GlassCard>
          <h3 className="text-sm font-semibold text-foreground mb-3">What-If Simulator</h3>
          <div className="space-y-3">
            <select value={scenarioType} onChange={e => setScenarioType(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-secondary/50 border border-border/60 text-sm text-foreground">
              <option value="spend_more">What if I spend RM{scenarioAmount} more?</option>
              <option value="skip_savings">What if I skip savings this month?</option>
              <option value="fd_300">What if I open a FD with RM{scenarioAmount}?</option>
              <option value="reduce_food">What if I reduce food by RM{scenarioAmount}?</option>
              <option value="side_income">What if I add RM{scenarioAmount} side income?</option>
            </select>
            <Input type="number" value={scenarioAmount} onChange={e => setScenarioAmount(e.target.value)}
              placeholder="Amount (RM)" className="h-10 bg-secondary/50 border-border/60 rounded-xl text-sm" />
            <div className="glass-card rounded-xl p-3 space-y-2 text-sm">
              <p className="text-xs text-primary font-semibold">Impact:</p>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Savings change</span>
                <span className={scenario.savingsChange >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {scenario.savingsChange >= 0 ? "+" : ""}RM{scenario.savingsChange}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Health score</span>
                <span className={scenario.scoreChange >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {scenario.scoreChange >= 0 ? "+" : ""}{scenario.scoreChange} pts
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Risk level</span>
                <span className={scenario.risk === "Low" || scenario.risk === "None" ? "text-emerald-400" : scenario.risk === "Medium" ? "text-amber-400" : "text-red-400"}>
                  {scenario.risk}
                </span>
              </div>
              {scenario.earning && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">FD interest earned</span>
                  <span className="text-emerald-400">+RM{scenario.earning}</span>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Maya Live Chat */}
        <GlassCard className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl gradient-purple-pink flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Chat with Maya</p>
              <p className="text-xs text-muted-foreground">AI financial coach</p>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  m.role === "user" ? "bg-primary text-white" : "bg-secondary/70 text-foreground"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary/70 rounded-2xl px-3 py-2">
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => handleSendMessage(p)}
                className="px-2.5 py-1 rounded-lg bg-secondary/50 text-[11px] text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder="Ask Maya anything..." className="flex-1 h-10 bg-secondary/50 border-border/60 rounded-xl text-xs" />
            <Button onClick={() => handleSendMessage()} disabled={!chatInput.trim() || chatLoading}
              className="w-10 h-10 rounded-xl gradient-purple-pink text-white border-0 p-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </GlassCard>

      </div>
      <DailyLimitModal open={showDailyLimit} onClose={() => setShowDailyLimit(false)} />
      <BottomNav lang={pr.language || "en"} />
    </div>
  );
}