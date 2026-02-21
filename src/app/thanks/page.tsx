"use client"

import { useEffect } from 'react';
import { Heart, Instagram, MessageCircle, Facebook, Star, QrCode, ArrowRight } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/dasara-finedine.firebasestorage.app/o/RAVOYI%20LOGO.pdf.webp?alt=media&token=f09f33b3-b303-400e-bbc4-b5dca418c8af";

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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-40" />

      <div className="w-full max-w-md space-y-12 text-center relative z-10">
        
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl opacity-30 animate-pulse" />
          <div className="relative bg-white p-6 rounded-full ravoyi-highlight">
            <Heart className="h-12 w-12 text-primary fill-primary animate-bounce" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-2 rounded-full shadow-xl ravoyi-highlight inline-block mx-auto border-2 border-primary">
            <Image 
              src={LOGO_URL} 
              alt="RAVOYI Logo" 
              width={100} 
              height={100}
              className="rounded-full" 
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic text-white px-4 leading-tight uppercase tracking-tighter">
            Authentic Flavors, <span className="text-primary">Always.</span>
          </h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-[0.3em] max-w-[300px] mx-auto">
            A Telangana Kitchen
          </p>
        </div>

        <Link 
          href="https://maps.app.goo.gl/rqAsVLjcBzx1Yh477" 
          target="_blank"
          className="block w-full bg-zinc-900/50 backdrop-blur-xl p-10 rounded-[3rem] border border-primary/20 shadow-2xl hover:border-primary/40 transition-all duration-500 group"
        >
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-primary text-primary" />
            ))}
          </div>
          <p className="font-black italic uppercase text-white text-base mb-1">Loved the spices?</p>
          <p className="text-[10px] text-zinc-500 mb-8 font-black uppercase tracking-widest">Rate RAVOYI on Google Maps</p>
          
          <div className="inline-flex items-center gap-3 text-primary font-black text-[11px] uppercase tracking-[0.4em] border-b-2 border-primary/20 pb-2 group-hover:border-primary transition-all">
            Open Map Location <ArrowRight size={14} />
          </div>
        </Link>

        <div className="flex justify-center gap-10">
          {[
            { Icon: Facebook, href: "#" },
            { Icon: Instagram, href: "#" },
            { Icon: MessageCircle, href: "#" }
          ].map((social, idx) => (
            <Link 
              key={idx} 
              href={social.href} 
              className="text-zinc-600 hover:text-primary transition-colors p-2"
            >
              <social.Icon className="h-7 w-7" strokeWidth={1.5} />
            </Link>
          ))}
        </div>

        <div className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10 max-w-[340px] mx-auto">
          <div className="flex items-center justify-center gap-3 text-primary/40 mb-4">
            <QrCode className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Again?</span>
          </div>
          <p className="text-[11px] font-bold text-zinc-400 italic leading-relaxed uppercase tracking-wider">
            "Simply scan the counter QR code again to place a new takeaway order."
          </p>
        </div>

        <Link href="https://www.getpik.in/" target="_blank" className="pt-12 flex flex-col items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/10">Digital Experience By</span>
          <div className="flex items-center gap-4 bg-zinc-900 px-10 py-4 rounded-3xl border border-primary/10 shadow-2xl">
            <span className="text-white font-black text-xl tracking-tighter">GetPik</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>
        </Link>
      </div>
    </div>
  );
}