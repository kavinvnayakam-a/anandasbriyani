"use client"

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useEffect, useState } from "react";

export function CartIcon({ onOpen }: { onOpen?: () => void }) {
  const { totalItems, cartTotal } = useCart();
  const [isAnimate, setIsAnimate] = useState(false);

  // Animation trigger when items are added
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
      className={`
        /* Positioning: Fixed to the right edge, middle of screen */
        fixed right-0 top-1/2 -translate-y-1/2 z-50
        
        /* Layout: Vertical column */
        flex flex-col items-center gap-2
        
        /* Styling: Zinc Black with Mustard Yellow details */
        bg-zinc-900 text-white
        py-5 px-3
        rounded-l-[2rem]
        border-y-2 border-l-2 border-[#d4af37]
        
        /* Interaction */
        shadow-[-10px_0px_30px_rgba(0,0,0,0.2)]
        transition-all duration-300 active:scale-90
        ${isAnimate ? 'translate-x-0 scale-110' : 'translate-x-0 scale-100'}
        hover:bg-zinc-800
      `}
    >
      {/* Item Count Badge - Mustard Yellow bubble */}
      <div className="
        flex h-6 w-6 items-center justify-center 
        rounded-full bg-[#d4af37] text-zinc-900 
        text-[10px] font-black border-2 border-white
        shadow-sm
      ">
        {totalItems}
      </div>

      {/* Bag Icon */}
      <ShoppingBag className="h-6 w-6 text-[#d4af37]" />

      {/* Vertical Branding Text */}
      <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
        Your Cart
      </span>

      {/* Green indicator for money value */}
      {totalItems > 0 && (
        <div className="mt-2 pt-2 border-t border-zinc-800 w-full flex justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      )}
    </button>
  );
}
