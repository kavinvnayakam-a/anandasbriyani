"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Heart, Instagram, MessageCircle, Facebook, Star, QrCode } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';

export default function ThankYouPage() {
  const router = useRouter();

  // Prevent back button navigation to the menu/table selection
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = function () {
      window.history.pushState(null, "", window.location.href);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#d4af37] flex flex-col items-center justify-center p-6 text-zinc-900 font-sans">
      <div className="w-full max-w-md bg-white border-4 border-zinc-900 rounded-[3rem] p-8 shadow-[12px_12px_0px_0px_#18181b] text-center">
        
        {/* Magical Header */}
        <div className="mb-6 flex justify-center">
          <div className="bg-zinc-900 p-4 rounded-full animate-pulse">
            <Heart className="h-8 w-8 text-[#d4af37] fill-[#d4af37]" />
          </div>
        </div>

        <Image src="https://firebasestorage.googleapis.com/v0/b/grillicious-backend.firebasestorage.app/o/Grillicious-logo.webp?alt=media&token=efbfa1e4-5a67-417f-aff0-bef82099852a" alt="Grillicious Logo" width={250} height={60} className="mx-auto mb-2" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-6">
          Hearts Full. Bellies Fuller.
        </p>

        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-bold leading-tight">
            The fire is out, but the <span className="italic underline decoration-[#d4af37] decoration-4">flavors linger.</span>
          </h2>
          <p className="text-sm font-medium text-zinc-600">
            Thank you for sharing your time and appetite with us. Your presence makes our grill sizzle brighter!
          </p>
        </div>

        {/* Google Maps Call to Action */}
        <Link 
          href="https://goo.gl/maps/YOUR_LINK" 
          target="_blank"
          className="block w-full bg-zinc-900 text-white p-6 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_0px_#d4af37] active:translate-y-1 active:shadow-none transition-all mb-8 group"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-[#d4af37] text-[#d4af37]" />
            ))}
          </div>
          <span className="font-black uppercase tracking-widest text-xs">Rate our Sizzle on Google</span>
        </Link>

        {/* Social Icons */}
        <div className="flex justify-center gap-6 mb-10">
          <Link href="#" className="p-3 bg-zinc-100 rounded-xl hover:bg-[#d4af37] transition-colors">
            <Facebook className="h-6 w-6" />
          </Link>
          <Link href="#" className="p-3 bg-zinc-100 rounded-xl hover:bg-[#d4af37] transition-colors">
            <Instagram className="h-6 w-6" />
          </Link>
          <Link href="https://wa.me/YOUR_NUMBER" className="p-3 bg-zinc-100 rounded-xl hover:bg-[#d4af37] transition-colors">
            <MessageCircle className="h-6 w-6" />
          </Link>
        </div>

        {/* Re-order Instructions */}
        <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl p-5">
          <div className="flex items-center justify-center gap-2 text-zinc-400 mb-2">
            <QrCode className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Hungry again?</span>
          </div>
          <p className="text-xs font-bold text-zinc-500 italic">
            "To continue ordering or start a new session, please scan the QR code on your table once more."
          </p>
        </div>
      </div>

      <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-zinc-800 opacity-60">
        Designed by GetPik
      </p>
    </div>
  );
}
