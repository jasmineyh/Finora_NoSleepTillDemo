import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Check, ArrowUpDown, Loader2 } from "lucide-react";

// Reusable 2-step transaction approval modal
// Props: open, onClose, onApprove(amount), title, fromLabel, toLabel, amount, balanceBefore, extraInfo, loading
export default function TransactionApproval({
  open, onClose, onApprove,
  title = "Approve Transaction",
  fromLabel, toLabel,
  amount = 0,
  balanceBefore = 0,
  extraInfo = null,
  loading = false,
  refNumber = null,
  successTitle = "Transaction Successful!",
  successSubtitle = null
}) {
  const [step, setStep] = useState(1); // 1=review, 2=success
  const [localLoading, setLocalLoading] = useState(false);
  const balanceAfter = balanceBefore - amount;
  const ref = refNumber || `GX${Date.now().toString().slice(-8)}`;

  const handleApprove = async () => {
    setLocalLoading(true);
    try {
      await onApprove(amount);
      setStep(2);
    } catch (e) {
      console.error("[TransactionApproval] failed", e);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-end"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 220 }}
          className="w-full max-w-lg mx-auto bg-card rounded-t-3xl p-6"
        >
          {step === 1 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">{title}</h2>
                <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* From / To */}
              {(fromLabel || toLabel) && (
                <div className="glass-card rounded-xl p-4 flex items-center justify-between">
                  {fromLabel && (
                    <div>
                      <p className="text-xs text-muted-foreground">From</p>
                      <p className="text-sm font-semibold text-foreground">{fromLabel}</p>
                    </div>
                  )}
                  {fromLabel && toLabel && <ArrowUpDown className="w-4 h-4 text-muted-foreground" />}
                  {toLabel && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">To</p>
                      <p className="text-sm font-semibold text-foreground">{toLabel}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Amount */}
              <div className="text-center py-2">
                <p className="text-xs text-muted-foreground mb-1">Amount</p>
                <p className="text-4xl font-bold gradient-text">RM {amount.toFixed(2)}</p>
              </div>

              {/* Summary */}
              <div className="glass-card rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance before</span>
                  <span className="text-foreground">RM {balanceBefore.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance after</span>
                  <span className={`font-semibold ${balanceAfter < 0 ? "text-red-400" : "text-foreground"}`}>
                    RM {balanceAfter.toFixed(2)}
                  </span>
                </div>
                {extraInfo && (
                  <div className="border-t border-border/30 pt-2 text-xs text-primary">{extraInfo}</div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1 h-12 rounded-xl border-border/50">
                  Cancel
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={localLoading || loading || balanceAfter < 0}
                  className="flex-1 h-12 rounded-xl gradient-purple-pink text-white font-semibold border-0"
                >
                  {localLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve →"}
                </Button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{successTitle}</h3>
                {successSubtitle && <p className="text-sm text-muted-foreground mt-1">{successSubtitle}</p>}
                <p className="text-xs text-muted-foreground/50 mt-2 font-mono">Ref: {ref}</p>
              </div>
              <Button onClick={handleClose} className="w-full h-12 rounded-xl gradient-purple-pink text-white font-semibold border-0">
                Done
              </Button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}