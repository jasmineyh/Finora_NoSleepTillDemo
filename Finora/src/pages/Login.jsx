import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ArrowLeft, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SECURITY_IMAGES } from "@/lib/financialDna";
import FinoraLogo from "@/components/FinoraLogo";

export default function Login() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [securityImage, setSecurityImage] = useState(null);

  const handleUsernameCheck = async () => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) { setError("Please enter your username"); return; }
    setLoading(true);
    setError("");
    try {
      const profiles = await base44.entities.UserProfile.filter({ username: trimmed });
      if (profiles.length === 0) {
        setError("No account found with this username.");
        return;
      }
      const profile = profiles[0];
      if (!profile.created_by) {
        setError("Signup incomplete. Please create a new account.");
        return;
      }
      setEmail(profile.created_by);
      setSecurityImage(profile.security_image || null);
      setStep(2);
    } catch {
      setError("Unable to verify username. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!password) { setError("Please enter your password"); return; }
    setLoading(true);
    setError("");
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      // Brief pause to ensure token is stored before redirect
      await new Promise(r => setTimeout(r, 150));
      try {
        const me = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ created_by: me.email });
        if (profiles.length === 0 || !profiles[0].survey_completed) {
          window.location.href = "/survey";
          return;
        }
      } catch {}
      window.location.href = "/";
    } catch (err) {
      const msg = (err.message || "").toLowerCase();
      setError(msg.includes("invalid") || msg.includes("credentials") || msg.includes("password")
        ? "Invalid password. Please try again."
        : "Login failed. Please try again.");
      setLoading(false);
    }
  };

  const imgData = SECURITY_IMAGES.find(i => i.id === securityImage);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-80 opacity-15 blur-3xl pointer-events-none gradient-purple-pink" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="w-full max-w-sm">

          <div className="text-center mb-8 flex flex-col items-center">
            <FinoraLogo size="lg" showText={false} className="mb-4" />
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Fin<span className="gradient-text">ora</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1 font-medium">
              {step === 1 ? "Sign in to your account" : step === 2 ? "Verify your identity" : `Welcome back, ${username}`}
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex gap-1.5 mb-6">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${s <= step ? "gradient-purple-pink" : "bg-secondary"}`} />
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-4 flex items-center gap-2">
                <span>⚠️</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Username</Label>
                  <Input placeholder="e.g. ahmadali" value={username}
                    onChange={e => { setUsername(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleUsernameCheck()}
                    className="h-[52px] bg-secondary/50 border-border/60 rounded-xl text-base"
                    autoComplete="username" autoCapitalize="none" />
                </div>
                <Button onClick={handleUsernameCheck} disabled={loading || !username.trim()}
                  className="w-full h-[52px] rounded-xl gradient-purple-pink text-white font-bold border-0 shadow-lg shadow-primary/25 text-base">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue →"}
                </Button>
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/30" /></div>
                  <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or continue with</span></div>
                </div>
                <Button variant="outline" onClick={() => base44.auth.loginWithProvider("google", "/")}
                  className="w-full h-[52px] rounded-xl border-border/50 bg-secondary/20 text-sm font-medium">
                  <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4 mr-2" />
                  Continue with Google
                </Button>
                <p className="text-center text-sm text-muted-foreground pt-1">
                  New to Finora?{" "}
                  <Link to="/register" className="text-primary font-bold hover:underline">Create Account</Link>
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="space-y-5">
                <div className="glass-card rounded-2xl p-6 text-center space-y-4 border border-emerald-500/20">
                  <div className="flex items-center gap-2 justify-center text-xs text-emerald-400 font-semibold">
                    <Shield className="w-3.5 h-3.5" /> Anti-phishing security check
                  </div>
                  {imgData ? (
                    <>
                      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring" }}
                        className="w-28 h-28 mx-auto rounded-2xl border-2 border-primary/40 bg-secondary/50 flex items-center justify-center shadow-lg shadow-primary/10">
                        <span className="text-6xl">{imgData.icon}</span>
                      </motion.div>
                      <div>
                        <p className="text-base font-bold text-foreground">{imgData.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">This is your personal security image. Only proceed if you recognise it.</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">No security image set for this account.</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setStep(1); setError(""); }} className="flex-1 h-[52px] rounded-xl border-border/50">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button onClick={() => { setError(""); setStep(3); }} className="flex-1 h-[52px] rounded-xl gradient-purple-pink text-white font-bold border-0">
                    {imgData ? "Yes, it's mine ✓" : "Continue →"}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="Enter your password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleLogin()}
                      className="h-[52px] bg-secondary/50 border-border/60 rounded-xl pr-12 text-base"
                      autoComplete="current-password" autoFocus />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline font-semibold">Forgot password?</Link>
                </div>
                <Button onClick={handleLogin} disabled={loading || !password}
                  className="w-full h-[52px] rounded-xl gradient-purple-pink text-white font-bold border-0 shadow-lg shadow-primary/25 text-base">
                  {loading
                    ? <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</span>
                    : "Sign In Securely 🔒"}
                </Button>
                <button onClick={() => { setStep(1); setPassword(""); setError(""); }}
                  className="w-full text-xs text-muted-foreground hover:text-primary text-center py-1 transition-colors">
                  ← Use a different username
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-center gap-2 mt-8 text-muted-foreground/40 text-[11px]">
            <Shield className="w-3 h-3" />
            <span>256-bit encrypted · Finora Security</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}