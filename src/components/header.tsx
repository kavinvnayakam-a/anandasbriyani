"use client"

import SessionTimer from "@/components/session-timer";
import Image from 'next/image';

type HeaderProps = {
  tableId: string | null;
  onCartClick: () => void;
  timeLeft: number;
};

export function Header({ tableId, timeLeft }: HeaderProps) {
  return (
    // Z-index 50 ensures it stays above the menu
    <header className="sticky top-0 z-50 w-full bg-[#e76876] border-b-2 border-zinc-900">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* Branding */}
        <div className="flex flex-col">
          <Image src="https://firebasestorage.googleapis.com/v0/b/swissdelights-2a272.firebasestorage.app/o/Swiss_logo.webp?alt=media&token=70912942-ad4e-4840-9c22-99ab267c42c6" alt="Swiss Delights Logo" width={140} height={35} />
        </div>

        <div className="flex items-center gap-3">
          {tableId && (
            <>
              {/* Compact Timer Pill */}
              <div className="hidden md:flex items-center bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700">
                <SessionTimer timeLeft={timeLeft} />
              </div>
              
              {/* PROJECTED TABLE ID BADGE */}
              <div className="relative">
                <div className="
                  /* Positioning: Moves it slightly down to hang off the header */
                  translate-y-4
                  flex flex-col items-center justify-center
                  min-w-[60px] h-[60px] 
                  rounded-2xl border-4 border-zinc-900 
                  bg-zinc-900 text-white
                  shadow-[4px_4px_0_0_#18181b]
                ">
                  <span className="text-[9px] uppercase font-black leading-none mb-0.5">
                    Table
                  </span>
                  <span className="text-2xl font-black leading-none tracking-tighter">
                    {tableId}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
       {/* Timer for Mobile */}
       {tableId && (
          <div className="md:hidden absolute top-20 right-4 bg-zinc-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl border border-zinc-700 shadow-lg">
            <SessionTimer timeLeft={timeLeft} />
          </div>
        )}
    </header>
  );
}
