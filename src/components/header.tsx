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
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-xl border-b border-white/5 py-6 shadow-xl">
      <div className="container mx-auto flex items-center justify-center px-6">
        
        {/* Centered Brand Section */}
        <div className="flex flex-col items-center gap-4">
          {/* Bigger, Bolder Logo */}
          <div className="
            relative 
            h-24 w-24           
            rounded-full 
            border-4 border-accent  
            bg-white
            p-1
            shadow-[0_0_35px_hsla(var(--accent),0.5)]
            overflow-hidden
            flex items-center justify-center
            shrink-0
          ">
            <Image 
              src={LOGO_URL} 
              alt="Dindigul Ananda's Briyani Logo" 
              width={96} 
              height={96} 
              className="object-cover rounded-full"
              priority
            />
          </div>
          
          {/* Highlighted Text */}
          <div className="text-center -mt-2">
            <h1 
              className="text-xl font-black text-white uppercase tracking-widest"
              style={{ textShadow: '0 1px 8px hsla(var(--accent), 0.4)' }}
            >
              Dindigul Ananda's Briyani
            </h1>
            <p className="text-accent/80 font-bold italic text-xs tracking-tight leading-none mt-1">
              Since 2025
            </p>
          </div>
        </div>
        
      </div>
    </header>
  );
}
