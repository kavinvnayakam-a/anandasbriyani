"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import Image from 'next/image';

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/dasara-finedine.firebasestorage.app/o/Art%20Cinemas%20Logo.jpeg?alt=media&token=0e8ee706-4ba1-458d-b2b9-d85434f8f2ba";

export default function TableSelection() {
  const router = useRouter();
  const tables = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleSelectTable = (tableNumber: number) => {
    router.push(`/?table=${tableNumber}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-orange-50/30 p-4 selection:bg-primary selection:text-primary-foreground">
      
      <Card className="w-full max-w-2xl border-4 border-slate-900 bg-white shadow-[16px_16px_0px_0px_#1e293b] rounded-[3rem] overflow-hidden">
        <CardHeader className="text-center pt-12 pb-8">
          <div className="mx-auto bg-primary text-white w-fit px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-6 shadow-lg shadow-orange-900/20">
            PREMIUM EXPERIENCE
          </div>
          <div className="relative inline-block mx-auto p-1.5 bg-white rounded-full shadow-2xl ring-2 ring-primary/10 mb-6">
            <Image src={LOGO_URL} alt="ART Cinemas" width={80} height={80} className="rounded-full" priority />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-serif italic text-slate-900">Welcome to ART Cinemas</h2>
            <CardDescription className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pt-1">
              Select your theater seat to begin dining
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="p-10">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-6">
            {tables.map((table) => (
              <button
                key={table}
                onClick={() => handleSelectTable(table)}
                className="
                  dasara-banner h-20 text-3xl font-black italic
                  bg-primary text-white
                  transition-all duration-300
                  hover:bg-red-700 hover:shadow-xl hover:translate-y-[-4px]
                  active:translate-y-0 shadow-orange-900/10
                "
              >
                {table}
              </button>
            ))}
          </div>
          
          <div className="mt-12 text-center flex flex-col items-center gap-4">
            <div className="h-px w-16 bg-orange-100" />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">
              WHERE CINEMA MEETS CUISINE
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
