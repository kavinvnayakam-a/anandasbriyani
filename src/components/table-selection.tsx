"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import Image from 'next/image';

export default function TableSelection() {
  const router = useRouter();
  const tables = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleSelectTable = (tableNumber: number) => {
    router.push(`/?table=${tableNumber}`);
  };

  return (
    // Background color matches the CustomerView exactly
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#d4af37] p-4 selection:bg-zinc-900 selection:text-white">
      
      {/* Brutalist Card: White background with heavy black borders */}
      <Card className="w-full max-w-2xl border-4 border-zinc-900 bg-white shadow-[12px_12px_0px_0px_#18181b] rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center pt-10 pb-6">
          <div className="mx-auto bg-zinc-900 text-white w-fit px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            Welcome
          </div>
          <Image src="https://firebasestorage.googleapis.com/v0/b/grillicious-backend.firebasestorage.app/o/Grillicious-logo.webp?alt=media&token=efbfa1e4-5a67-417f-aff0-bef82099852a" alt="Grillicious" width={250} height={60} className="mx-auto" />
          <CardDescription className="text-sm font-bold text-zinc-500 uppercase tracking-widest pt-3">
            Select your table to start
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {tables.map((table) => (
              <Button
                key={table}
                onClick={() => handleSelectTable(table)}
                className="
                  h-20 text-3xl font-black 
                  bg-white text-zinc-900 
                  border-2 border-zinc-900 
                  rounded-2xl
                  shadow-[4px_4px_0px_0px_#18181b] 
                  hover:bg-[#d4af37] hover:text-zinc-900 
                  active:shadow-none active:translate-x-1 active:translate-y-1 
                  transition-all
                "
              >
                {table}
              </Button>
            ))}
          </div>
          
          <div className="mt-10 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Authentic Grill & Broast Experience
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
