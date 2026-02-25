"use client"

import Image from 'next/image';
import { Star } from 'lucide-react';

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/getpik-digital.firebasestorage.app/o/dindigual_anandas_briyani%2FDAB_logo.webp?alt=media&token=2a082303-daa9-4187-89de-bbeefac2ceec";

type HeaderProps = {
  tableId: string | null;
  onCartClick: () => void;
  timeLeft: number;
};

export function Header({ tableId }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-xl border-b border-white/5 py-4 shadow-xl">
      <div className="container mx-auto flex items-center justify-between px-6">
        
        {/* Brand Section: Logo stacked with Tagline (Center Aligned with each other) */}
        <div className="flex flex-col items-center gap-2">
          <div className="
            relative 
            h-14 w-14           
            rounded-full 
            border-[2px] border-accent  
            bg-white
            shadow-[0_0_15px_hsla(var(--accent),0.4)]
            overflow-hidden
            flex items-center justify-center
            shrink-0
          ">
            <Image 
              src={LOGO_URL} 
              alt="Dindigul Ananda's Briyani Logo" 
              width={56} 
              height={56} 
              className="object-cover"
              priority
            />
          </div>
          
          <p className="text-[7px] font-black text-white/50 uppercase tracking-[0.4em] text-center">
            Dindigul Ananda's Briyani
          </p>
        </div>

        {/* Message Section */}
        <div className="hidden md:flex flex-col items-end text-right space-y-1">
          <div className="flex items-center gap-2 text-accent">
             <Star size={10} fill="currentColor" className="animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-[0.3em] text-yellow-200">Authentic Briyani</span>
          </div>
          <p className="text-white/60 font-medium italic text-[10px] tracking-tight leading-none">
            "Since 1989"
          </p>
        </div>

        {/* Mobile Occasion Badge */}
        <div className="md:hidden flex items-center gap-1.5 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full">
           <Star size={10} fill="currentColor" className="text-accent animate-pulse" />
           <span className="text-[8px] font-black uppercase tracking-widest text-yellow-200">Since 1989</span>
        </div>
        
      </div>
    </header>
  );
}
