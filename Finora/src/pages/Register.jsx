import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ArrowLeft, Shield, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PasswordValidator, { validatePassword } from "@/components/PasswordValidator";
import SecurityImagePicker from "@/components/SecurityImagePicker";
import FinoraLogo from "@/components/FinoraLogo";

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "", confirmPassword: "" });
  const [securityImage, setSecurityImage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const update = (field, val) => { setForm(p => ({ ...p, [field]: val })); setError(""); };

  const handleStep1 = async () => {
    setError("");
    if (!form.fullName.trim()) { setError("Please enter your full name"); return; }
    if (!form.username.trim() || form.username.length < 3) { setError("Username must be at least 3 characters"); return; }
    if (!/^[a-z0-9_]+$/i.test(form.username)) { setError("Username can only contain letters, numbers, and underscores"); return; }
    if (!form.email || !form.email.includes("@")) { setError("Please enter a valid email"); return; }
    if (!validatePassword(form.password)) { setError("Password does not meet all requirements"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      // Check username uniqueness — only block if username has a valid linked account
      const existing = await base44.entities.UserProfile.filter({ username: form.username.trim().toLowerCase() });
      if (existing.length > 0 && existing[0].created_by) {
        setError("This username is already registered. Please log in.");
        setLoading(false);
        return;
      }
    } catch { /* allow proceed */ }
    setLoading(false);
    setStep(2);
  };

  const handleStep2 = async () => {
    if (!securityImage) { setError("Please select a security image"); return; }
    setLoading(true);
    setError("");
    try {
      await base44.auth.register({ email: form.email, password: form.password });
      setRegisteredEmail(form.email);
      setStep(3);
    } catch (err) {
      setError(err.message || "Registration failed. This email may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 4) { setError("Please enter the verification code"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await base44.auth.verifyOtp({ email: registeredEmail, otpCode });
      if (res?.access_token) base44.auth.setToken(res.access_token);
      // Create UserProfile only after successful auth
      await base44.entities.UserProfile.create({
        username: form.username.trim().toLowerCase(),
        full_name: form.fullName.trim(),
        security_image: securityImage,
        survey_completed: false,
        language: "en",
        dark_mode: false,
        notifications_enabled: true,
      });
      window.location.href = "/survey";
    } catch (err) {
      setError(err.message || "Verification failed. Please check your code.");
      setLoading(false);
    }
  };

  const STEP_LABELS = ["Your Details", "Security Image", "Verify Email"];

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-72 gradient-purple-pink opacity-10 blur-3xl pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-start px-6 py-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">

          <div className="text-center mb-6 flex flex-col items-center">
            <FinoraLogo size="lg" showText={false} className="mb-4" />
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Fin<span className="gradient-text">ora</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1 font-medium">{STEP_LABELS[step - 1]}</p>
          </div>

          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex-1 flex flex-col gap-1">
                <div className={`h-1 rounded-full transition-all duration-300 ${s <= step ? "gradient-purple-pink" : "bg-secondary"}`} />
                <span className={`text-[10px] text-center ${s === step ? "text-primary" : "text-muted-foreground/50"}`}>
                  {s < step ? "✓" : `Step ${s}`}
                </span>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-4 flex gap-2">
                <span>⚠️</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Full Name</Label>
                  <Input value={form.fullName} onChange={e => update("fullName", e.target.value)} placeholder="Ahmad bin Ali"
                    className="h-[52px] bg-secondary/50 border-border/60 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Username</Label>
                  <Input value={form.username} onChange={e => update("username", e.target.value.toLowerCase())} placeholder="ahmadali"
                    className="h-[52px] bg-secondary/50 border-border/60 rounded-xl" autoCapitalize="none" />
                  <p className="text-[11px] text-muted-foreground">You'll use this to log in. Can't be changed later.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Email</Label>
                  <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="ahmad@example.com"
                    className="h-[52px] bg-secondary/50 border-border/60 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Password</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)}
                      placeholder="Create a strong password" className="h-[52px] bg-secondary/50 border-border/60 rounded-xl pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordValidator password={form.password} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Confirm Password</Label>
                  <div className="relative">
                    <Input type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={e => update("confirmPassword", e.target.value)}
                      placeholder="Re-enter password" className="h-[52px] bg-secondary/50 border-border/60 rounded-xl pr-12" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {form.confirmPassword && form.password === form.confirmPassword && (
                      <div className="absolute right-10 top-1/2 -translate-y-1/2"><Check className="w-4 h-4 text-emerald-400" /></div>
                    )}
                  </div>
                </div>
                <Button onClick={handleStep1} disabled={loading} className="w-full h-[52px] rounded-xl gradient-purple-pink text-white font-semibold border-0 mt-2 shadow-lg shadow-primary/20">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Next →"}
                </Button>
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/40" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">or</span></div>
                </div>
                <Button variant="outline" onClick={() => base44.auth.loginWithProvider("google", "/")} className="w-full h-[52px] rounded-xl border-border/50 bg-secondary/30">
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 mr-2" />
                  Continue with Google
                </Button>
                <p className="text-center text-sm text-muted-foreground pt-1">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="glass-card rounded-xl p-4 text-sm text-foreground/70 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p>Choose a security image. Every login will show this image before asking for your password — protecting you from fake login pages.</p>
                  </div>
                </div>
                <SecurityImagePicker selected={securityImage} onSelect={id => { setSecurityImage(id); setError(""); }} />
                <div className="flex gap-3 pt-1">
                  <Button variant="outline" onClick={() => { setStep(1); setError(""); }} className="flex-1 h-[52px] rounded-xl">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button onClick={handleStep2} disabled={loading || !securityImage} className="flex-1 h-[52px] rounded-xl gradient-purple-pink text-white font-semibold border-0">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto">
                  <span className="text-2xl">📧</span>
                </div>
                <div>
                  <p className="text-foreground font-semibold">Check your email</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    We sent a code to <span className="text-foreground font-medium">{registeredEmail}</span>
                  </p>
                </div>
                <Input value={otpCode} onChange={e => { setOtpCode(e.target.value.replace(/\D/g, "")); setError(""); }}
                  placeholder="Enter 6-digit code"
                  className="h-[56px] bg-secondary/50 border-border/60 rounded-xl text-center text-2xl tracking-[0.4em] font-mono"
                  maxLength={6} inputMode="numeric" />
                <Button onClick={handleVerifyOtp} disabled={loading || otpCode.length < 4}
                  className="w-full h-[52px] rounded-xl gradient-purple-pink text-white font-semibold border-0 shadow-lg shadow-primary/20">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Create Account"}
                </Button>
                <button onClick={() => base44.auth.resendOtp(registeredEmail).catch(() => {})} className="text-xs text-primary hover:underline">
                  Didn't receive it? Resend code
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-center gap-2 mt-8 text-muted-foreground/50 text-[11px]">
            <Shield className="w-3 h-3" />
            <span>256-bit encrypted · Bank-grade security</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}