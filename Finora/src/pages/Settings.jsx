import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import GlassCard from "@/components/ui/GlassCard";
import DnaBadge from "@/components/DnaBadge";
import LogoutConfirmModal from "@/components/LogoutConfirmModal";
import { DEFAULT_PROFILE } from "@/lib/financialDna";
import { t } from "@/lib/translations";
import { setGlobalLang, useLanguage } from "@/lib/useLanguage";
import { Globe, Bell, RotateCcw, FileEdit, LogOut, ChevronRight, User } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ created_by: me.email });
        setProfile(profiles[0] || { ...DEFAULT_PROFILE, full_name: me.full_name || "", username: me.email.split("@")[0], language: "en" });
      } catch {
        setProfile({ ...DEFAULT_PROFILE, language: "en" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateSetting = async (field, value) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    if (field === "language") setGlobalLang(value);
    if (profile?.id) {
      try { await base44.entities.UserProfile.update(profile.id, { [field]: value }); } catch {}
    }
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleResetProfile = async () => {
    if (profile?.id) {
      try { await base44.entities.UserProfile.update(profile.id, { survey_completed: false }); } catch {}
    }
    navigate("/survey", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const pr = profile || DEFAULT_PROFILE;
  const lang = pr.language || "en";

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 pt-12 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-foreground mb-6">{t("settings", lang)}</h1>

        {/* Profile Card */}
        <GlassCard className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl gradient-purple-pink flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate">{pr.full_name || pr.username}</h2>
            <p className="text-xs text-muted-foreground">@{pr.username}</p>
            <div className="mt-1.5">
              <DnaBadge dnaType={pr.financial_dna || "planner"} size="sm" />
            </div>
          </div>
        </GlassCard>

        <div className="space-y-3">
          {/* Language */}
          <GlassCard className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground font-medium">{t("language", lang)}</p>
                <p className="text-xs text-muted-foreground">App-wide language</p>
              </div>
            </div>
            <Select value={lang} onValueChange={(v) => updateSetting("language", v)}>
              <SelectTrigger className="w-36 h-9 bg-secondary/50 border-border/50 rounded-lg text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="ms">🇲🇾 Bahasa Melayu</SelectItem>
                <SelectItem value="zh">🇨🇳 中文</SelectItem>
              </SelectContent>
            </Select>
          </GlassCard>

          {/* Notifications */}
          <GlassCard className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-foreground font-medium">{t("notifications", lang)}</p>
                <p className="text-xs text-muted-foreground">Smart nudges & alerts</p>
              </div>
            </div>
            <Switch
              checked={pr.notifications_enabled !== false}
              onCheckedChange={(v) => updateSetting("notifications_enabled", v)}
            />
          </GlassCard>

          {/* Actions */}
          <GlassCard className="space-y-0.5 p-2">
            <button onClick={() => navigate("/survey")} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileEdit className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-foreground font-medium">{t("editSurvey", lang)}</p>
                  <p className="text-xs text-muted-foreground">Retake financial survey</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="h-px bg-border/30 mx-3" />
            <button onClick={handleResetProfile} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-foreground font-medium">{t("resetProfile", lang)}</p>
                  <p className="text-xs text-muted-foreground">Reset DNA & financial plan</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </GlassCard>

          {/* Logout */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-red-500/10 transition-colors border border-red-500/20"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-sm font-medium text-red-400">{t("logout", lang)}</span>
          </button>

          <LogoutConfirmModal
            open={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            onConfirm={handleLogout}
          />

          {/* App version */}
          <p className="text-center text-xs text-muted-foreground/40 py-2">Finora AI Platform · v2.0 · 256-bit encrypted</p>
        </div>
      </div>
      <BottomNav lang={lang} />
    </div>
  );
}