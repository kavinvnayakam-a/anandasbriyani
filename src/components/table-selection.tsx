"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import Image from 'next/image';
import { Armchair, Loader2, ShoppingBag } from "lucide-react";
import { Table as TableType } from "@/lib/types";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/getpik-digital.firebasestorage.app/o/dindigual_anandas_briyani%2FDAB_logo.webp?alt=media&token=2a082303-daa9-4187-89de-bbeefac2ceec";

export default function TableSelection() {
  const router = useRouter();
  const firestore = useFirestore();
  const [tables, setTables] = useState<TableType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'tables'), orderBy('tableNumber'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableType)));
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsubscribe();
  }, [firestore]);

  const handleSelect = (id: string) => {
    router.push(`/?table=${id}`);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-primary">
        <Loader2 className="h-12 w-12 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      <div className="w-full max-w-2xl space-y-12 text-center relative z-20">
        
        <div className="relative flex justify-center flex-col items-center gap-4">
          <div className="relative bg-white p-3 rounded-full shadow-2xl border-4 border-white/30">
            <Image 
              src={LOGO_URL} 
              alt="Dindigul Ananda's Briyani Logo" 
              width={100} 
              height={100}
              className="rounded-full object-cover" 
              priority
            />
          </div>
          <h1 className="text-3xl font-black italic text-white leading-[1.1] uppercase tracking-tighter drop-shadow-xl">
            Welcome to Dindigul Ananda's Briyani
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/80">
            Please select your table to begin
          </p>
        </div>

        <div className="bg-white/10 border border-white/20 rounded-[2.5rem] p-8 backdrop-blur-md">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-6">Dine-In Tables</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {tables.map((table) => (
                <button
                key={table.id}
                onClick={() => handleSelect(table.id)}
                className="flex flex-col items-center justify-center gap-2 aspect-square rounded-2xl text-lg font-black italic bg-black/20 text-white border border-white/20 transition-all duration-300 hover:bg-white hover:text-primary hover:scale-105 active:scale-95 shadow-lg"
                >
                <Armchair size={24} />
                <span className="text-sm">{table.tableNumber}</span>
                </button>
            ))}
            </div>
        </div>

        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dashed border-white/20"/>
            </div>
            <div className="relative flex justify-center">
                <span className="bg-primary px-4 text-xs font-bold uppercase text-white/60">OR</span>
            </div>
        </div>

        <button 
          onClick={() => handleSelect('Takeaway')}
          className="w-full max-w-sm mx-auto flex items-center justify-center gap-4 bg-white text-primary p-6 rounded-2xl font-black uppercase text-sm tracking-widest shadow-2xl hover:scale-105 transition-transform active:scale-95"
        >
          <ShoppingBag size={20}/>
          Place a Takeaway Order
        </button>

      </div>
    </div>
  );
}
