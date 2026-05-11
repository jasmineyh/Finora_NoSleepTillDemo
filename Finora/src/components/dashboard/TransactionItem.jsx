import { format } from "date-fns";

const CATEGORY_ICONS = {
  food_delivery: "🛵",
  transport: "🚇",
  food_beverages: "☕",
  subscriptions: "📺",
  shopping: "🛍️",
  education: "📚",
  utilities: "💡",
  petrol: "⛽",
  savings: "💰"
};

export default function TransactionItem({ transaction }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-lg">
          {CATEGORY_ICONS[transaction.category] || "💳"}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{transaction.merchant}</p>
          <p className="text-xs text-muted-foreground">
            {transaction.date ? format(new Date(transaction.date), "MMM d") : ""} · {transaction.description}
          </p>
        </div>
      </div>
      <span className="text-sm font-semibold text-foreground">-RM {transaction.amount.toFixed(2)}</span>
    </div>
  );
}