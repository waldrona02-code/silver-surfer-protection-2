import { Link, useRoute } from "wouter";
import { ShieldAlert, Activity, Radar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck } from "@workspace/api-client-react";

function NavItem({ href, children, icon: Icon }: { href: string; children: React.ReactNode; icon: any }) {
  const [isActive] = useRoute(href);
  return (
    <Link 
      href={href} 
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium tracking-wide font-display",
        isActive 
          ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_15px_rgba(var(--color-primary),0.2)]" 
          : "hover:bg-card-foreground/5 text-muted-foreground hover:text-foreground border border-transparent"
      )}
    >
      <Icon className="w-5 h-5" />
      {children}
    </Link>
  )
}

function SystemStatus() {
  const { data, isError } = useHealthCheck({ query: { refetchInterval: 10000 } });
  const isOk = data?.status === "ok";
  
  return (
    <div className="flex items-center gap-4 bg-card/80 p-4 rounded-xl border border-border/50 shadow-inner">
      <div className="relative flex h-4 w-4">
        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isOk ? "bg-emerald-400" : "bg-destructive")}></span>
        <span className={cn("relative inline-flex rounded-full h-4 w-4", isOk ? "bg-emerald-500" : "bg-destructive")}></span>
      </div>
      <div>
        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest font-display">System Core</div>
        <div className={cn("text-sm font-bold tracking-wider", isOk ? "text-emerald-500" : "text-destructive")}>
          {isError ? "OFFLINE" : isOk ? "ACTIVE & SCANNING" : "DEGRADED"}
        </div>
      </div>
    </div>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border/50 bg-card/40 backdrop-blur-2xl flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
         <div className="p-6 flex items-center gap-4 border-b border-border/50 bg-card/60">
            <div className="relative">
              <ShieldAlert className="w-10 h-10 text-primary" />
              <div className="absolute inset-0 bg-primary blur-xl opacity-40 animate-pulse rounded-full" />
            </div>
            <span className="font-display font-bold text-2xl tracking-[0.2em]">AURA<span className="text-primary">SEC</span></span>
         </div>
         <nav className="flex-1 p-6 space-y-3">
           <NavItem href="/" icon={Activity}>Live Feed</NavItem>
           <NavItem href="/scanner" icon={Radar}>Payload Scanner</NavItem>
         </nav>
         
         <div className="p-6 border-t border-border/50 bg-card/30">
           <SystemStatus />
         </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
         {/* Cyber Grid Background */}
         <div 
           className="absolute inset-0 pointer-events-none opacity-[0.07] bg-cover bg-center mix-blend-screen" 
           style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/cyber-grid.png)` }}
         />
         
         <div className="flex-1 overflow-y-auto p-8 relative z-10">
           {children}
         </div>
      </main>
    </div>
  )
}
