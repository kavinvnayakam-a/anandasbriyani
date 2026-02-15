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
        "bg-primary text-black", 
        "py-8 px-5",
        "rounded-l-[2rem]", 
        "border border-white/20 border-r-0", 
        "shadow-[-10px_0_30px_rgba(212,175,55,0.2)]", 
        "transition-all duration-300 ease-in-out",
        isAnimate ? "scale-110" : "hover:bg-white",
        "active:scale-90 group"
      )}
    >
      <div className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black transition-all",
        totalItems > 0 
          ? "bg-black text-primary" 
          : "bg-black/20 text-black/50"
      )}>
        {totalItems}
      </div>

      <ShoppingBag className={cn(
        "h-6 w-6",
        totalItems > 0 ? "text-black" : "text-black/40"
      )} />

      <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black uppercase tracking-[0.3em]">
        My Tray
      </span>

      <div className="h-6 w-[2px] bg-black/10 mt-1 rounded-full" />
    </button>
  );
}