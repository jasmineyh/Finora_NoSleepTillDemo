import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const rules = [
  { label: "8–16 characters", test: (p) => p.length >= 8 && p.length <= 16 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /\d/.test(p) },
  { label: "One symbol", test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

export function validatePassword(password) {
  return rules.every((r) => r.test(password));
}

export default function PasswordValidator({ password }) {
  if (!password) return null;

  return (
    <div className="space-y-1.5 mt-2">
      {rules.map((rule) => {
        const passed = rule.test(password);
        return (
          <div key={rule.label} className="flex items-center gap-2 text-xs">
            {passed ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <X className="w-3.5 h-3.5 text-red-400" />
            )}
            <span className={cn(passed ? "text-emerald-400" : "text-red-400")}>
              {rule.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}