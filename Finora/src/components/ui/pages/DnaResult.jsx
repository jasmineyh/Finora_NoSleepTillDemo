import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { DNA_TYPES } from "@/lib/financialDna";
import GlassCard from "@/components/ui/GlassCard";
import DnaBadge from "@/components/DnaBadge";
import { ArrowRight, Check, AlertTriangle } from "lucide-react";

export default function DnaResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const dnaType = location.state?.dnaType || "planner";
  const dna = DNA_TYPES[dnaType];

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="max-w-sm mx-auto space-y-5">
        {/* Animated reveal */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "backOut" }}
          className="text-center space-y-4 pt-4"
        >
          <div
            className="w-28 h-28 rounded-full mx-auto flex items-center justify-center text-6xl"
            style={{ boxShadow: "0 0 60px rgba(124, 58, 237, 0.4)", background: "rgba(124,58,237,0.1)" }}
          >
            {dna.emoji}
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Your Finora Financial DNA</p>
            <DnaBadge dnaType={dnaType} size="lg" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <GlassCard>
            <p className="text-sm text-foreground/80 leading-relaxed">{dna.description}</p>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <GlassCard>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" /> Your Strengths
            </h3>
            <div className="space-y-1.5">
              {dna.strengths.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-emerald-400/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <GlassCard>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Areas to Improve
            </h3>
            <div className="space-y-1.5">
              {dna.weaknesses.map((w, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-amber-400/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  {w}
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <GlassCard className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Recommended Saving Baseline</p>
            <p className="text-4xl font-bold gradient-text">{dna.defaultSavingPercent}%</p>
            <p className="text-xs text-muted-foreground mt-1">of your monthly income</p>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <div className="glass-card rounded-xl p-4 text-center bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm text-emerald-400 font-medium">✨ Your AI-powered financial plan is ready!</p>
          </div>

          <Button
            onClick={() => navigate("/", { replace: true })}
            className="w-full h-14 rounded-xl gradient-purple-pink text-white font-semibold text-base border-0 shadow-xl shadow-primary/30 mt-3"
          >
            Continue to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}