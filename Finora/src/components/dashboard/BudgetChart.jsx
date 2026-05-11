import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import GlassCard from "@/components/ui/GlassCard";

const COLORS = ["hsl(263, 70%, 55%)", "hsl(330, 80%, 60%)", "hsl(150, 60%, 45%)"];

export default function BudgetChart({ needs, wants, savings }) {
  const data = [
    { name: "Needs", value: needs },
    { name: "Wants", value: wants },
    { name: "Savings", value: savings },
  ];

  return (
    <GlassCard>
      <h3 className="text-sm font-semibold text-foreground mb-3">Budget Allocation</h3>
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2.5 flex-1">
          {data.map((item, i) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}