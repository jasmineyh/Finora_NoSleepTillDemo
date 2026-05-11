import { cn } from "@/lib/utils";

export default function FinoraLogo({ size = "md", showText = true, className }) {
  const sizes = {
    sm: { icon: "w-9 h-9", text: "text-lg", radius: "rounded-xl" },
    md: { icon: "w-[56px] h-[56px]", text: "text-xl", radius: "rounded-2xl" },
    lg: { icon: "w-[72px] h-[72px]", text: "text-2xl", radius: "rounded-2xl" },
    xl: { icon: "w-24 h-24", text: "text-3xl", radius: "rounded-3xl" },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(s.icon, s.radius, "gradient-purple-pink flex items-center justify-center shadow-xl shadow-primary/30 flex-shrink-0 relative overflow-hidden")}>
        {/* Stylized F with wave/growth symbolism */}
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[60%] h-[60%]">
          {/* Upward growth line */}
          <path d="M8 32 Q14 20 20 24 Q26 28 32 12" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" fill="none"/>
          {/* Stylized F */}
          <path d="M12 8 L12 32" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
          <path d="M12 8 L26 8" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
          <path d="M12 19 L22 19" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
          {/* Accent dot */}
          <circle cx="29" cy="28" r="3" fill="rgba(255,255,255,0.8)"/>
        </svg>
        {/* Shimmer overlay */}
        <div className="absolute inset-0 opacity-20" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%)" }} />
      </div>
      {showText && (
        <div>
          <span className={cn("font-black tracking-tight text-foreground", s.text)}>
            Fin<span className="gradient-text">ora</span>
          </span>
          <p className="text-[10px] text-muted-foreground leading-none mt-0.5 font-medium tracking-wide">AI Financial Platform</p>
        </div>
      )}
    </div>
  );
}