"use client"

import Image from "next/image";
import type { MenuItem } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";
import { Plus, Info } from "lucide-react";

type MenuItemCardProps = {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
  globalShowImages?: boolean; 
};

export function MenuItemCard({ item, onAddToCart, globalShowImages = true }: MenuItemCardProps) {
  const isSoldOut = !item.available;
  const shouldShowImage = globalShowImages && item.image && item.showImage !== false;

  return (
    <div className={cn(
      "group relative bg-zinc-900/40 rounded-[2.5rem] overflow-hidden transition-all duration-700",
      "border border-primary/10 shadow-2xl",
      isSoldOut ? "opacity-60" : "hover:border-primary/40 hover:-translate-y-2",
      !shouldShowImage && "pt-4"
    )}>
      
      {shouldShowImage && (
        <div className="relative h-72 w-full overflow-hidden bg-zinc-950">
          {isSoldOut && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-[2px]">
              <div className="dasara-banner bg-primary text-black px-8 py-3 font-black uppercase tracking-widest text-[10px] shadow-2xl">
                Sold Out
              </div>
            </div>
          )}
          
          <Image
            src={item.image}
            alt={item.name}
            fill
            className={cn(
              "object-cover transition-transform duration-1000 ease-out",
              !isSoldOut && "group-hover:scale-110"
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {!isSoldOut && (
            <div className="absolute top-6 left-6 z-10">
              <div className="dasara-banner bg-black/80 backdrop-blur-md px-6 py-2 shadow-xl border border-primary/30">
                <span className="text-primary font-black text-sm tabular-nums">
                  {formatCurrency(item.price)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-8">
        <div className="min-h-[100px]">
          <div className="flex justify-between items-start gap-4 mb-3">
            <h3 className="text-2xl font-serif italic text-primary/90 leading-tight group-hover:text-primary transition-colors">
              {item.name}
            </h3>
            
            {!shouldShowImage && !isSoldOut && (
              <span className="text-primary font-black text-xl tabular-nums shrink-0 mt-1">
                {formatCurrency(item.price)}
              </span>
            )}
          </div>

          <div className="flex items-start gap-2 mb-4">
             <Info size={12} className="text-primary/30 mt-0.5" />
             <p className="text-primary/40 text-[11px] font-medium leading-relaxed tracking-wide italic">
               {item.description || "A regional masterpiece, carefully prepared with hand-picked spices for an authentic ART Cinemas experience."}
             </p>
          </div>
        </div>

        <div className="mt-8 relative group/btn">
          <div className="absolute top-1/2 -translate-y-1/2 w-full h-px bg-primary/10 scale-x-110 group-hover/btn:bg-primary/20 transition-all duration-500" />
          
          <button
            onClick={() => onAddToCart(item)}
            disabled={isSoldOut}
            className={cn(
              "dasara-banner relative z-10 w-full h-16 flex items-center justify-center gap-3 transition-all duration-500 font-black uppercase tracking-[0.2em] text-[10px]",
              isSoldOut 
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" 
                : "bg-primary text-black shadow-xl hover:bg-white hover:scale-105 active:scale-95"
            )}
          >
            {isSoldOut ? (
              'OUT OF STOCK'
            ) : (
              <>
                <span>ADD TO PLATE</span>
                <div className="bg-black/10 p-1.5 rounded-full ring-1 ring-black/10">
                  <Plus size={14} strokeWidth={4} />
                </div>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}