import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import PasswordValidator, { validatePassword } from "@/components/PasswordValidator";

export default function ResetPassword() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    setError("");
    if (!validatePassword(password)) { setError("Password does not meet requirements"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken: token, newPassword: password });
      setDone(true);
      setTimeout(() => { window.location.href = "/login"; }, 2000);
    } catch (err) {
      setError(err.message || "Reset failed. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-purple-pink flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <span className="text-2xl font-bold text-white">GX</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">New Password</h1>
        </div>
        {error && <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}
        {done ? (
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-emerald-400 font-medium">Password reset! Redirecting to login...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">New Password</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-secondary/50 border-border/50 rounded-xl pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordValidator password={password} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Confirm Password</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12 bg-secondary/50 border-border/50 rounded-xl" />
            </div>
            <Button onClick={handleReset} disabled={loading} className="w-full h-12 rounded-xl gradient-purple-pink text-white font-semibold border-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}