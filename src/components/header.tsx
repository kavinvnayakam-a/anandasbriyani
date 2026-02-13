"use client"

import SessionTimer from "@/components/session-timer";
import Image from 'next/image';
import { Clock, ShoppingBag } from 'lucide-react';
import { cn } from "@/lib/utils";

type HeaderProps = {
  tableId: string | null;
  onCartClick: () => void;
  timeLeft: number;
};

export function Header({ tableId, timeLeft }: HeaderProps) {
  const isTakeaway = !tableId || tableId === "Takeaway";

  return (
    <header className="sticky top-0 z-50 w-full h-20 bg-primary shadow-lg shadow-orange-900/20">
      <div className="container mx-auto h-full flex items-center justify-between px-6">
        
        <div className="flex items-center h-full">
          <div className="
            relative 
            bg-white 
            h-14 w-14 
            rounded-full 
            shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)]
            flex items-center justify-center
            overflow-hidden
            border-2 border-white
          ">
            <Image 
              src="https://firebasestorage.googleapis.com/v0/b/swissdelights-2a272.firebasestorage.app/o/Dasara%20Fine%20Dine.jpg?alt=media&token=b7591bfd-13ee-4d28-b8c0-278f3662c5b7" 
              alt="Dasara Logo" 
              width={50} 
              height={50} 
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div className="flex items-center">
          <div className="
            relative
            flex items-center 
            bg-white/20 
            backdrop-blur-xl 
            rounded-2xl 
            p-1.5 pr-5 
            border border-white/30
            shadow-[0_4px_15px_rgba(0,0,0,0.1)]
            overflow-hidden
          ">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            
            <div className={cn(
              "relative z-10 w-10 h-10 rounded-xl flex flex-col items-center justify-center shadow-inner",
              isTakeaway 
                ? "bg-white/10 text-white border border-white/20" 
                : "bg-white text-primary border border-white shadow-md"
            )}>
              {isTakeaway ? (
                <ShoppingBag size={18} />
              ) : (
                <>
                  <span className="text-[8px] font-bold uppercase opacity-60 leading-none">Tbl</span>
                  <span className="text-sm font-black tracking-tight">{tableId}</span>
                </>
              )}
            </div>
            
            <div className="relative z-10 flex flex-col justify-center ml-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock size={10} className="text-white animate-pulse" />
                <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">
                  {isTakeaway ? "Order Session" : "Time Left"}
                </span>
              </div>
              <div className="text-white font-mono font-black text-sm leading-none tabular-nums drop-shadow-sm">
                <SessionTimer timeLeft={timeLeft} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}