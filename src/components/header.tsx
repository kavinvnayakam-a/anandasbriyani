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
    <header className="sticky top-0 z-50 w-full h-20 bg-black/80 backdrop-blur-xl border-b border-primary/20 shadow-2xl">
      <div className="container mx-auto h-full flex items-center justify-between px-6">
        
        <div className="flex items-center gap-4">
          <div className="
            relative 
            bg-white 
            h-12 w-12 
            rounded-full 
            ravoyi-highlight
            flex items-center justify-center
            overflow-hidden
            border-2 border-primary
          ">
            <Image 
              src={LOGO_URL} 
              alt="RAVOYI Logo" 
              width={48} 
              height={48} 
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-primary leading-none">
              RAVOYI
            </h1>
            <span className="text-[8px] font-bold text-primary/60 uppercase tracking-[0.3em] mt-0.5">A Telangana Kitchen</span>
          </div>
        </div>

        <div className="flex items-center">
          <div className="
            relative
            flex items-center 
            bg-zinc-900/50 
            rounded-2xl 
            p-1.5 
            border border-primary/30
            shadow-inner
          ">
            <div className="relative z-10 h-10 px-6 rounded-xl flex flex-col items-center justify-center bg-primary text-white border border-primary shadow-lg">
               <span className="text-xs font-black tracking-tight uppercase italic">ORDER TAKEAWAY</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}