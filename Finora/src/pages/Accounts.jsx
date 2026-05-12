import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/ui/GlassCard";
import BottomNav from "@/components/BottomNav";
import TransactionItem from "@/components/dashboard/TransactionItem";
import TransactionApproval from "@/components/TransactionApproval";
import { DEFAULT_TRANSACTIONS, DEFAULT_PROFILE } from "@/lib/financialDna";
import { useLanguage } from "@/lib/useLanguage";
import {
  ArrowLeft, Plus, ArrowUpDown, CreditCard, TrendingUp,
  ChevronDown, ChevronUp, Shield, Loader2, Search
} from "lucide-react";

const MERCHANTS = [
  { name: "7-Eleven", category: "Convenience" }, { name: "AirAsia", category: "Travel" },
  { name: "Boost", category: "E-wallet" }, { name: "FamilyMart", category: "Food & Beverage" },
  { name: "Foodpanda", category: "Food Delivery" }, { name: "Grab", category: "Transport" },
  { name: "GrabFood", category: "Food Delivery" }, { name: "Guardian", category: "Health" },
  { name: "Lazada", category: "Shopping" }, { name: "Lotus's", category: "Grocery" },
  { name: "McDonald's", category: "Food & Beverage" }, { name: "Mr DIY", category: "Household" },
  { name: "Netflix", category: "Subscription" }, { name: "Padini", category: "Fashion" },
  { name: "Petronas", category: "Petrol" }, { name: "Shopee", category: "Shopping" },
  { name: "Spotify", category: "Subscription" }, { name: "Starbucks", category: "Food & Beverage" },
  { name: "Tealive", category: "Food & Beverage" }, { name: "TNG eWallet", category: "E-wallet" },
  { name: "Watsons", category: "Health" },
];

const PROMO_CODES = {
  SAVE5: { type: "flat", value: 5, label: "RM5 off" },
  STUDENT10: { type: "percent", value: 10, max: 10, label: "10% off (max RM10)" },
  FOOD3: { type: "flat", value: 3, categories: ["Food Delivery", "Food & Beverage"], label: "RM3 off food" },
};

