import { useGetThreatStats, useGetThreats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreatTypeChart, SeverityChart } from "@/components/charts";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Shield, ShieldOff, AlertOctagon, Activity } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetThreatStats({ query: { refetchInterval: 5000 } });
  const { data: logs, isLoading: logsLoading } = useGetThreats({ query: { refetchInterval: 5000 } });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-display font-bold tracking-widest text-foreground flex items-center gap-4">
          SECURITY <span className="text-primary font-light">OVERVIEW</span>
        </h1>
        <p className="text-muted-foreground mt-2 font-medium tracking-wide">Real-time threat monitoring and mitigation statistics.</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">TOTAL THREATS</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-4xl font-bold font-display text-primary drop-shadow-[0_0_10px_rgba(var(--color-primary),0.8)]">
                {stats?.total.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ATTACKS BLOCKED</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-4xl font-bold font-display text-destructive drop-shadow-[0_0_10px_rgba(var(--color-destructive),0.8)]">
                {stats?.blocked.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-critical">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CRITICAL SEVERITY</CardTitle>
            <AlertOctagon className="h-4 w-4 text-critical" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-4xl font-bold font-display text-critical">
                {stats?.bySeverity.critical || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-high">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">HIGH SEVERITY</CardTitle>
            <ShieldOff className="h-4 w-4 text-high" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-4xl font-bold font-display text-high">
                {stats?.bySeverity.high || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">THREAT DISTRIBUTION</CardTitle>
          </CardHeader>
          <CardContent>
            <ThreatTypeChart data={stats?.byType} isLoading={statsLoading} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SEVERITY ANALYSIS</CardTitle>
          </CardHeader>
          <CardContent>
            <SeverityChart data={stats?.bySeverity} isLoading={statsLoading} />
          </CardContent>
        </Card>
      </div>

      {/* Threat Log Table */}
      <Card className="col-span-full border-border/80">
        <CardHeader>
          <CardTitle className="text-lg">LIVE THREAT LOG</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto rounded-xl border border-border/40 bg-card/30 backdrop-blur-md">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] uppercase text-muted-foreground bg-black/40 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-display tracking-widest whitespace-nowrap">Timestamp</th>
                  <th className="px-6 py-4 font-display tracking-widest">Source IP</th>
                  <th className="px-6 py-4 font-display tracking-widest">Target Path</th>
                  <th className="px-6 py-4 font-display tracking-widest">Severity</th>
                  <th className="px-6 py-4 font-display tracking-widest">Vectors</th>
                  <th className="px-6 py-4 font-display tracking-widest text-right">Status</th>
                </tr>
              </thead>
              {logsLoading ? (
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border/20">
                      <td colSpan={6} className="p-4"><Skeleton className="h-6 w-full" /></td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <motion.tbody 
                  variants={container} 
                  initial="hidden" 
                  animate="show"
                  className="divide-y divide-border/20"
                >
                  {logs?.threats.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-display tracking-widest">
                        NO RECENT THREATS LOGGED
                      </td>
                    </tr>
                  ) : (
                    logs?.threats.map((threat) => (
                      <motion.tr variants={item} key={threat.id} className="hover:bg-primary/5 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground group-hover:text-foreground font-mono text-xs">
                          {format(new Date(threat.timestamp), 'HH:mm:ss.SSS')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-primary/80">
                          {threat.ip}
                        </td>
                        <td className="px-6 py-4 max-w-[200px] truncate" title={`${threat.method} ${threat.path}`}>
                          <span className="font-bold text-muted-foreground mr-2">{threat.method}</span>
                          <span className="font-mono text-xs text-foreground/80">{threat.path}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={threat.severity as any} className="uppercase text-[10px] tracking-widest px-2 py-0.5">
                            {threat.severity}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {threat.threats.map((t, idx) => (
                              <span key={idx} className="text-[10px] bg-secondary border border-border/50 text-secondary-foreground px-2 py-0.5 rounded uppercase tracking-wider font-display">
                                {t.type?.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {threat.blocked ? (
                            <Badge variant="destructive" className="uppercase text-[10px] tracking-widest">Blocked</Badge>
                          ) : (
                            <Badge variant="success" className="uppercase text-[10px] tracking-widest">Sanitized</Badge>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </motion.tbody>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
