import GlassCard from "@/components/ui/GlassCard";
import { motion } from "framer-motion";

export default function SavingsProgress({ current, target }) {
  const percent = Math.min(Math.round((current / target) * 100), 100);

  return (
    <GlassCard>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-foreground">Savings Progress</h3>
        <span className="text-xs text-primary font-medium">{percent}%</span>
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full gradient-purple-pink rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-muted-foreground">RM {current.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground">RM {target.toLocaleString()} target</span>
      </div>
    </GlassCard>
  );
}