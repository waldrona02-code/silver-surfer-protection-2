import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Cell as PieCell, Legend
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const TYPE_COLORS = [
  "hsl(189 94% 43%)", // Cyan
  "hsl(262 83% 65%)", // Purple
  "hsl(350 89% 60%)", // Red
  "hsl(24 95% 53%)",  // Orange
  "hsl(142 71% 45%)", // Green
  "hsl(45 93% 47%)"   // Yellow
];

const SEVERITY_COLORS = {
  critical: "hsl(var(--severity-critical))",
  high: "hsl(var(--severity-high))",
  medium: "hsl(var(--severity-medium))",
  low: "hsl(var(--severity-low))"
};

export function ThreatTypeChart({ data, isLoading }: { data?: Record<string, number>, isLoading: boolean }) {
  if (isLoading) return <Skeleton className="h-[350px] w-full" />;
  
  const chartData = data 
    ? Object.entries(data).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)
    : [];

  if (chartData.length === 0) {
    return (
      <div className="h-[350px] flex items-center justify-center text-muted-foreground font-display tracking-widest border-2 border-dashed border-border/50 rounded-xl">
        NO THREAT DATA
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 20, bottom: 20 }}>
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            width={140}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }} 
          />
          <Tooltip 
            cursor={{ fill: 'hsl(var(--muted)/0.2)' }} 
            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} 
            itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SeverityChart({ data, isLoading }: { data?: Record<string, number>, isLoading: boolean }) {
  if (isLoading) return <Skeleton className="h-[350px] w-full" />;
  
  const chartData = data 
    ? Object.entries(data).map(([name, value]) => ({ name, value }))
    : [];

  if (chartData.length === 0) {
    return (
      <div className="h-[350px] flex items-center justify-center text-muted-foreground font-display tracking-widest border-2 border-dashed border-border/50 rounded-xl">
        NO THREAT DATA
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <PieCell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS] || TYPE_COLORS[0]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} 
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            formatter={(value) => <span className="text-muted-foreground font-display uppercase tracking-wider text-xs ml-1">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
