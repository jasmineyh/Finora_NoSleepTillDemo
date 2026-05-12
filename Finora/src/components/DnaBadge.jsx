import { DNA_TYPES } from "@/lib/financialDna";
import { cn } from "@/lib/utils";

export default function DnaBadge({ dnaType, size = "md" }) {
  const dna = DNA_TYPES[dnaType] || DNA_TYPES.planner;

  const sizes = {
    sm: "text-xs px-2.5 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2"
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-semibold bg-gradient-to-r",
      dna.color,
      "text-white",
      sizes[size]
    )}>
      <span>{dna.emoji}</span>
      <span>{dna.label}</span>
    </span>
  );
}