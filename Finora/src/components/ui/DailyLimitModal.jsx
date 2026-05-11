import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Target, Flame, TrendingDown, CheckCircle2, AlertTriangle } from "lucide-react";

const CATEGORY_CONFIG = {
  food_delivery:  { label: "Food Delivery",  icon: "🛵", color: "text-orange-400 bg-orange-400/10" },
  shopping:       { label: "Shopping",       icon: "🛍️", color: "text-pink-400 bg-pink-400/10" },
  entertainment:  { label: "Entertainment",  icon: "🎬", color: "text-purple-400 bg-purple-400/10" },
  transport:      { label: "Transport",      icon: "🚇", color: "text-blue-400 bg-blue-400/10" },
  subscriptions:  { label: "Subscriptions",  icon: "📺", color: "text-emerald-400 bg-emerald-400/10" },
};

export default function DailyLimitModal({ open, onClose }) {
  const [limits, setLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCategory, setNewCategory] = useState("food_delivery");
  const [newLimit, setNewLimit] = useState("30");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) loadLimits();
  }, [open]);

  const loadLimits = async () => {
    setLoading(true);
    try {
      const items = await base44.entities.DailyLimit.filter({ active: true });
      // Reset today_spent if last_reset_date !== today
      const today = new Date().toISOString().split("T")[0];
      const resetPromises = items
        .filter(l => l.last_reset_date !== today)
        .map(l => base44.entities.DailyLimit.update(l.id, { today_spent: 0, last_reset_date: today }));
      await Promise.all(resetPromises);
      const refreshed = resetPromises.length > 0
        ? await base44.entities.DailyLimit.filter({ active: true })
        : items;
      setLimits(refreshed);
    } catch {
      setLimits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!parseFloat(newLimit)) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const created = await base44.entities.DailyLimit.create({
        category: newCategory,
        daily_limit: parseFloat(newLimit),
        today_spent: 0,
        last_reset_date: today,
        streak: 0,
        active: true,
      });
      setLimits(prev => [...prev.filter(l => l.category !== newCategory), created]);
      setCreating(false);
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.DailyLimit.update(id, { active: false });
    setLimits(prev => prev.filter(l => l.id !== id));
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-purple-pink flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Daily Spending Limits</h2>
                    <p className="text-xs text-muted-foreground">Track & control category spending</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-secondary/30 animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {limits.length === 0 && !creating && (
                    <div className="text-center py-8 space-y-2">
                      <span className="text-4xl">🎯</span>
                      <p className="text-sm font-medium text-foreground">No limits set yet</p>
                      <p className="text-xs text-muted-foreground">Add daily spending limits to stay on track</p>
                    </div>
                  )}
                  {limits.map(l => {
                    const cfg = CATEGORY_CONFIG[l.category] || CATEGORY_CONFIG.food_delivery;
                    const pct = Math.min(100, Math.round(((l.today_spent || 0) / l.daily_limit) * 100));
                    const isWarning = pct >= 75 && pct < 100;
                    const isOver = pct >= 100;
                    return (
                      <div key={l.id} className="glass-card rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{cfg.icon}</span>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{cfg.label}</p>
                              <p className="text-xs text-muted-foreground">Limit: RM{l.daily_limit} · Today: RM{(l.today_spent || 0).toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {l.streak > 0 && (
                              <span className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                                <Flame className="w-3 h-3" /> {l.streak}
                              </span>
                            )}
                            {isOver ? <AlertTriangle className="w-4 h-4 text-red-400" />
                              : isWarning ? <AlertTriangle className="w-4 h-4 text-amber-400" />
                              : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            <button onClick={() => handleDelete(l.id)} className="text-muted-foreground/50 hover:text-red-400 text-xs ml-1">✕</button>
                          </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${isOver ? "bg-red-500" : isWarning ? "bg-amber-400" : "bg-emerald-500"}`}
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className={isOver ? "text-red-400 font-bold" : isWarning ? "text-amber-400" : "text-muted-foreground"}>
                            {pct}% used {isOver ? "⚠️ Over limit!" : isWarning ? "⚡ Near limit" : "✓ On track"}
                          </span>
                          <span className="text-muted-foreground">Resets daily at midnight</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {creating ? (
                <div className="glass-card rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">Add New Limit</p>
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-secondary/50 border border-border/60 text-sm text-foreground">
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                  <Input type="number" value={newLimit} onChange={e => setNewLimit(e.target.value)}
                    placeholder="Daily limit (RM)" className="h-10 bg-secondary/50 border-border/60 rounded-xl text-sm" />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCreating(false)} className="flex-1 h-9 rounded-xl text-xs">Cancel</Button>
                    <Button onClick={handleCreate} disabled={saving} className="flex-1 h-9 rounded-xl gradient-purple-pink text-white border-0 text-xs font-semibold">
                      {saving ? "Saving..." : "Set Limit"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setCreating(true)} className="w-full h-11 rounded-xl gradient-purple-pink text-white border-0 font-semibold">
                  + Add Daily Limit
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}