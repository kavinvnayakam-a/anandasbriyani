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
    <header className="sticky top-0 z-50 w-full bg-zinc-900 border-b-2 border-[#d4af37]">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* Branding */}
        <div className="flex flex-col">
          <Image src="https://firebasestorage.googleapis.com/v0/b/grillicious-backend.firebasestorage.app/o/Grillicious-logo.webp?alt=media&token=efbfa1e4-5a67-417f-aff0-bef82099852a" alt="Grillicious Logo" width={140} height={35} />
          <span className="text-[8px] font-bold text-[#d4af37] uppercase tracking-widest mt-0.5">
            Est 2025
          </span>
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
                  bg-[#d4af37] text-zinc-900 
                  shadow-[4px_4px_0_0_#ffffff]
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
