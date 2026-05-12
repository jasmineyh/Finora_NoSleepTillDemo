import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function LogoutConfirmModal({ open, onClose, onConfirm }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-6"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card rounded-2xl p-6 w-full max-w-sm space-y-4"
        >
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <LogOut className="w-7 h-7 text-red-400" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-foreground">Sign Out?</h3>
            <p className="text-sm text-muted-foreground mt-1">You'll need your username and password to sign back in.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl border-border/50">Cancel</Button>
            <Button onClick={onConfirm} className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold border-0">
              Sign Out
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}