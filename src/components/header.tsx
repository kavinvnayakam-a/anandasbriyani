"use client"

import Image from 'next/image';
import { Star } from 'lucide-react';

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/dasara-finedine.firebasestorage.app/o/RAVOYI%20LOGO.pdf.webp?alt=media&token=f09f33b3-b303-400e-bbc4-b5dca418c8af";

type HeaderProps = {
  tableId: string | null;
  onCartClick: () => void;
  timeLeft: number;
};

export function Header({ tableId }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-xl border-b border-white/5 py-4 shadow-xl">
      <div className="container mx-auto flex items-center justify-between px-6">
        
        {/* Brand Section: Logo stacked with Tagline */}
        <div className="flex flex-col items-start gap-2">
          <div className="
            relative 
            h-14 w-14           
            rounded-full 
            border-[2px] border-white  
            bg-white
            shadow-[0_0_15px_rgba(255,255,255,0.2)] 
            overflow-hidden
            flex items-center justify-center
            shrink-0
          ">
            <Image 
              src={LOGO_URL} 
              alt="RAVOYI Logo" 
              width={56} 
              height={56} 
              className="object-contain"
              priority
            />
          </div>
          
          <p className="text-[7px] font-black text-white/50 uppercase tracking-[0.4em] ml-1">
            A Telangana Kitchen
          </p>
        </div>

        {/* Ramadan Message Section */}
        <div className="hidden md:flex flex-col items-end text-right space-y-1">
          <div className="flex items-center gap-2 text-orange-500">
             <Star size={10} fill="currentColor" className="animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-200">Ramadan Mubarak</span>
          </div>
          <p className="text-white/60 font-medium italic text-[10px] tracking-tight leading-none">
            "Blessings in every bite, traditions in every spice."
          </p>
        </div>

        {/* Mobile Occasion Badge */}
        <div className="md:hidden flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
           <Star size={10} fill="currentColor" className="text-orange-500 animate-pulse" />
           <span className="text-[8px] font-black uppercase tracking-widest text-orange-200">Iftar Special</span>
        </div>
        
      </div>
    </header>
  );
}
