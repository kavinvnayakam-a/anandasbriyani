"use client"

import { useEffect } from 'react';
import { Heart, Star, ArrowRight, Moon } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { cn } from "@/lib/utils";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/dasara-finedine.firebasestorage.app/o/RAVOYI%20LOGO.pdf.webp?alt=media&token=f09f33b3-b303-400e-bbc4-b5dca418c8af";

const HangingDecoration = ({ className, delay = "0s", height = "h-32", type = "lantern" }: { className?: string, delay?: string, height?: string, type?: "lantern" | "moon" | "star" }) => (
  <div 
    className={cn("absolute flex flex-col items-center z-10", className)}
    style={{ animation: `sway 4s ease-in-out infinite alternate ${delay}` }}
  >
    <div className={cn("w-[1px] bg-gradient-to-b from-transparent via-white/40 to-white/60", height)} />
    
    {type === "lantern" && (
      <div className="relative w-7 h-10">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-4 bg-gradient-to-b from-amber-200 to-amber-400 rounded-t-full border border-white/30" />
        <div className="w-full h-full bg-[#0c1a2b] rounded-sm border border-amber-300 relative overflow-hidden">
          <div className="absolute inset-x-1 top-1 bottom-1 bg-gradient-to-t from-orange-500 to-white/80 rounded-t-full flex items-center justify-center">
             <div className="w-1.5 h-3 bg-white rounded-full blur-[2px] opacity-80 animate-pulse" />
          </div>
        </div>
        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-9 h-1.5 bg-amber-500 rounded-sm border-t border-white/20" />
      </div>
    )}
    {type === "moon" && <Moon size={42} className="text-white fill-white/20 drop-shadow-lg" />}
    {type === "star" && <Star size={16} className="text-white fill-white drop-shadow-md" />}
  </div>
);

export default function ThankYouPage() {
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="min-h-screen bg-[#b8582e] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      
      <style jsx global>{`
        @keyframes sway {
          0% { transform: rotate(-2.5deg); transform-origin: top center; }
          100% { transform: rotate(2.5deg); transform-origin: top center; }
        }
      `}</style>

      {/* 🏮 DECORATIONS */}
      <div className="absolute top-0 left-0 w-full h-64 overflow-hidden pointer-events-none z-10">
        <HangingDecoration className="left-[8%]" height="h-24" type="moon" delay="0s" />
        <HangingDecoration className="left-[25%]" height="h-16" type="star" delay="1s" />
        <HangingDecoration className="right-[25%]" height="h-32" type="lantern" delay="0.5s" />
        <HangingDecoration className="right-[8%]" height="h-20" type="star" delay="1.8s" />
      </div>

      <div className="w-full max-w-md space-y-10 text-center relative z-20 pt-16">
        
        {/* MASSIVE BRAND LOGO */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-[60px] opacity-40 animate-pulse" />
          <div className="relative bg-white p-3 rounded-full shadow-2xl border-4 border-white/30">
            <Image 
              src={LOGO_URL} 
              alt="RAVOYI Logo" 
              width={160} 
              height={160}
              className="rounded-full" 
              priority
            />
          </div>
        </div>

        {/* GetPik Branding Relocated */}
        <Link href="https://www.getpik.in/pos" target="_blank" className="flex flex-col items-center gap-3 group">
          <span className="text-[8px] font-black uppercase tracking-[0.6em] text-white/40">Digital Experience By</span>
          <div className="flex items-center gap-3 bg-black px-6 py-2.5 rounded-full shadow-2xl border border-white/10">
            <span className="text-white font-black text-sm tracking-tighter">GetPik</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#b8582e] shadow-[0_0_10px_#fff] animate-pulse" />
          </div>
        </Link>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-2">
             <Heart size={16} fill="currentColor" className="text-white animate-pulse" />
             <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-white/80">Thank You</h2>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black italic text-white leading-[1.1] uppercase tracking-tighter drop-shadow-xl">
            We hope you <br /> <span className="text-black/60">Enjoyed it.</span>
          </h1>
          <p className="text-white/60 text-[10px] font-bold italic tracking-widest uppercase">
            Your visit means the world to us.
          </p>
        </div>

        {/* Review Card */}
        <Link 
          href="https://maps.google.com" 
          target="_blank"
          className="block w-full bg-white p-10 rounded-[3.5rem] shadow-2xl border border-white/10 group transition-all duration-500 hover:scale-[1.02]"
        >
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-[#b8582e] text-[#b8582e]" />
            ))}
          </div>
          <p className="font-black italic uppercase text-zinc-900 text-xl mb-1 tracking-tighter">Loved the taste?</p>
          <p className="text-[10px] text-zinc-400 mb-8 font-black uppercase tracking-widest">Rate your experience on Google</p>
          
          <div className="inline-flex items-center gap-3 bg-[#b8582e] text-white font-black text-[12px] uppercase tracking-[0.4em] px-8 py-4 rounded-full group-hover:bg-zinc-900 transition-all shadow-xl shadow-[#b8582e]/20">
            Open Maps <ArrowRight size={16} />
          </div>
        </Link>
      </div>
    </div>
  );
}
