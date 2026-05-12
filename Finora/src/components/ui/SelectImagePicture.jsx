import { SECURITY_IMAGES } from "@/lib/financialDna";
import { cn } from "@/lib/utils";

export default function SecurityImagePicker({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {SECURITY_IMAGES.map((img) => (
        <button
          key={img.id}
          type="button"
          onClick={() => onSelect(img.id)}
          className={cn(
            "flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200",
            "border-2",
            selected === img.id
              ? "border-primary bg-primary/10 scale-105"
              : "border-border/50 bg-secondary/30 hover:border-primary/40"
          )}
        >
          <span className="text-2xl">{img.icon}</span>
          <span className="text-[10px] text-muted-foreground font-medium">{img.label}</span>
        </button>
      ))}
    </div>
  );
}