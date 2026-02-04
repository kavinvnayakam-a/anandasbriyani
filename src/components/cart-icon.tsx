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
        "fixed right-0 top-[65%] -translate-y-1/2 z-40",
        "flex flex-col items-center gap-3",
        "bg-[#b73538] text-white", // Pure solid brand red
        "py-6 px-4",
        "rounded-l-[1.5rem]", // Slightly tighter radius for a sharper look
        "border border-white/30 border-r-0", // Crisp thin border
        "shadow-[-4px_4px_12px_rgba(0,0,0,0.15)]", // Tight, neutral shadow with ZERO spread
        "transition-all duration-300 ease-in-out",
        isAnimate ? "scale-110" : "hover:bg-[#a02e31]",
        "active:scale-90 group"
      )}
    >
      {/* Items Counter - Solid White Circle */}
      <div className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black transition-all",
        totalItems > 0 
          ? "bg-white text-[#b73538]" 
          : "bg-black/20 text-white/50"
      )}>
        {totalItems}
      </div>

      {/* Shopping Bag Icon - No extra effects */}
      <ShoppingBag className={cn(
        "h-5 w-5",
        totalItems > 0 ? "text-white" : "text-white/40"
      )} />

      {/* View Cart Text */}
      <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black uppercase tracking-[0.2em]">
        Cart
      </span>

      {/* Bottom marker - Pure white solid line */}
      <div className="h-4 w-[2px] bg-white/20 mt-1 rounded-full" />
    </button>
  );
}