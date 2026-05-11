import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const CATEGORY_CONFIG = {
  spending_alert:      { icon: "⚠️", label: "Spending Alert",     color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  savings_milestone:   { icon: "🎉", label: "Savings",            color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  fd_suggestion:       { icon: "🏦", label: "FD Autopilot",       color: "text-primary bg-primary/10 border-primary/20" },
  weekly_challenge:    { icon: "🏆", label: "Challenge",          color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  ai_reminder:         { icon: "🤖", label: "AI Coach",           color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  commitment_warning:  { icon: "📋", label: "Commitment",         color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  risk_alert:          { icon: "🚨", label: "Risk Alert",         color: "text-red-400 bg-red-400/10 border-red-400/20" },
};

const SEED_NOTIFICATIONS = [
  { title: "Food Delivery Alert", message: "You exceeded your food delivery budget today by RM12.", category: "spending_alert", read: false },
  { title: "Savings Milestone!", message: "Great job! You saved RM50 this week. Keep it up! 🎉", category: "savings_milestone", read: false },
  { title: "FD Autopilot Suggestion", message: "Your FD Autopilot suggests moving RM100 into a 3-month Fixed Deposit.", category: "fd_suggestion", read: false },
  { title: "Wants Budget Warning", message: "Your wants spending is reaching 28% — approaching your 30% limit.", category: "commitment_warning", read: true },
  { title: "Maya AI Reminder", message: "You haven't logged any spending today. Stay on track with your daily goals.", category: "ai_reminder", read: true },
  { title: "Weekly Challenge Update", message: "You completed 3 consecutive savings days! 🔥 2 more to unlock reward.", category: "weekly_challenge", read: true },
];

export default function NotificationPanel({ open, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) loadNotifications();
  }, [open]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const items = await base44.entities.Notification.list("-created_date", 30);
      if (items.length === 0) {
        // Seed initial notifications
        const seeded = await Promise.all(
          SEED_NOTIFICATIONS.map(n => base44.entities.Notification.create(n))
        );
        setNotifications(seeded.filter(Boolean));
      } else {
        setNotifications(items);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = async () => {
    await Promise.all(notifications.map(n => base44.entities.Notification.delete(n.id)));
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-card z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl gradient-purple-pink flex items-center justify-center">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Notifications</h2>
                  {unreadCount > 0 && <p className="text-xs text-muted-foreground">{unreadCount} unread</p>}
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="flex gap-2 px-5 py-3 border-b border-border/20">
                <Button variant="ghost" onClick={markAllRead} className="flex-1 h-8 text-xs text-muted-foreground hover:text-foreground">
                  <CheckCheck className="w-3.5 h-3.5 mr-1.5" /> Mark all read
                </Button>
                <Button variant="ghost" onClick={clearAll} className="flex-1 h-8 text-xs text-muted-foreground hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear all
                </Button>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-secondary/30 animate-pulse" />
                ))
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center text-3xl">🔔</div>
                  <p className="text-sm font-medium text-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground">No notifications yet.</p>
                </div>
              ) : (
                notifications.map(n => {
                  const cfg = CATEGORY_CONFIG[n.category] || CATEGORY_CONFIG.ai_reminder;
                  return (
                    <motion.div key={n.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      onClick={() => !n.read && markRead(n.id)}
                      className={`relative p-3.5 rounded-xl border transition-colors cursor-pointer ${n.read ? "bg-secondary/20 border-border/30 opacity-60" : "glass-card border-border/50 hover:border-primary/30"}`}>
                      {!n.read && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />}
                      <div className="flex gap-3">
                        <span className="text-xl flex-shrink-0">{cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${cfg.color}`}>{cfg.label}</span>
                          </div>
                          <p className="text-sm font-semibold text-foreground leading-snug">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                          {n.created_date && (
                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                              {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}