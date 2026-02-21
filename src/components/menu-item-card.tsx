"use client"

import Image from "next/image";
import type { MenuItem } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";
import { Plus, Star } from "lucide-react";

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
      "group relative bg-black/10 rounded-[2rem] overflow-hidden transition-all duration-500",
      "border border-white/10 shadow-2xl backdrop-blur-sm",
      isSoldOut ? "opacity-60" : "hover:border-white/30 hover:-translate-y-1 hover:shadow-black/20",
      !shouldShowImage && "pt-6"
    )}>
      
      {shouldShowImage && (
        <div className="relative h-64 w-full overflow-hidden">
          {isSoldOut && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-[2px]">
              <div className="bg-white/10 text-white/60 px-6 py-2 rounded-full border border-white/20 font-bold uppercase tracking-widest text-[10px]">
                Sold Out
              </div>
            </div>
          )}
          
          <Image
            src={item.image}
            alt={item.name}
            fill
            className={cn(
              "object-cover transition-transform duration-700 ease-out",
              !isSoldOut && "group-hover:scale-105"
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {!isSoldOut && (
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5">
                <Star size={10} className="text-white fill-white" />
                <span className="text-white font-bold text-xs uppercase tracking-widest">RAVOYI</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-4">
            <h3 className="text-xl font-bold text-white tracking-tight leading-snug group-hover:text-black transition-colors">
              {item.name}
            </h3>
            <span className="text-white font-black text-lg tabular-nums shrink-0">
              {formatCurrency(item.price)}
            </span>
          </div>
          
          <p className="text-white/70 text-xs font-medium leading-relaxed line-clamp-2">
            {item.description || "A regional masterpiece, carefully prepared with hand-picked spices for an authentic RAVOYI Kitchen experience."}
          </p>
        </div>

        <button
          onClick={() => onAddToCart(item)}
          disabled={isSoldOut}
          className={cn(
            "w-full h-12 rounded-full flex items-center justify-center gap-2.5 transition-all duration-300 font-bold uppercase tracking-widest text-[10px]",
            isSoldOut 
              ? "bg-white/5 text-white/20 cursor-not-allowed" 
              : "bg-white text-background shadow-lg hover:bg-black hover:text-white active:scale-95"
          )}
        >
          {isSoldOut ? (
            'OUT OF STOCK'
          ) : (
            <>
              <span>ADD TO TRAY</span>
              <Plus size={14} strokeWidth={3} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}