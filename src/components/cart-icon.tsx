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
        "flex flex-col items-center gap-4",
        "bg-[#0c1a2b] text-white", // Royal Navy Background
        "py-10 px-4",
        "rounded-l-[2.5rem]", 
        "border-2 border-orange-500/40 border-r-0", // Orange Border
        "shadow-[-10px_0_40px_rgba(249,115,22,0.2)]", // Orange Glow
        "transition-all duration-500 ease-in-out",
        isAnimate ? "scale-110 translate-x-[-10px]" : "hover:bg-orange-600 hover:border-orange-300",
        "active:scale-90 group"
      )}
    >
      {/* Item Counter with Pulse */}
      <div className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-black transition-all duration-500",
        totalItems > 0 
          ? "bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.6)]" 
          : "bg-white/10 text-white/30"
      )}>
        {totalItems}
        {totalItems > 0 && (
          <span className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-25" />
        )}
      </div>

      <ShoppingBag className={cn(
        "h-6 w-6 transition-colors duration-300",
        totalItems > 0 ? "text-orange-400" : "text-white/20"
      )} />

      {/* Label with Vertical Text */}
      <div className="flex flex-col items-center gap-2">
        <span className="[writing-mode:vertical-lr] rotate-180 text-[11px] font-black uppercase tracking-[0.4em] text-white/90 group-hover:text-white">
          My Tray
        </span>
        
        {/* Decorative Divider */}
        <div className="flex flex-col gap-1 items-center">
            <div className="h-1 w-1 rounded-full bg-orange-500" />
            <div className="h-8 w-[1px] bg-gradient-to-b from-orange-500 to-transparent" />
        </div>
      </div>
    </button>
  );
}