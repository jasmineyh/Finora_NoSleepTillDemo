import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ChevronRight } from "lucide-react";

const COMMITMENT_TEMPLATES = [
  { title: "Save RM500 this month", category: "savings", target_amount: 500, days_total: 30 },
  { title: "Keep wants spending below 30%", category: "spending_cap", spending_cap_percent: 30, days_total: 30 },
  { title: "No food delivery for 7 days", category: "food_delivery", days_total: 7 },
  { title: "Save RM100 in 30 days", category: "savings", target_amount: 100, days_total: 30 },
  { title: "Cap weekend spending at RM80", category: "spending_cap", target_amount: 80, days_total: 30 },
  { title: "Cancel one unused subscription", category: "subscription", days_total: 7 },
];

const STATUS_CONFIG = {
  on_track: { label: "On Track", className: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" },
  at_risk: { label: "At Risk", className: "bg-amber-400/10 text-amber-400 border-amber-400/20" },
  broken: { label: "Broken", className: "bg-red-400/10 text-red-400 border-red-400/20" },
  completed: { label: "Completed", className: "bg-primary/10 text-primary border-primary/20" },
};

export default function CommitmentCard({ profile }) {
  const [commitment, setCommitment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", target_amount: "", days_total: "30" });

  useEffect(() => {
    loadCommitment();
  }, []);

  const loadCommitment = async () => {
    setLoading(true);
    try {
      const items = await base44.entities.Commitment.filter({ active: true });
      if (items.length > 0) {
        setCommitment(items[0]);
      } else {
        setCommitment(null);
      }
    } catch {
      setCommitment(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (template) => {
    setSaving(true);
    try {
      const daysLeft = template.days_total || 30;
      const created = await base44.entities.Commitment.create({
        ...template,
        days_remaining: daysLeft,
        current_progress: 0,
        status: "on_track",
        active: true,
        maya_note: buildMayaNote(template),
      });
      setCommitment(created);
      setShowModal(false);
    } catch (e) {
      console.error("[Commitment] create failed", e);
    } finally {
      setSaving(false);
    }
  };

  const handleCustomCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const created = await base44.entities.Commitment.create({
        title: form.title.trim(),
        target_amount: parseFloat(form.target_amount) || 0,
        days_total: parseInt(form.days_total) || 30,
        days_remaining: parseInt(form.days_total) || 30,
        current_progress: 0,
        status: "on_track",
        active: true,
        category: "custom",
        maya_note: `You've committed to: "${form.title}". Check in daily to stay on track.`
      });
      setCommitment(created);
      setShowModal(false);
      setEditMode(false);
    } catch (e) {
      console.error("[Commitment] custom create failed", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!commitment) return;
    setSaving(true);
    try {
      await base44.entities.Commitment.update(commitment.id, { active: false });
      setCommitment(null);
      setShowModal(false);
    } catch (e) {
      console.error("[Commitment] delete failed", e);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (updates) => {
    if (!commitment) return;
    setSaving(true);
    try {
      const updated = await base44.entities.Commitment.update(commitment.id, updates);
      setCommitment({ ...commitment, ...updates });
    } catch (e) {
      console.error("[Commitment] update failed", e);
    } finally {
      setSaving(false);
    }
  };

  const buildMayaNote = (t) => {
    if (t.category === "savings") return `Save RM${t.target_amount || 0} over ${t.days_total} days. That's RM${Math.round((t.target_amount || 0) / (t.days_total || 30))}/day.`;
    if (t.category === "food_delivery") return `Avoiding food delivery for ${t.days_total} days could save you RM60–120!`;
    if (t.category === "spending_cap") return `Keeping wants below ${t.spending_cap_percent || 30}% builds disciplined spending habits.`;
    return "Stay consistent. Small wins build lasting habits.";
  };

  const progress = commitment ? Math.min(Math.round((commitment.current_progress / (commitment.target_amount || commitment.days_total || 1)) * 100), 100) : 0;
  const daysLeft = commitment?.days_remaining ?? 0;

  if (loading) return null;

  return (
    <>
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Monthly Commitment</h3>
          {commitment && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[commitment.status]?.className}`}>
              {STATUS_CONFIG[commitment.status]?.label}
            </span>
          )}
        </div>

        {commitment ? (
          <div className="space-y-3">
            <p className="text-sm text-foreground leading-snug font-medium">"{commitment.title}"</p>

            {commitment.target_amount > 0 && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span className="text-foreground font-medium">RM {commitment.current_progress} / RM {commitment.target_amount}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div className="h-full gradient-purple-pink rounded-full" initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }} transition={{ duration: 0.7 }} />
                </div>
              </div>
            )}

            {commitment.maya_note && (
              <p className="text-xs text-muted-foreground italic leading-relaxed border-l-2 border-primary/30 pl-2">{commitment.maya_note}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{daysLeft} days remaining</span>
              <Button variant="ghost" onClick={() => setShowModal(true)} className="text-xs text-primary h-7 px-2">
                Update <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-3 space-y-3">
            <p className="text-xs text-muted-foreground">No active commitment. Set one to build a savings habit.</p>
            <Button onClick={() => setShowModal(true)} className="w-full h-9 rounded-xl gradient-purple-pink text-white border-0 text-xs font-semibold">
              Set Commitment
            </Button>
          </div>
        )}
      </GlassCard>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="w-full max-w-lg mx-auto bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  {commitment ? "Update Commitment" : "New Commitment"}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>

              {commitment && !editMode && (
                <div className="space-y-4">
                  <div className="glass-card rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-foreground">"{commitment.title}"</p>
                    {commitment.target_amount > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>RM {commitment.current_progress} / RM {commitment.target_amount}</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full gradient-purple-pink rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Status</span>
                      <span className={STATUS_CONFIG[commitment.status]?.className + " px-2 py-0.5 rounded-full text-[10px] border"}>
                        {STATUS_CONFIG[commitment.status]?.label}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Days remaining</span>
                      <span className="text-foreground font-medium">{daysLeft} days</span>
                    </div>
                    {commitment.maya_note && <p className="text-xs text-muted-foreground italic">{commitment.maya_note}</p>}
                  </div>

                  {commitment.target_amount > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Update Progress (RM)</label>
                      <div className="flex gap-2">
                        <Input type="number" placeholder="Amount saved so far" id="progress-input"
                          defaultValue={commitment.current_progress}
                          className="flex-1 h-10 bg-secondary/50 border-border/60 rounded-xl text-sm" />
                        <Button onClick={() => {
                          const val = parseFloat(document.getElementById("progress-input").value) || 0;
                          handleUpdate({ current_progress: val, status: val >= commitment.target_amount ? "completed" : daysLeft < 7 && val < commitment.target_amount * 0.5 ? "at_risk" : "on_track" });
                        }} disabled={saving} className="h-10 px-4 rounded-xl gradient-purple-pink text-white border-0 text-xs">
                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setEditMode(true); setForm({ title: commitment.title, target_amount: commitment.target_amount || "", days_total: commitment.days_total || "30" }); }}
                      className="flex-1 h-10 rounded-xl border-border/50 text-xs">Edit</Button>
                    <Button variant="outline" onClick={handleDelete} disabled={saving}
                      className="flex-1 h-10 rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs">
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
                    </Button>
                  </div>
                </div>
              )}

              {(!commitment || editMode) && !saving && (
                <div className="space-y-4">
                  {!editMode && (
                    <>
                      <p className="text-xs text-muted-foreground">Choose a commitment template:</p>
                      <div className="space-y-2">
                        {COMMITMENT_TEMPLATES.map((t, i) => (
                          <button key={i} onClick={() => handleCreate(t)}
                            className="w-full text-left p-3 rounded-xl glass-card hover:bg-primary/10 hover:border-primary/30 transition-colors border border-border/40">
                            <p className="text-sm font-medium text-foreground">{t.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{t.days_total} days</p>
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/30" /></div>
                        <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or create custom</span></div>
                      </div>
                    </>
                  )}

                  <div className="space-y-3">
                    <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="Commitment title" className="h-11 bg-secondary/50 border-border/60 rounded-xl text-sm" />
                    <div className="flex gap-2">
                      <Input type="number" value={form.target_amount} onChange={e => setForm(p => ({ ...p, target_amount: e.target.value }))}
                        placeholder="Target (RM, optional)" className="flex-1 h-11 bg-secondary/50 border-border/60 rounded-xl text-sm" />
                      <Input type="number" value={form.days_total} onChange={e => setForm(p => ({ ...p, days_total: e.target.value }))}
                        placeholder="Days" className="w-24 h-11 bg-secondary/50 border-border/60 rounded-xl text-sm" />
                    </div>
                    <Button onClick={handleCustomCreate} disabled={!form.title.trim() || saving}
                      className="w-full h-11 rounded-xl gradient-purple-pink text-white border-0 text-sm font-semibold">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editMode ? "Update Commitment" : "Create Commitment"}
                    </Button>
                    {editMode && <Button variant="ghost" onClick={() => setEditMode(false)} className="w-full h-9 text-xs text-muted-foreground">Cancel</Button>}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}