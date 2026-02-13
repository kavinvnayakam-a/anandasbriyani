"use client"

import Image from "next/image";
import type { MenuItem } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";
import { Plus } from "lucide-react";

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
      "group relative bg-white rounded-[2rem] overflow-hidden transition-all duration-500",
      "border border-orange-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
      isSoldOut ? "opacity-60" : "hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-1",
      !shouldShowImage && "pt-2"
    )}>
      
      {shouldShowImage && (
        <div className="relative h-64 w-full overflow-hidden bg-orange-50">
          {isSoldOut && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <span className="bg-slate-900 text-white font-bold uppercase tracking-widest px-4 py-2 rounded-full text-[10px] shadow-xl">
                Out of Stock
              </span>
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
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-white/20">
                <span className="text-slate-900 font-black text-sm tabular-nums">
                  {formatCurrency(item.price)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        <div className="min-h-[80px]">
          <div className="flex justify-between items-start gap-4">
            <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors">
              {item.name}
            </h3>
            
            {!shouldShowImage && !isSoldOut && (
              <span className="text-slate-900 font-black text-lg tabular-nums shrink-0">
                {formatCurrency(item.price)}
              </span>
            )}
          </div>

          <p className="text-slate-400 text-xs font-medium mt-2 line-clamp-2 leading-relaxed tracking-wide">
            {item.description || "A Dasara culinary masterpiece."}
          </p>
        </div>

        <div className="mt-6">
          <button
            onClick={() => onAddToCart(item)}
            disabled={isSoldOut}
            className={cn(
              "w-full h-14 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 font-bold uppercase tracking-widest text-xs",
              isSoldOut 
                ? "bg-orange-50 text-orange-300 cursor-not-allowed" 
                : "bg-primary text-white shadow-[0_10px_20px_-5px_rgba(255,165,0,0.3)] active:scale-95 hover:bg-orange-600"
            )}
          >
            {isSoldOut ? (
              'Sold Out'
            ) : (
              <>
                <span>Add to Plate</span>
                <div className="bg-white/20 p-1 rounded-full">
                  <Plus size={14} strokeWidth={3} />
                </div>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}