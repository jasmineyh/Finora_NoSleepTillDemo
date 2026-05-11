import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import GlassCard from "@/components/ui/GlassCard";
import DnaBadge from "@/components/DnaBadge";
import HealthScore from "@/components/dashboard/HealthScore";
import BudgetChart from "@/components/dashboard/BudgetChart";
import SavingsProgress from "@/components/dashboard/SavingsProgress";
import TransactionItem from "@/components/dashboard/TransactionItem";
import NextBestAction from "@/components/dashboard/NextBestAction";
import DebtWarningCard from "@/components/dashboard/DebtWarningCard";
import CommitmentCard from "@/components/dashboard/CommitmentCard";
import WeeklyChallengeCard from "@/components/dashboard/WeeklyChallengeCard";
import ResilienceJourneyCard from "@/components/dashboard/ResilienceJourneyCard";
import SocialComparisonCard from "@/components/dashboard/SocialComparisonCard";
import LogoutConfirmModal from "@/components/LogoutConfirmModal";
import NotificationPanel from "@/components/NotificationPanel";
import FinoraLogo from "@/components/FinoraLogo";
import { DEFAULT_PLAN, DEFAULT_PROFILE, DEFAULT_TRANSACTIONS, DNA_TYPES } from "@/lib/financialDna";
import { useLanguage } from "@/lib/useLanguage";
import { Bell, TrendingUp, AlertTriangle, Lightbulb, Wallet, LogOut } from "lucide-react";
import { t } from "@/lib/translations";

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const lang = useLanguage();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        const [profiles, plans, txs] = await Promise.all([
          base44.entities.UserProfile.filter({ created_by: me.email }),
          base44.entities.FinancialPlan.list("-created_date", 1),
          base44.entities.Transaction.list("-date", 10),
        ]);
        setProfile(profiles[0] || DEFAULT_PROFILE);
        setPlan(plans[0] || DEFAULT_PLAN);
        setTransactions(txs.length > 0 ? txs : DEFAULT_TRANSACTIONS.slice(0, 10));
      } catch {
        setProfile(DEFAULT_PROFILE);
        setPlan(DEFAULT_PLAN);
        setTransactions(DEFAULT_TRANSACTIONS.slice(0, 6));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-[56px] h-[56px] rounded-2xl gradient-purple-pink flex items-center justify-center shadow-xl shadow-primary/30 animate-pulse">
          <svg viewBox="0 0 40 40" fill="none" className="w-[60%] h-[60%]">
            <path d="M12 8 L12 32" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M12 8 L26 8" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M12 19 L22 19" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
            <circle cx="29" cy="28" r="3" fill="rgba(255,255,255,0.8)"/>
          </svg>
        </div>
        <div className="text-center space-y-1">
          <p className="text-base font-black gradient-text">Finora</p>
          <p className="text-xs text-muted-foreground">Loading your financial universe...</p>
        </div>
      </div>
    );
  }

  const p = plan || DEFAULT_PLAN;
  const pr = profile || DEFAULT_PROFILE;
  const dna = DNA_TYPES[pr.financial_dna] || DNA_TYPES.planner;
  const savingsAmount = Math.round((pr.monthly_income || 3000) * (p.savings_percent || 20) / 100);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-purple-pink px-6 pt-12 pb-10 rounded-b-3xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }} />
        <div className="max-w-lg mx-auto relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/70 text-sm font-medium">Welcome back 👋</p>
              <h1 className="text-xl font-bold text-white">{pr.full_name || pr.username || "User"}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowNotifications(true)} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center relative hover:bg-white/25 transition-colors">
                <Bell className="w-5 h-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <button onClick={() => setShowLogoutModal(true)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" title="Sign out">
                <LogOut className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <DnaBadge dnaType={pr.financial_dna || "planner"} size="sm" />
            <span className="text-white/60 text-xs">· Save {pr.saving_baseline_percent || dna.defaultSavingPercent}% recommended</span>
          </div>

          {/* Account balance mini-card */}
          <button
            onClick={() => navigate("/accounts")}
            className="mt-4 w-full bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-left border border-white/10 hover:bg-white/15 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs">Main Balance</p>
                <p className="text-white text-2xl font-bold mt-0.5">RM {parseFloat(localStorage.getItem("gx_main") || "2340").toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-white/70" />
                <span className="text-white/50 text-xs">Tap to manage →</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="px-6 -mt-4 max-w-lg mx-auto space-y-4">
        {/* Debt Warning (conditionally shown) */}
        <DebtWarningCard transactions={transactions} profile={pr} />

        <HealthScore score={p.health_score || 68} />

        {/* Next Best Action */}
        <NextBestAction plan={p} />

        <BudgetChart needs={p.needs_percent || 50} wants={p.wants_percent || 30} savings={p.savings_percent || 20} />
        <SavingsProgress current={savingsAmount} target={pr.savings_goal || 500} />

        {/* Weekly Challenge */}
        <WeeklyChallengeCard profile={pr} />

        {/* FD Autopilot — summary card, links to Accounts */}
        <button onClick={() => navigate("/accounts")} className="w-full text-left">
          <GlassCard className="border border-primary/15 hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">FD Autopilot</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{p.fd_recommendation || DEFAULT_PLAN.fd_recommendation}</p>
              </div>
              <span className="text-xs text-primary mt-1 flex-shrink-0">Open →</span>
            </div>
          </GlassCard>
        </button>

        {/* Resilience Journey */}
        <ResilienceJourneyCard healthScore={p.health_score} />

        {/* Commitment */}
        <CommitmentCard profile={pr} />

        {/* Smart Nudges */}
        {(p.nudges || dna.nudges)?.length > 0 && (
          <GlassCard>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" /> Smart Nudges
            </h3>
            <div className="space-y-2">
              {(p.nudges || dna.nudges).slice(0, 3).map((nudge, i) => (
                <div key={i} className="bg-secondary/50 rounded-lg px-3 py-2 text-xs text-foreground/80">{nudge}</div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Risk Alerts */}
        {(p.risk_alerts || []).length > 0 && (
          <GlassCard>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Risk Alerts
            </h3>
            <div className="space-y-2">
              {p.risk_alerts.map((alert, i) => (
                <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400">{alert}</div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Social Comparison */}
        <SocialComparisonCard profile={pr} />

        {/* Recent Transactions */}
        <GlassCard>
          <h3 className="text-sm font-semibold text-foreground mb-2">Recent Transactions</h3>
          <div className="divide-y divide-border/30">
            {transactions.slice(0, 5).map((tx, i) => (
              <TransactionItem key={tx.id || i} transaction={tx} />
            ))}
          </div>
        </GlassCard>
      </div>

      <LogoutConfirmModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => { setShowLogoutModal(false); logout(); }}
      />
      <NotificationPanel open={showNotifications} onClose={() => setShowNotifications(false)} />
      <BottomNav lang={pr.language || "en"} />
    </div>
  );
}