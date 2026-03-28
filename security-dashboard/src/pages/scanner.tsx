import { useState } from "react";
import { useScanPayload } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radar, ShieldCheck, ShieldAlert, AlertTriangle, TerminalSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Scanner() {
  const [payload, setPayload] = useState("");
  const scanMutation = useScanPayload();

  const handleScan = () => {
    if (!payload.trim()) return;
    scanMutation.mutate({ data: { payload } });
  };

  const isPending = scanMutation.isPending;
  const result = scanMutation.data;

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-display font-bold tracking-widest text-foreground flex items-center gap-4">
          PAYLOAD <span className="text-primary font-light">SCANNER</span>
        </h1>
        <p className="text-muted-foreground mt-2 font-medium tracking-wide">
          Test any input string against the live OWASP pattern matching engine.
        </p>
      </div>

      <Card className="border-primary/20 shadow-[0_0_30px_rgba(var(--color-primary),0.1)] relative">
        {isPending && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-2xl z-20">
            <div className="relative w-32 h-32 rounded-full border-2 border-primary/20 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(var(--color-primary),0.3)]">
              <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-radar" />
              <Radar className="w-12 h-12 text-primary animate-pulse" />
            </div>
            <div className="absolute mt-40 font-display text-primary tracking-[0.3em] font-bold animate-pulse">
              ANALYZING PAYLOAD...
            </div>
          </div>
        )}

        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <TerminalSquare className="w-6 h-6 text-primary" />
            INPUT CONSOLE
          </CardTitle>
          <CardDescription>Enter malicious patterns (SQLi, XSS, Cmd Injection) to see detection in action.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-accent/30 rounded-xl blur opacity-20 group-focus-within:opacity-60 transition duration-500"></div>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="relative w-full h-64 bg-black/60 border-2 border-border/80 rounded-xl p-6 font-mono text-sm text-primary/90 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none placeholder:text-muted-foreground/50 leading-relaxed shadow-inner"
              placeholder="> SELECT * FROM users WHERE username = 'admin' OR 1=1 --&#10;> <script>alert(document.cookie)</script>&#10;> ping 8.8.8.8; cat /etc/passwd"
              spellCheck={false}
            />
          </div>

          <div className="flex justify-end">
            <Button 
              size="lg" 
              onClick={handleScan} 
              disabled={!payload.trim() || isPending}
              className="px-12 text-lg tracking-[0.2em]"
            >
              INITIATE SCAN
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            {result.safe ? (
              <Card className="border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/50">
                    <ShieldCheck className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-emerald-400 tracking-widest">PAYLOAD SECURE</h3>
                  <p className="text-muted-foreground max-w-md">No malicious patterns or recognized threat vectors were detected in the provided input.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-destructive/50 bg-destructive/5 shadow-[0_0_30px_rgba(225,29,72,0.1)]">
                <CardHeader className="border-b border-destructive/20 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center border-2 border-destructive/50 animate-pulse">
                      <ShieldAlert className="w-8 h-8 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-destructive tracking-widest font-bold">THREAT DETECTED</CardTitle>
                      <CardDescription className="text-destructive/70 mt-1">
                        Input blocked by security policies. Multiple threat vectors identified.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {result.threats.map((threat, i) => (
                    <div key={i} className="bg-black/40 border border-destructive/30 rounded-xl p-5 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive" />
                      <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-5 h-5 text-high" />
                        <h4 className="font-display text-lg font-bold tracking-wider text-foreground uppercase">{threat.category}</h4>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Matched Signatures:</div>
                        <div className="flex flex-wrap gap-2">
                          {threat.matches.map((match, j) => (
                            <code key={j} className="bg-destructive/10 text-destructive border border-destructive/20 px-3 py-1.5 rounded-md text-xs">
                              {match}
                            </code>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
