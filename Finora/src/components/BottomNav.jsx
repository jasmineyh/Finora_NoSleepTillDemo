import { Link, useLocation } from "react-router-dom";
import { Home, BarChart3, Bot, Settings, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/translations";

export default function BottomNav({ lang = "en" }) {
  const location = useLocation();

  const tabs = [
    { path: "/", icon: Home, label: t("dashboard", lang) },
    { path: "/accounts", icon: Wallet, label: t("accounts", lang) || "Accounts" },
    { path: "/insights", icon: BarChart3, label: t("insights", lang) },
    { path: "/ai-coach", icon: Bot, label: t("aiCoach", lang) },
    { path: "/settings", icon: Settings, label: t("settings", lang) },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/40">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all duration-200 min-w-[52px]",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-all", isActive && "gradient-purple-pink shadow-sm shadow-primary/30")}>
                <tab.icon className={cn("w-4 h-4", isActive ? "text-white" : "")} />
              </div>
              <span className="text-[9px] font-medium leading-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}