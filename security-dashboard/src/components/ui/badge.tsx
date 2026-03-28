import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "critical" | "high" | "medium" | "low" | "success";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-[0_0_10px_rgba(var(--color-primary),0.3)]",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-[0_0_10px_rgba(var(--color-destructive),0.3)]",
    outline: "text-foreground border-border",
    critical: "border-critical/30 bg-critical/15 text-critical animate-pulse shadow-[0_0_15px_rgba(var(--color-critical),0.2)]",
    high: "border-high/30 bg-high/15 text-high",
    medium: "border-medium/30 bg-medium/15 text-medium",
    low: "border-low/30 bg-low/15 text-low",
    success: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
