"use client"

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CartIcon({ onOpen }: { onOpen?: () => void }) {
  const { totalItems } = useCart();
  const [isAnimate, setIsAnimate] = useState(false);

  useEffect(() => {
    if (totalItems === 0) return;
    setIsAnimate(true);
    const timer = setTimeout(() => setIsAnimate(false), 300);
    return () => clearTimeout(timer);
  }, [totalItems]);

  return (
    <button 
      onClick={onOpen}
      aria-label="Open cart"
      className={cn(
        "fixed right-0 top-[60%] -translate-y-1/2 z-[70]",
        "flex flex-col items-center gap-3",
        "bg-card text-card-foreground", // Use card background
        "py-6 px-3",
        "rounded-l-[1.5rem]", 
        "border-2 border-accent/40 border-r-0", // Accent Border
        "shadow-[-10px_0_40px_hsla(var(--accent),0.2)]", // Accent Glow
        "transition-all duration-500 ease-in-out",
        isAnimate ? "scale-110 translate-x-[-10px]" : "hover:bg-primary hover:border-accent",
        "active:scale-90 group"
      )}
    >
      {/* Item Counter with Pulse */}
      <div className={cn(
        "relative flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black transition-all duration-500",
        totalItems > 0 
          ? "bg-accent text-accent-foreground shadow-[0_0_10px_hsla(var(--accent),0.6)]" 
          : "bg-card-foreground/10 text-card-foreground/30"
      )}>
        {totalItems}
        {totalItems > 0 && (
          <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-25" />
        )}
      </div>

      <ShoppingBag className={cn(
        "h-5 w-5 transition-colors duration-300",
        totalItems > 0 ? "text-accent" : "text-card-foreground/20"
      )} />

      {/* Label with Vertical Text */}
      <div className="flex flex-col items-center gap-2">
        <span className="[writing-mode:vertical-lr] rotate-180 text-[9px] font-black uppercase tracking-[0.3em] text-card-foreground/90 group-hover:text-card-foreground">
          My Tray
        </span>
        
        {/* Decorative Divider */}
        <div className="flex flex-col gap-1 items-center">
            <div className="h-1 w-1 rounded-full bg-accent" />
            <div className="h-4 w-[1px] bg-gradient-to-b from-accent to-transparent" />
        </div>
      </div>
    </button>
  );
}