export default function Accounts() {
  const navigate = useNavigate();
  const lang = useLanguage();

  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState("main");

  // Balances (persisted in localStorage for demo)
  const [mainBalance, setMainBalance] = useState(() => parseFloat(localStorage.getItem("gx_main") || "2340"));
  const [savingsBalance, setSavingsBalance] = useState(() => parseFloat(localStorage.getItem("gx_savings") || "850"));
  const [emergencyBalance, setEmergencyBalance] = useState(() => parseFloat(localStorage.getItem("gx_emergency") || "320"));
  const [fdAccounts, setFdAccounts] = useState([]);
  const savingsGoal = 3000;
  const emergencyTarget = 1500;

  const persist = (key, val) => localStorage.setItem(key, String(val));

  // Modals
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("100");
  const [topupSource, setTopupSource] = useState("Online Banking");
  const [topupApproval, setTopupApproval] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState("50");
  const [transferFrom, setTransferFrom] = useState("main");
  const [transferTo, setTransferTo] = useState("savings");
  const [transferApproval, setTransferApproval] = useState(false);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("100");
  const [withdrawApproval, setWithdrawApproval] = useState(false);

  const [payOpen, setPayOpen] = useState(false);
  const [payMerchant, setPayMerchant] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payPromo, setPayPromo] = useState("");
  const [payDiscount, setPayDiscount] = useState(0);
  const [payStep, setPayStep] = useState(1);
  const [payApproval, setPayApproval] = useState(false);
  const [merchantSearch, setMerchantSearch] = useState("");

  const [fdApproval, setFdApproval] = useState(false);
  const [fdInputAmount, setFdInputAmount] = useState("300");
  const [fdTenure, setFdTenure] = useState("3");
  const [fdName, setFdName] = useState("FD Account");

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
        setPlan(plans[0]);
        setTransactions(txs.length > 0 ? txs : DEFAULT_TRANSACTIONS.slice(0, 8));
        // Load FD accounts
        const fds = await base44.entities.FDAccount.list("-created_date", 10).catch(() => []);
        setFdAccounts(fds.filter(f => f.status === "active"));
      } catch {
        setProfile(DEFAULT_PROFILE);
        setTransactions(DEFAULT_TRANSACTIONS.slice(0, 8));
      } finally {
        setDataLoading(false);
      }
    };
    load();
  }, []);

  // Computed
  const savingsPercent = Math.min(Math.round((savingsBalance / savingsGoal) * 100), 100);
  const emergencyPercent = Math.min(Math.round((emergencyBalance / emergencyTarget) * 100), 100);
  const survivalDays = Math.round(emergencyBalance / ((profile?.fixed_expenses || 1200) / 30));
  const fdRate = parseFloat(fdTenure) >= 6 ? 3.8 : parseFloat(fdTenure) >= 3 ? 3.65 : 3.5;
  const totalFdValue = fdAccounts.reduce((s, f) => s + (f.amount || 0), 0);

  // Handlers
  const handleTopup = async (amt) => {
    const a = parseFloat(topupAmount);
    setMainBalance(prev => { const n = prev + a; persist("gx_main", n); return n; });
    setTopupOpen(false);
    setTopupApproval(false);
    setTopupAmount("100");
  };

  const fromBalance = transferFrom === "main" ? mainBalance : transferFrom === "savings" ? savingsBalance : emergencyBalance;
  const handleTransfer = async () => {
    const a = parseFloat(transferAmount) || 0;
    if (a <= 0 || a > fromBalance) return;
    // Deduct from source
    if (transferFrom === "main") { setMainBalance(p => { const n = p - a; persist("gx_main", n); return n; }); }
    else if (transferFrom === "savings") { setSavingsBalance(p => { const n = p - a; persist("gx_savings", n); return n; }); }
    else { setEmergencyBalance(p => { const n = p - a; persist("gx_emergency", n); return n; }); }
    // Add to dest
    if (transferTo === "main") { setMainBalance(p => { const n = p + a; persist("gx_main", n); return n; }); }
    else if (transferTo === "savings") { setSavingsBalance(p => { const n = p + a; persist("gx_savings", n); return n; }); }
    else { setEmergencyBalance(p => { const n = p + a; persist("gx_emergency", n); return n; }); }
    setTransferApproval(false);
    setTransferOpen(false);
  };

  const handleWithdraw = async () => {
    const a = parseFloat(withdrawAmount) || 0;
    if (a <= 0 || a > savingsBalance) return;
    setSavingsBalance(p => { const n = p - a; persist("gx_savings", n); return n; });
    setMainBalance(p => { const n = p + a; persist("gx_main", n); return n; });
    setWithdrawApproval(false);
    setWithdrawOpen(false);
  };

  const applyPromo = () => {
    const code = payPromo.toUpperCase();
    const promo = PROMO_CODES[code];
    if (!promo) return;
    const amt = parseFloat(payAmount) || 0;
    if (promo.type === "flat") {
      if (promo.categories && payMerchant && !promo.categories.includes(payMerchant.category)) { return; }
      setPayDiscount(promo.value);
    } else if (promo.type === "percent") {
      setPayDiscount(Math.min((amt * promo.value) / 100, promo.max || 999));
    }
  };

  const payFinal = Math.max(0, (parseFloat(payAmount) || 0) - payDiscount);

  const handlePay = async () => {
    setMainBalance(p => { const n = p - payFinal; persist("gx_main", n); return n; });
    // background transaction insert
    base44.entities.Transaction.create({
      merchant: payMerchant?.name || "Payment",
      category: "shopping",
      amount: payFinal,
      date: new Date().toISOString().split("T")[0],
      description: `Pay to ${payMerchant?.name || "merchant"}`
    }).catch(() => {});
    setPayApproval(false);
    setPayOpen(false);
    setPayStep(1);
    setPayMerchant(null);
    setPayAmount("");
    setPayPromo("");
    setPayDiscount(0);
  };

  const handleFdActivate = async () => {
    const a = parseFloat(fdInputAmount) || 300;
    if (a > mainBalance) return;
    setMainBalance(p => { const n = p - a; persist("gx_main", n); return n; });
    const tenure = parseInt(fdTenure) || 3;
    const startDate = new Date();
    const maturityDate = new Date(startDate);
    maturityDate.setMonth(maturityDate.getMonth() + tenure);
    const rate = fdRate;
    const estReturn = Math.round(a * rate / 100 * tenure / 12 * 100) / 100;
    const newFd = await base44.entities.FDAccount.create({
      name: fdName || `FD – ${tenure}M`,
      amount: a,
      rate,
      tenure_months: tenure,
      start_date: startDate.toISOString().split("T")[0],
      maturity_date: maturityDate.toISOString().split("T")[0],
      status: "active",
      estimated_return: estReturn,
    }).catch(() => null);
    if (newFd) setFdAccounts(prev => [...prev, newFd]);
    setFdApproval(false);
  };

  const toggleCard = (card) => setExpandedCard(expandedCard === card ? null : card);

  const accountLabel = (key) => ({ main: "Main Account", savings: "Savings Pocket", emergency: "Emergency Buffer" }[key] || key);

  const filteredMerchants = MERCHANTS.filter(m =>
    m.name.toLowerCase().includes(merchantSearch.toLowerCase()) ||
    m.category.toLowerCase().includes(merchantSearch.toLowerCase())
  );

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-purple-pink px-6 pt-12 pb-8 rounded-b-3xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }} />
        <div className="max-w-lg mx-auto relative z-10 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">My Accounts</h1>
            <p className="text-white/60 text-xs mt-0.5">Finora Financial Hub</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 max-w-lg mx-auto space-y-3">

        {/* ── MAIN ACCOUNT ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div
            className="gradient-purple-pink rounded-2xl p-5 shadow-xl shadow-primary/20 relative overflow-hidden cursor-pointer"
            onClick={() => toggleCard("main")}
          >
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs font-medium">Finora Main Account</p>
                  <p className="text-white/50 text-[11px] mt-0.5 font-mono">●●●● ●●●● ●●●● 4821</p>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-white/30" />
                  {expandedCard === "main" ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
                </div>
              </div>
              <p className="text-white text-2xl font-bold mt-3">RM {mainBalance.toFixed(2)}</p>
              <p className="text-white/50 text-xs mt-0.5">Safe to spend: RM {Math.max(0, mainBalance - 400).toFixed(2)}</p>
            </div>
          </div>

          <AnimatePresence>
            {expandedCard === "main" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="glass-card rounded-b-2xl -mt-2 pt-5 px-4 pb-4 space-y-4 border-t-0">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Top Up", onClick: () => setTopupOpen(true) },
                      { label: "Transfer", onClick: () => setTransferOpen(true) },
                      { label: "Pay", onClick: () => { setPayOpen(true); setPayStep(1); } },
                    ].map(btn => (
                      <button key={btn.label} onClick={btn.onClick}
                        className="h-10 rounded-xl bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors">
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-2">Recent Transactions</p>
                    <div className="divide-y divide-border/30">
                      {transactions.slice(0, 4).map((tx, i) => <TransactionItem key={tx.id || i} transaction={tx} />)}
                    </div>
                    <button onClick={() => navigate("/insights")} className="text-xs text-primary hover:underline mt-2 block">View all →</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── SAVINGS POCKET ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div
            className="glass-card rounded-2xl p-4 cursor-pointer"
            style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,78,59,0.1))", border: "1px solid rgba(16,185,129,0.2)" }}
            onClick={() => toggleCard("savings")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-xl">💰</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Savings Pocket</p>
                  <p className="text-xs text-muted-foreground">Emergency Fund · {savingsPercent}% of goal</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-emerald-400">RM {savingsBalance.toFixed(2)}</p>
                {expandedCard === "savings" ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${savingsPercent}%`, transition: "width 1s" }} />
            </div>
          </div>

          <AnimatePresence>
            {expandedCard === "savings" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="glass-card rounded-b-2xl -mt-2 pt-5 px-4 pb-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current savings</span>
                    <span className="font-semibold text-foreground">RM {savingsBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Goal</span>
                    <span className="font-semibold text-foreground">RM {savingsGoal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining to goal</span>
                    <span className="font-semibold text-emerald-400">RM {(savingsGoal - savingsBalance).toFixed(2)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                    Maya: Save RM{Math.round((savingsGoal - savingsBalance) / 6)} monthly to hit your goal in 6 months.
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setTransferOpen(true)} className="flex-1 h-9 rounded-xl gradient-purple-pink text-white border-0 text-xs">
                      <Plus className="w-3 h-3 mr-1" /> Add Money
                    </Button>
                    <Button variant="outline" onClick={() => setWithdrawOpen(true)} className="flex-1 h-9 rounded-xl border-border/50 text-xs">
                      <ArrowUpDown className="w-3 h-3 mr-1" /> Withdraw
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── FIXED DEPOSIT ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div
            className="glass-card rounded-2xl p-4 cursor-pointer"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(109,40,217,0.1))", border: "1px solid rgba(124,58,237,0.25)" }}
            onClick={() => toggleCard("fd")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-xl">🏦</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Fixed Deposits</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fdAccounts.length > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-secondary text-muted-foreground"}`}>
                    {fdAccounts.length > 0 ? `${fdAccounts.length} active · locked 🔒` : "No active FD"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-primary">RM {totalFdValue.toFixed(2)}</p>
                {expandedCard === "fd" ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {expandedCard === "fd" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                <div className="glass-card rounded-b-2xl -mt-2 pt-5 px-4 pb-4 space-y-4">
                  {/* Existing FD cards */}
                  {fdAccounts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Your FD Portfolio</p>
                      {fdAccounts.map(fd => {
                        const start = new Date(fd.start_date);
                        const maturity = new Date(fd.maturity_date);
                        const now = new Date();
                        const totalDays = (maturity - start) / (1000 * 60 * 60 * 24);
                        const daysLeft = Math.max(0, Math.ceil((maturity - now) / (1000 * 60 * 60 * 24)));
                        const progress = Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100));
                        return (
                          <div key={fd.id} className="p-3 rounded-xl bg-primary/8 border border-primary/20 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{fd.name}</p>
                                <p className="text-xs text-primary font-medium">{fd.rate}% p.a. · {fd.tenure_months}M</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-foreground">RM {fd.amount.toFixed(2)}</p>
                                <p className="text-xs text-emerald-400">+RM {(fd.estimated_return || 0).toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%`, transition: "width 0.8s" }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>🔒 Locked until {fd.maturity_date}</span>
                              <span>{daysLeft} days remaining</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* New FD placement */}
                  <div>
                    <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-2">+ New Fixed Deposit</p>
                    <div className="space-y-2">
                      <Input value={fdName} onChange={e => setFdName(e.target.value)} placeholder="FD name (e.g. Emergency FD)"
                        className="h-9 bg-secondary/50 border-border/60 rounded-xl text-sm" onClick={e => e.stopPropagation()} />
                      <div className="flex gap-2">
                        <Input type="number" value={fdInputAmount} onChange={e => setFdInputAmount(e.target.value)} placeholder="Amount"
                          className="flex-1 h-9 bg-secondary/50 border-border/60 rounded-xl text-sm" onClick={e => e.stopPropagation()} />
                        <select value={fdTenure} onChange={e => setFdTenure(e.target.value)} onClick={e => e.stopPropagation()}
                          className="h-9 px-3 rounded-xl bg-secondary/50 border border-border/60 text-xs text-foreground">
                          {["1","3","6","12"].map(m => <option key={m} value={m}>{m}M</option>)}
                        </select>
                      </div>
                      <div className="p-2.5 rounded-xl bg-secondary/30 text-xs space-y-1">
                        <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="text-primary font-semibold">{fdRate}% p.a.</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Est. return</span><span className="text-emerald-400 font-semibold">+RM {Math.round(parseFloat(fdInputAmount || 0) * fdRate / 100 * parseInt(fdTenure) / 12)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Locked until</span><span className="text-foreground">{(() => { const d = new Date(); d.setMonth(d.getMonth() + parseInt(fdTenure)); return d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }); })()}</span></div>
                      </div>
                      <Button onClick={e => { e.stopPropagation(); setFdApproval(true); }}
                        disabled={!parseFloat(fdInputAmount) || parseFloat(fdInputAmount) > mainBalance}
                        className="w-full h-9 rounded-xl gradient-purple-pink text-white border-0 text-xs font-semibold">
                        <TrendingUp className="w-3 h-3 mr-1" /> Place Fixed Deposit
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── EMERGENCY BUFFER ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div
            className="glass-card rounded-2xl p-4 cursor-pointer"
            style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(180,83,9,0.08))", border: "1px solid rgba(245,158,11,0.2)" }}
            onClick={() => toggleCard("emergency")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl">🛡️</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Emergency Buffer</p>
                  <p className="text-xs text-muted-foreground">{survivalDays} survival days · {emergencyPercent}% of target</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-amber-400">RM {emergencyBalance.toFixed(2)}</p>
                {expandedCard === "emergency" ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${emergencyPercent}%`, transition: "width 1s" }} />
            </div>
          </div>

          <AnimatePresence>
            {expandedCard === "emergency" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="glass-card rounded-b-2xl -mt-2 pt-5 px-4 pb-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current buffer</span>
                    <span className="font-semibold text-foreground">RM {emergencyBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Target (3 months expenses)</span>
                    <span className="font-semibold text-foreground">RM {emergencyTarget}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Survival days covered</span>
                    <span className="font-semibold text-amber-400">{survivalDays} days</span>
                  </div>
                  {emergencyPercent < 50 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                      Maya: Your emergency buffer is low. Aim to add RM100/month until you reach 90 days of coverage.
                    </div>
                  )}
                  <Button
                    onClick={(e) => { e.stopPropagation(); setTransferTo("emergency"); setTransferFrom("main"); setTransferOpen(true); }}
                    className="w-full h-9 rounded-xl gradient-purple-pink text-white border-0 text-xs font-semibold"
                  >
                    <Shield className="w-3 h-3 mr-1" /> Add to Emergency Buffer
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ─── TOP UP MODAL ─── */}
      <AnimatePresence>
        {topupOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end"
            onClick={e => e.target === e.currentTarget && setTopupOpen(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="w-full max-w-lg mx-auto bg-card rounded-t-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-foreground">Top Up</h2>
                <button onClick={() => setTopupOpen(false)} className="text-muted-foreground">✕</button>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Amount (RM)</label>
                <Input type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)}
                  className="h-14 text-2xl font-bold text-center bg-secondary/50 border-border/60 rounded-xl" />
                <div className="flex gap-2">
                  {[50,100,300,500].map(a => (
                    <button key={a} onClick={() => setTopupAmount(String(a))}
                      className="flex-1 h-8 rounded-lg bg-secondary/50 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                      RM{a}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Source</label>
                <div className="flex gap-2 flex-wrap">
                  {["Debit Card","Online Banking","E-wallet"].map(s => (
                    <button key={s} onClick={() => setTopupSource(s)}
                      className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors ${topupSource === s ? "bg-primary text-white" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={() => { setTopupOpen(false); setTopupApproval(true); }}
                disabled={!parseFloat(topupAmount) || parseFloat(topupAmount) <= 0}
                className="w-full h-12 rounded-xl gradient-purple-pink text-white font-semibold border-0">
                Review Top Up →
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── TRANSFER MODAL ─── */}
      <AnimatePresence>
        {transferOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end"
            onClick={e => e.target === e.currentTarget && setTransferOpen(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="w-full max-w-lg mx-auto bg-card rounded-t-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-foreground">Transfer</h2>
                <button onClick={() => setTransferOpen(false)} className="text-muted-foreground">✕</button>
              </div>
              {[
                { label: "From", val: transferFrom, set: setTransferFrom },
                { label: "To", val: transferTo, set: setTransferTo },
              ].map(({ label, val, set }) => (
                <div key={label} className="space-y-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">{label}</label>
                  <select value={val} onChange={e => set(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-secondary/50 border border-border/60 text-sm text-foreground">
                    <option value="main">Main Account (RM {mainBalance.toFixed(2)})</option>
                    <option value="savings">Savings Pocket (RM {savingsBalance.toFixed(2)})</option>
                    <option value="emergency">Emergency Buffer (RM {emergencyBalance.toFixed(2)})</option>
                  </select>
                </div>
              ))}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Amount (RM)</label>
                <Input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)}
                  className="h-14 text-2xl font-bold text-center bg-secondary/50 border-border/60 rounded-xl" />
                <div className="flex gap-2">
                  {[50,100,200,300].map(a => (
                    <button key={a} onClick={() => setTransferAmount(String(a))}
                      className="flex-1 h-8 rounded-lg bg-secondary/50 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                      RM{a}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => { setTransferOpen(false); setTransferApproval(true); }}
                disabled={!parseFloat(transferAmount) || parseFloat(transferAmount) > fromBalance || transferFrom === transferTo}
                className="w-full h-12 rounded-xl gradient-purple-pink text-white font-semibold border-0">
                Review Transfer →
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── WITHDRAW MODAL ─── */}
      <AnimatePresence>
        {withdrawOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end"
            onClick={e => e.target === e.currentTarget && setWithdrawOpen(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="w-full max-w-lg mx-auto bg-card rounded-t-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-foreground">Withdraw from Savings</h2>
                <button onClick={() => setWithdrawOpen(false)} className="text-muted-foreground">✕</button>
              </div>
              <div className="glass-card rounded-xl p-3 text-xs text-amber-400 border border-amber-500/20 bg-amber-500/10">
                Withdrawing may delay your Emergency Fund goal.
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Amount (RM)</label>
                <Input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                  className="h-14 text-2xl font-bold text-center bg-secondary/50 border-border/60 rounded-xl" />
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>Savings after: RM {Math.max(0, savingsBalance - (parseFloat(withdrawAmount) || 0)).toFixed(2)}</span>
                  <span>Main after: RM {(mainBalance + (parseFloat(withdrawAmount) || 0)).toFixed(2)}</span>
                </div>
              </div>
              <Button
                onClick={() => { setWithdrawOpen(false); setWithdrawApproval(true); }}
                disabled={!parseFloat(withdrawAmount) || parseFloat(withdrawAmount) > savingsBalance}
                className="w-full h-12 rounded-xl gradient-purple-pink text-white font-semibold border-0">
                Review Withdrawal →
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PAY MODAL ─── */}
      <AnimatePresence>
        {payOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end"
            onClick={e => e.target === e.currentTarget && setPayOpen(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="w-full max-w-lg mx-auto bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {payStep > 1 && <button onClick={() => setPayStep(p => p - 1)} className="text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>}
                  <h2 className="text-lg font-bold text-foreground">
                    {payStep === 1 ? "Select Merchant" : payStep === 2 ? "Enter Amount" : "Review Payment"}
                  </h2>
                </div>
                <button onClick={() => setPayOpen(false)} className="text-muted-foreground">✕</button>
              </div>

              {payStep === 1 && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={merchantSearch} onChange={e => setMerchantSearch(e.target.value)}
                      placeholder="Search merchants..." className="h-10 pl-9 bg-secondary/50 border-border/60 rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {filteredMerchants.map(m => (
                      <button key={m.name} onClick={() => { setPayMerchant(m); setPayStep(2); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left">
                        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {payStep === 2 && payMerchant && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 glass-card rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                      {payMerchant.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{payMerchant.name}</p>
                      <p className="text-xs text-muted-foreground">{payMerchant.category}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Amount (RM)</label>
                    <Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                      className="h-14 text-2xl font-bold text-center bg-secondary/50 border-border/60 rounded-xl" placeholder="0.00" />
                  </div>
                  <div className="flex gap-2">
                    <Input value={payPromo} onChange={e => setPayPromo(e.target.value.toUpperCase())}
                      placeholder="Promo code" className="flex-1 h-9 bg-secondary/50 border-border/60 rounded-xl text-sm uppercase" />
                    <Button onClick={applyPromo} variant="outline" className="h-9 px-4 rounded-xl text-xs">Apply</Button>
                  </div>
                  {payDiscount > 0 && (
                    <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl">
                      Promo applied: -RM{payDiscount.toFixed(2)}
                    </div>
                  )}
                  <Button onClick={() => setPayStep(3)} disabled={!parseFloat(payAmount) || parseFloat(payAmount) <= 0}
                    className="w-full h-12 rounded-xl gradient-purple-pink text-white font-semibold border-0">
                    Review Payment →
                  </Button>
                </div>
              )}

              {payStep === 3 && payMerchant && (
                <div className="space-y-4">
                  <div className="glass-card rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Merchant</span><span className="font-semibold">{payMerchant.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{payMerchant.category}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span>RM {parseFloat(payAmount).toFixed(2)}</span></div>
                    {payDiscount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-emerald-400">-RM {payDiscount.toFixed(2)}</span></div>}
                    <div className="border-t border-border/30 pt-2 flex justify-between font-bold">
                      <span>Total Payable</span><span className="text-primary">RM {payFinal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Balance after</span><span className={mainBalance - payFinal < 0 ? "text-red-400" : "text-foreground"}>RM {(mainBalance - payFinal).toFixed(2)}</span></div>
                  </div>
                  <Button onClick={() => { setPayOpen(false); setPayApproval(true); }}
                    disabled={payFinal > mainBalance}
                    className="w-full h-12 rounded-xl gradient-purple-pink text-white font-semibold border-0">
                    Approve Payment →
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── APPROVAL MODALS ─── */}
      <TransactionApproval
        open={topupApproval}
        onClose={() => setTopupApproval(false)}
        onApprove={handleTopup}
        title="Approve Top Up"
        toLabel="Main Account"
        amount={parseFloat(topupAmount) || 0}
        balanceBefore={mainBalance}
        extraInfo={`Via ${topupSource}`}
        successTitle="Top Up Successful!"
        successSubtitle={`RM${parseFloat(topupAmount).toFixed(2)} added to your Main Account`}
      />
      <TransactionApproval
        open={transferApproval}
        onClose={() => setTransferApproval(false)}
        onApprove={handleTransfer}
        title="Approve Transfer"
        fromLabel={accountLabel(transferFrom)}
        toLabel={accountLabel(transferTo)}
        amount={parseFloat(transferAmount) || 0}
        balanceBefore={fromBalance}
        successTitle="Transfer Successful!"
        successSubtitle={`RM${parseFloat(transferAmount).toFixed(2)} transferred`}
      />
      <TransactionApproval
        open={withdrawApproval}
        onClose={() => setWithdrawApproval(false)}
        onApprove={handleWithdraw}
        title="Approve Withdrawal"
        fromLabel="Savings Pocket"
        toLabel="Main Account"
        amount={parseFloat(withdrawAmount) || 0}
        balanceBefore={savingsBalance}
        successTitle="Withdrawal Successful!"
        successSubtitle={`RM${parseFloat(withdrawAmount).toFixed(2)} moved to Main Account`}
      />
      <TransactionApproval
        open={payApproval}
        onClose={() => setPayApproval(false)}
        onApprove={handlePay}
        title={`Pay ${payMerchant?.name || ""}`}
        fromLabel="Main Account"
        toLabel={payMerchant?.name}
        amount={payFinal}
        balanceBefore={mainBalance}
        successTitle="Payment Successful!"
        successSubtitle={`Paid RM${payFinal.toFixed(2)} to ${payMerchant?.name}`}
      />
      <TransactionApproval
        open={fdApproval}
        onClose={() => setFdApproval(false)}
        onApprove={handleFdActivate}
        title="Place Fixed Deposit"
        fromLabel="Main Account"
        toLabel={fdName || "Fixed Deposit"}
        amount={parseFloat(fdInputAmount) || 0}
        balanceBefore={mainBalance}
        extraInfo={`Rate: ${fdRate}% p.a. · Tenure: ${fdTenure} months · Locked until maturity`}
        successTitle="FD Placed Successfully!"
        successSubtitle={`RM${parseFloat(fdInputAmount).toFixed(2)} is now locked and earning ${fdRate}% p.a.`}
      />

      <BottomNav lang={profile?.language || "en"} />
    </div>
  );
}