"use client"

import SessionTimer from "@/components/session-timer";
import Image from 'next/image';
import { Clock, ShoppingBag } from 'lucide-react';
import { cn } from "@/lib/utils";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/dasara-finedine.firebasestorage.app/o/Art%20Cinemas%20Logo.jpeg?alt=media&token=0e8ee706-4ba1-458d-b2b9-d85434f8f2ba";

type HeaderProps = {
  tableId: string | null;
  onCartClick: () => void;
  timeLeft: number;
};

export function Header({ tableId, timeLeft }: HeaderProps) {
  const isTakeaway = !tableId || tableId === "Takeaway";

  return (
    <header className="sticky top-0 z-50 w-full h-20 bg-black/80 backdrop-blur-xl border-b border-primary/20 shadow-2xl">
      <div className="container mx-auto h-full flex items-center justify-between px-6">
        
        <div className="flex items-center gap-4">
          <div className="
            relative 
            bg-primary 
            h-12 w-12 
            rounded-full 
            shadow-[0_0_15px_rgba(212,175,55,0.3)]
            flex items-center justify-center
            overflow-hidden
            border-2 border-primary
          ">
            <Image 
              src={LOGO_URL} 
              alt="ART Cinemas Logo" 
              width={44} 
              height={44} 
              className="object-cover"
              priority
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <h1 className="text-xl font-black italic uppercase tracking-tighter text-primary leading-none">
              ART Cinemas
            </h1>
            <span className="text-[8px] font-bold text-primary/60 uppercase tracking-[0.3em] mt-0.5">Premium Experience</span>
          </div>
        </div>

        <div className="flex items-center">
          <div className="
            relative
            flex items-center 
            bg-zinc-900/50 
            rounded-2xl 
            p-1.5 pr-5 
            border border-primary/30
            shadow-inner
          ">
            <div className={cn(
              "relative z-10 w-10 h-10 rounded-xl flex flex-col items-center justify-center shadow-lg",
              isTakeaway 
                ? "bg-zinc-800 text-primary border border-primary/20" 
                : "bg-primary text-black border border-primary"
            )}>
              {isTakeaway ? (
                <ShoppingBag size={18} />
              ) : (
                <>
                  <span className="text-[8px] font-black uppercase opacity-60 leading-none">Seat</span>
                  <span className="text-sm font-black tracking-tight">{tableId}</span>
                </>
              )}
            </div>
            
            <div className="relative z-10 flex flex-col justify-center ml-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock size={10} className="text-primary animate-pulse" />
                <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">
                  {isTakeaway ? "Session" : "Show Time"}
                </span>
              </div>
              <div className="text-primary font-mono font-black text-sm leading-none tabular-nums">
                <SessionTimer timeLeft={timeLeft} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}