import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center">
      <div className="relative">
        <AlertTriangle className="w-24 h-24 text-destructive opacity-80" />
        <div className="absolute inset-0 bg-destructive blur-2xl opacity-20" />
      </div>
      <h1 className="mt-8 text-6xl font-display font-bold tracking-widest text-foreground">404</h1>
      <h2 className="mt-4 text-2xl font-mono text-muted-foreground tracking-widest">ENDPOINT_NOT_FOUND</h2>
      <p className="mt-4 max-w-md text-center text-muted-foreground/80 leading-relaxed">
        The requested resource path does not exist on this server. This event has been logged for security review.
      </p>
      
      <Link href="/" className="mt-10">
        <Button size="lg" className="tracking-widest">
          RETURN TO SAFETY
        </Button>
      </Link>
    </div>
  );
}
