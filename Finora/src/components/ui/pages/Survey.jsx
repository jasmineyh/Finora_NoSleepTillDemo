import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import { classifyDna, DNA_TYPES, DEFAULT_TRANSACTIONS } from "@/lib/financialDna";

const STEPS = [
  { title: "Monthly Income", subtitle: "How much do you earn per month?", field: "monthly_income" },
  { title: "Fixed Expenses", subtitle: "Rent, bills, loan repayments, etc.", field: "fixed_expenses" },
  { title: "Spending Habits", subtitle: "How would you describe your spending?", field: "spending_habits" },
  { title: "Savings Goal", subtitle: "How much do you want to save monthly?", field: "savings_goal" },
  { title: "Risk Level", subtitle: "How comfortable are you with financial risk?", field: "risk_level" },
  { title: "Financial Confidence", subtitle: "How confident are you managing money?", field: "financial_confidence" },
];

export default function Survey() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    monthly_income: 3000,
    fixed_expenses: 1200,
    spending_habits: "moderate",
    savings_goal: 500,
    risk_level: "medium",
    financial_confidence: "beginner",
  });

  const update = (field, val) => setForm(p => ({ ...p, [field]: val }));
  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const dnaType = classifyDna(form);
      const dnaInfo = DNA_TYPES[dnaType];
      const me = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ created_by: me.email });

      const profileData = {
        ...form,
        financial_dna: dnaType,
        saving_baseline_percent: dnaInfo.defaultSavingPercent,
        survey_completed: true,
      };

      if (profiles.length > 0) {
        await base44.entities.UserProfile.update(profiles[0].id, profileData);
      } else {
        await base44.entities.UserProfile.create({ ...profileData, username: me.email.split("@")[0], full_name: me.full_name || "" });
      }

      let plan;
      try {
        const prompt = `You are a financial advisor for Malaysian students. Based on this profile:
- Monthly Income: RM${form.monthly_income}
- Fixed Expenses: RM${form.fixed_expenses}
- Spending Habits: ${form.spending_habits}
- Savings Goal: RM${form.savings_goal}
- Risk Level: ${form.risk_level}
- Financial DNA Type: ${dnaType}

Generate a JSON financial plan with:
- needs_percent (number)
- wants_percent (number)
- savings_percent (number)
- monthly_saving_target (number in RM)
- fd_recommendation (string about GXBank FD with rate and projected earnings)
- financial_advice (array of 4 practical tips)
- nudges (array of 3 smart spending nudges)
- health_score (number 0-100)
- risk_alerts (array of 2 risk warnings)`;

        plan = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              needs_percent: { type: "number" },
              wants_percent: { type: "number" },
              savings_percent: { type: "number" },
              monthly_saving_target: { type: "number" },
              fd_recommendation: { type: "string" },
              financial_advice: { type: "array", items: { type: "string" } },
              nudges: { type: "array", items: { type: "string" } },
              health_score: { type: "number" },
              risk_alerts: { type: "array", items: { type: "string" } },
            },
          },
        });
      } catch {
        plan = {
          needs_percent: 50, wants_percent: 30, savings_percent: 20,
          monthly_saving_target: form.savings_goal,
          fd_recommendation: `GXBank FD: 3.65% p.a. — Deposit RM${Math.round(form.savings_goal * 0.6)}/month for steady growth.`,
          financial_advice: ["Follow 50/30/20 rule", "Auto-save on payday", "Review subscriptions monthly", "Build 3-month emergency fund"],
          nudges: dnaInfo.nudges,
          health_score: 65,
          risk_alerts: ["Monitor food delivery spending", "Set spending limits for wants"],
        };
      }

      await base44.entities.FinancialPlan.create(plan);

      const existingTx = await base44.entities.Transaction.filter({ created_by: me.email });
      if (existingTx.length === 0) {
        await base44.entities.Transaction.bulkCreate(DEFAULT_TRANSACTIONS);
      }

      navigate("/dna-result", { state: { dnaType } });
    } catch (err) {
      console.error("[Survey] submit failed", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full gradient-purple-pink flex items-center justify-center mx-auto animate-pulse">
            <span className="text-3xl">🧬</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Analyzing your Financial DNA...</h2>
            <p className="text-muted-foreground text-sm mt-2">Creating your personalized plan</p>
          </div>
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-sm mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
            <span className="text-xs text-primary font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div className="h-full gradient-purple-pink rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
            <h2 className="text-xl font-bold text-foreground mb-1">{current.title}</h2>
            <p className="text-sm text-muted-foreground mb-6">{current.subtitle}</p>

            <GlassCard animate={false} className="space-y-4">
              {current.field === "monthly_income" && (
                <div className="space-y-4">
                  <div className="text-center"><span className="text-3xl font-bold gradient-text">RM {form.monthly_income.toLocaleString()}</span></div>
                  <Slider value={[form.monthly_income]} onValueChange={([v]) => update("monthly_income", v)} min={500} max={10000} step={100} />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>RM 500</span><span>RM 10,000</span></div>
                </div>
              )}
              {current.field === "fixed_expenses" && (
                <div className="space-y-4">
                  <div className="text-center"><span className="text-3xl font-bold gradient-text">RM {form.fixed_expenses.toLocaleString()}</span></div>
                  <Slider value={[form.fixed_expenses]} onValueChange={([v]) => update("fixed_expenses", v)} min={0} max={form.monthly_income} step={50} />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>RM 0</span><span>RM {form.monthly_income.toLocaleString()}</span></div>
                </div>
              )}
              {current.field === "spending_habits" && (
                <div className="space-y-3">
                  {[
                    { value: "very_low", label: "Very Low", desc: "I rarely spend on non-essentials" },
                    { value: "low", label: "Low", desc: "I'm careful with my money" },
                    { value: "moderate", label: "Moderate", desc: "I balance spending and saving" },
                    { value: "high", label: "High", desc: "I enjoy treating myself often" },
                    { value: "very_high", label: "Very High", desc: "I spend freely without tracking" },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => update("spending_habits", opt.value)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${form.spending_habits === opt.value ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-primary/40"}`}>
                      <p className="text-sm font-medium text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              )}
              {current.field === "savings_goal" && (
                <div className="space-y-4">
                  <div className="text-center"><span className="text-3xl font-bold gradient-text">RM {form.savings_goal.toLocaleString()}</span></div>
                  <Slider value={[form.savings_goal]} onValueChange={([v]) => update("savings_goal", v)} min={50} max={form.monthly_income} step={50} />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>RM 50</span><span>RM {form.monthly_income.toLocaleString()}</span></div>
                </div>
              )}
              {current.field === "risk_level" && (
                <div className="space-y-3">
                  {[
                    { value: "low", label: "Low Risk", desc: "I prefer safe, guaranteed returns", icon: "🛡️" },
                    { value: "medium", label: "Medium Risk", desc: "I'm okay with some uncertainty", icon: "⚖️" },
                    { value: "high", label: "High Risk", desc: "I'm willing to take chances for higher returns", icon: "🚀" },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => update("risk_level", opt.value)}
                      className={`w-full text-left p-4 rounded-xl border flex items-center gap-3 transition-all ${form.risk_level === opt.value ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-primary/40"}`}>
                      <span className="text-2xl">{opt.icon}</span>
                      <div><p className="text-sm font-medium text-foreground">{opt.label}</p><p className="text-xs text-muted-foreground">{opt.desc}</p></div>
                    </button>
                  ))}
                </div>
              )}
              {current.field === "financial_confidence" && (
                <div className="space-y-3">
                  {[
                    { value: "beginner", label: "Beginner", desc: "I'm just starting to learn about finance", icon: "🌱" },
                    { value: "intermediate", label: "Intermediate", desc: "I know the basics and budget sometimes", icon: "📈" },
                    { value: "advanced", label: "Advanced", desc: "I actively manage investments and budget", icon: "🏆" },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => update("financial_confidence", opt.value)}
                      className={`w-full text-left p-4 rounded-xl border flex items-center gap-3 transition-all ${form.financial_confidence === opt.value ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-primary/40"}`}>
                      <span className="text-2xl">{opt.icon}</span>
                      <div><p className="text-sm font-medium text-foreground">{opt.label}</p><p className="text-xs text-muted-foreground">{opt.desc}</p></div>
                    </button>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 h-12 rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} className="flex-1 h-12 rounded-xl gradient-purple-pink text-white font-semibold border-0">
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="flex-1 h-12 rounded-xl gradient-purple-pink text-white font-semibold border-0">
              Generate My Plan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}