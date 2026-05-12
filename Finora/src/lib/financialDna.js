export const DNA_TYPES = {
  spender: {
    label: "Spender",
    emoji: "💸",
    color: "from-pink-500 to-red-500",
    borderColor: "border-pink-500/30",
    bgColor: "bg-pink-500/10",
    textColor: "text-pink-400",
    description: "You tend to prioritize short-term enjoyment over long-term savings. Your spending often exceeds your planned budget.",
    strengths: ["Enjoys life fully", "Generous with others", "Quick decision maker"],
    weaknesses: ["Impulse purchases", "Low emergency fund", "Difficulty saving consistently"],
    defaultSavingPercent: 15,
    nudges: [
      "You're overspending on food delivery this week — try meal prepping!",
      "Your Grab spending is 40% above average — consider public transport",
      "Set a daily spending limit of RM30 for non-essentials"
    ]
  },
  hoarder: {
    label: "Hoarder",
    emoji: "🏦",
    color: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-400",
    description: "You save aggressively but may miss opportunities for growth. Consider diversifying into investments.",
    strengths: ["Excellent saver", "Financially disciplined", "Strong emergency fund"],
    weaknesses: ["Over-saving may reduce quality of life", "Missed investment opportunities", "Fear of spending"],
    defaultSavingPercent: 30,
    nudges: [
      "Consider investing instead of holding too much cash",
      "Your savings rate is great — try Finora FD for better returns",
      "It's okay to treat yourself occasionally!"
    ]
  },
  avoider: {
    label: "Avoider",
    emoji: "🙈",
    color: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-400",
    description: "You tend to avoid thinking about finances. Building awareness is your first step to financial wellness.",
    strengths: ["Open to learning", "Potential for rapid improvement", "Less financial stress"],
    weaknesses: ["Low financial awareness", "No budget tracking", "Missed savings opportunities"],
    defaultSavingPercent: 10,
    nudges: [
      "You haven't tracked spending this week — let's start!",
      "Set up auto-save of RM50/month to build the habit",
      "Check your spending summary — small steps count!"
    ]
  },
  planner: {
    label: "Planner",
    emoji: "📊",
    color: "from-emerald-500 to-green-500",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-400",
    description: "You have a balanced approach to money. You plan ahead and make informed financial decisions.",
    strengths: ["Well-organized finances", "Balanced spending", "Goal-oriented"],
    weaknesses: ["May over-plan", "Could be more flexible", "Analysis paralysis on big purchases"],
    defaultSavingPercent: 20,
    nudges: [
      "You're on track — keep it up!",
      "Consider increasing your FD contribution by 5%",
      "Your budget allocation is healthy this month"
    ]
  }
};

export function classifyDna(profile) {
  const { spending_habits, savings_goal, monthly_income, risk_level, financial_confidence } = profile;

  const spendingScore = { very_high: 5, high: 4, moderate: 3, low: 2, very_low: 1 }[spending_habits] || 3;
  const savingsRatio = monthly_income > 0 ? (savings_goal || 0) / monthly_income : 0;
  const riskScore = { high: 3, medium: 2, low: 1 }[risk_level] || 2;
  const confidenceScore = { advanced: 3, intermediate: 2, beginner: 1 }[financial_confidence] || 1;

  if (spendingScore >= 4 && savingsRatio < 0.15) return "spender";
  if (savingsRatio >= 0.25 && riskScore <= 1) return "hoarder";
  if (confidenceScore <= 1 && spendingScore <= 2) return "avoider";
  if (savingsRatio >= 0.15 && confidenceScore >= 2) return "planner";

  // Fallback logic
  if (spendingScore >= 4) return "spender";
  if (savingsRatio >= 0.25) return "hoarder";
  if (confidenceScore <= 1) return "avoider";
  return "planner";
}

