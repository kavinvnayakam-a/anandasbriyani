"use client"

import Image from 'next/image';

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
        
        {/* Brand Section: Circular Logo + Tagline */}
        <div className="flex flex-col items-center gap-2">
          {/* Large Rounded Logo with White Border */}
          <div className="
            relative 
            h-20 w-20           /* Bigger size (80px) */
            rounded-full 
            border-[3px] border-white  /* Distinct white border */
            bg-white
            shadow-[0_0_15px_rgba(255,255,255,0.2)] /* Soft outer glow */
            overflow-hidden
            flex items-center justify-center
          ">
            <Image 
              src={LOGO_URL} 
              alt="RAVOYI Logo" 
              width={80} 
              height={80} 
              className="object-contain"
              priority
            />
          </div>
          
          {/* Centered Tagline */}
          <p className="text-[8px] font-black text-white/70 uppercase tracking-[0.45em] leading-none text-center">
            A Telangana Kitchen
          </p>
        </div>

        {/* Action Button Section */}
        <div className="flex items-center">
          <div className="
            group relative
            bg-white text-black 
            h-10 px-6 rounded-full 
            flex items-center justify-center 
            cursor-pointer
            transition-all duration-300
            hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]
            active:scale-95
          ">
            <span className="text-[10px] font-black tracking-widest uppercase italic">
              Order Takeaway
            </span>
          </div>
        </div>
        
      </div>
    </header>
  );
}