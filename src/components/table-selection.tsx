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
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-40" />
      
      <Card className="w-full max-w-2xl border-2 border-primary/20 bg-zinc-950 shadow-[0_0_100px_rgba(212,175,55,0.05)] rounded-[4rem] overflow-hidden relative z-10">
        <CardHeader className="text-center pt-16 pb-10">
          <div className="mx-auto bg-primary text-black w-fit px-10 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.5em] mb-10 shadow-2xl">
            ELITE CINEMA DINING
          </div>
          <div className="relative inline-block mx-auto p-1.5 bg-primary rounded-full shadow-[0_0_50px_rgba(212,175,55,0.2)] mb-10">
            <Image src={LOGO_URL} alt="ART Cinemas" width={100} height={100} className="rounded-full" priority />
          </div>
          <div className="space-y-4">
            <h2 className="text-5xl font-serif italic text-white tracking-tight">ART Cinemas</h2>
            <CardDescription className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em] pt-2">
              Identify your theater seat to begin
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="p-12">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-8">
            {tables.map((table) => (
              <button
                key={table}
                onClick={() => handleSelectTable(table)}
                className="
                  dasara-banner h-24 text-4xl font-black italic
                  bg-primary text-black
                  transition-all duration-300
                  hover:bg-white hover:scale-110
                  active:scale-95 shadow-[0_10px_30px_rgba(212,175,55,0.1)]
                "
              >
                {table}
              </button>
            ))}
          </div>
          
          <div className="mt-16 text-center flex flex-col items-center gap-6">
            <div className="h-[1px] w-24 bg-primary/10" />
            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/20">
              ELITE THEATER EXPERIENCE
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}