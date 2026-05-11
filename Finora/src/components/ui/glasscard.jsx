import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function GlassCard({ children, className, animate = true, ...props }) {
  const Wrapper = animate ? motion.div : 'div';
  const animateProps = animate ? {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  } : {};

  return (
    <Wrapper
      className={cn(
        "glass-card rounded-2xl p-5",
        className
      )}
      {...animateProps}
      {...props}
    >
      {children}
    </Wrapper>
  );
}
