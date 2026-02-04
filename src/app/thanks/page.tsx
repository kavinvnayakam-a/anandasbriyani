"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Instagram, MessageCircle, Facebook, Star, QrCode, ArrowRight } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { cn } from "@/lib/utils";

export default function ThankYouPage() {
  const router = useRouter();

  // Prevent back button navigation
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = function () {
      window.history.pushState(null, "", window.location.href);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 text-slate-900">
      <div className="w-full max-w-md space-y-10 text-center">
        
        {/* Animated Heart Icon */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-red-100 rounded-full blur-3xl opacity-30 animate-pulse" />
          <div className="relative bg-white p-5 rounded-full shadow-xl shadow-red-900/5 border border-slate-50">
            <Heart className="h-10 w-10 text-[#b73538] fill-[#b73538] animate-bounce" />
          </div>
        </div>

        {/* Branding */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 inline-block mx-auto">
            <Image 
              src="https://firebasestorage.googleapis.com/v0/b/swissdelights-2a272.firebasestorage.app/o/Swiss_logo.webp?alt=media&token=70912942-ad4e-4840-9c22-99ab267c42c6" 
              alt="Swiss Delight Logo" 
              width={160} 
              height={40} 
            />
          </div>
          <h1 className="text-4xl font-serif italic text-slate-800 px-4">
            The aroma lingers, until we <span className="text-[#b73538]">meet again.</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
            Thank you for sharing a moment of sweetness with us today.
          </p>
        </div>

        {/* Google Review Card - Clean & Integrated */}
        <Link 
          href="https://maps.app.goo.gl/hHyVcRzcADgVuR6j7" 
          target="_blank"
          className="block w-full bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-black/5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group"
        >
          <div className="flex items-center justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="font-bold text-slate-800 text-sm mb-1">Enjoyed the experience?</p>
          <p className="text-xs text-slate-400 mb-6 font-medium">Rate our Cafe on Google</p>
          
          <div className="inline-flex items-center gap-2 text-[#b73538] font-black text-[10px] uppercase tracking-widest border-b-2 border-[#b73538]/20 pb-1 group-hover:border-[#b73538] transition-all">
            Write a review <ArrowRight size={12} />
          </div>
        </Link>

        {/* Social Links - Minimalist Icons */}
        <div className="flex justify-center gap-8">
          {[
            { Icon: Facebook, href: "#" },
            { Icon: Instagram, href: "#" },
            { Icon: MessageCircle, href: "#" }
          ].map((social, idx) => (
            <Link 
              key={idx} 
              href={social.href} 
              className="text-slate-300 hover:text-[#b73538] transition-colors p-2"
            >
              <social.Icon className="h-6 w-6" strokeWidth={1.5} />
            </Link>
          ))}
        </div>

        {/* Re-order Instructions - Subtle Glass Box */}
        <div className="bg-slate-50/80 rounded-3xl p-6 border border-slate-100 max-w-[320px] mx-auto">
          <div className="flex items-center justify-center gap-2 text-slate-400 mb-3">
            <QrCode className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">Craving more?</span>
          </div>
          <p className="text-[11px] font-medium text-slate-500 italic leading-relaxed">
            "Simply scan the table QR code again to start a new session or browse the menu."
          </p>
        </div>

        {/* Footer Branding - Softened */}
        <Link href="https://www.getpik.in/" target="_blank" className="pt-10 flex flex-col items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300">Handcrafted by</span>
          <div className="flex items-center gap-3 bg-white px-6 py-2.5 rounded-full border border-slate-100 shadow-sm">
            <span className="text-slate-900 font-bold text-sm tracking-tight">GetPik</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </Link>
      </div>
    </div>
  );
}