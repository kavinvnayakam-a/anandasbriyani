
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-40" />
      
      <Card className="w-full max-w-2xl border border-primary/20 bg-zinc-950/80 backdrop-blur-xl shadow-2xl rounded-[3.5rem] overflow-hidden relative z-10">
        <CardHeader className="text-center pt-20 pb-12">
          <div className="mx-auto bg-primary text-black w-fit px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.5em] mb-12 shadow-lg">
            ELITE CINEMA DINING
          </div>
          <div className="relative inline-block mx-auto p-1.5 bg-primary rounded-full shadow-2xl shadow-primary/20 mb-12">
            <Image src={LOGO_URL} alt="ART Cinemas" width={100} height={100} className="rounded-full" priority />
          </div>
          <div className="space-y-4">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">ART Cinemas</h2>
            <CardDescription className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em] pt-2">
              Select your theater seat to begin
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="p-12">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-6">
            {tables.map((table) => (
              <button
                key={table}
                onClick={() => handleSelectTable(table)}
                className="
                  h-20 rounded-2xl text-3xl font-black italic
                  bg-zinc-900 text-primary border border-primary/20
                  transition-all duration-300
                  hover:bg-primary hover:text-black hover:scale-105 hover:border-primary
                  active:scale-95 shadow-lg
                "
              >
                {table}
              </button>
            ))}
          </div>
          
          <div className="mt-20 text-center flex flex-col items-center gap-6">
            <div className="h-px w-24 bg-primary/20 rounded-full" />
            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/20">
              PREMIUM THEATER EXPERIENCE
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