export const SECURITY_IMAGES = [
  { id: "tiger", label: "Tiger", icon: "🐯" },
  { id: "moon", label: "Moon", icon: "🌙" },
  { id: "hibiscus", label: "Hibiscus", icon: "🌺" },
  { id: "rocket", label: "Rocket", icon: "🚀" },
  { id: "star", label: "Star", icon: "⭐" },
  { id: "mountain", label: "Mountain", icon: "🏔️" },
  { id: "coffee", label: "Coffee", icon: "☕" },
  { id: "shield", label: "Shield", icon: "🛡️" },
  { id: "diamond", label: "Diamond", icon: "💎" },
  { id: "lotus", label: "Lotus", icon: "🪷" },
  { id: "wave", label: "Wave", icon: "🌊" },
  { id: "flame", label: "Flame", icon: "🔥" }
];

export const DEFAULT_TRANSACTIONS = [
  { merchant: "GrabFood", category: "food_delivery", amount: 18.90, date: "2026-05-08", description: "Nasi Lemak delivery" },
  { merchant: "GrabFood", category: "food_delivery", amount: 25.50, date: "2026-05-07", description: "Bubble tea + chicken rice" },
  { merchant: "Touch 'n Go", category: "transport", amount: 50.00, date: "2026-05-06", description: "LRT top-up" },
  { merchant: "Tealive", category: "food_beverages", amount: 12.90, date: "2026-05-05", description: "Brown Sugar Boba" },
  { merchant: "Shopee", category: "shopping", amount: 89.90, date: "2026-05-04", description: "Phone case + earbuds" },
  { merchant: "Netflix", category: "subscriptions", amount: 54.90, date: "2026-05-03", description: "Monthly subscription" },
  { merchant: "Petronas", category: "petrol", amount: 80.00, date: "2026-05-02", description: "RON95 full tank" },
  { merchant: "PTPTN", category: "education", amount: 200.00, date: "2026-05-01", description: "Monthly loan repayment" },
  { merchant: "GrabFood", category: "food_delivery", amount: 32.00, date: "2026-04-30", description: "Pizza delivery" },
  { merchant: "Spotify", category: "subscriptions", amount: 15.90, date: "2026-04-29", description: "Premium subscription" },
  { merchant: "Mamak Corner", category: "food_beverages", amount: 8.50, date: "2026-04-28", description: "Roti canai + teh tarik" },
  { merchant: "Grab", category: "transport", amount: 15.00, date: "2026-04-27", description: "Ride to campus" },
  { merchant: "Uniqlo", category: "shopping", amount: 119.90, date: "2026-04-26", description: "T-shirts" },
  { merchant: "TNB", category: "utilities", amount: 45.00, date: "2026-04-25", description: "Electricity bill" }
];

export const DEFAULT_PROFILE = {
  monthly_income: 3000,
  fixed_expenses: 1200,
  spending_habits: "moderate",
  savings_goal: 500,
  risk_level: "medium",
  financial_confidence: "beginner",
  financial_dna: "planner",
  saving_baseline_percent: 20,
  survey_completed: true
};

export const DEFAULT_PLAN = {
  needs_percent: 50,
  wants_percent: 30,
  savings_percent: 20,
  monthly_saving_target: 600,
  fd_recommendation: "Finora FD: 3.65% p.a. — Deposit RM300/month. In 12 months, earn ~RM66 in interest. Auto-renew for compounding growth.",
  financial_advice: [
    "Start with the 50/30/20 rule for your income",
    "Set up auto-debit for savings on payday",
    "Review subscriptions monthly — cancel unused ones",
    "Build an emergency fund of 3 months' expenses"
  ],
  nudges: [
    "Your food delivery spending is 15% above last month",
    "Great job saving RM200 this week!",
    "Consider switching to meal prep 2x a week"
  ],
  health_score: 68,
  risk_alerts: [
    "Subscription costs increasing — review Netflix + Spotify",
    "Grab spending trending upward this month"
  ]
};