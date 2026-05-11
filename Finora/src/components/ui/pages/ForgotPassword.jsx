import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Mail, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email || !email.includes("@")) return;
    setLoading(true);
    try { await base44.auth.resetPasswordRequest(email); } catch {}
    // Always show success — never reveal if email exists
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="absolute top-0 left-0 right-0 h-72 gradient-purple-pink opacity-10 blur-3xl pointer-events-none" />

      {/* Back button */}
      <div className="px-6 pt-12 max-w-sm mx-auto w-full">
        <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-16 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-[72px] h-[72px] rounded-2xl gradient-purple-pink flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/30">
              <span className="text-2xl font-black text-white">GX</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
            <p className="text-muted-foreground text-sm mt-1">We'll send a secure reset link</p>
          </div>

          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/30 flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-foreground font-semibold">Reset link sent!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  If <span className="text-foreground font-medium">{email}</span> is registered, a password reset link has been sent to your inbox.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Check your spam folder if you don't see it.</p>
              <Link to="/login">
                <Button className="w-full h-12 rounded-xl gradient-purple-pink text-white font-semibold border-0 mt-2">
                  Back to Login
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Registered Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="your@email.com"
                  className="h-[52px] bg-secondary/50 border-border/60 rounded-xl"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={loading || !email.includes("@")}
                className="w-full h-[52px] rounded-xl gradient-purple-pink text-white font-semibold border-0 shadow-lg shadow-primary/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
              </Button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-muted-foreground/50 text-[11px]">
            <Shield className="w-3 h-3" />
            <span>Secure link expires in 1 hour</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}