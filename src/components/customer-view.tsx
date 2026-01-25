"use client"

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionTimer } from '@/hooks/use-session-timer';
import { useCart } from '@/hooks/use-cart';
import { db } from '@/firebase/config'; 
import { collection, onSnapshot, query } from 'firebase/firestore'; 
import { Header } from '@/components/header';
import { MenuItemCard } from '@/components/menu-item-card';
import { CartSheet } from '@/components/cart-sheet';
import { CartIcon } from '@/components/cart-icon';
// REMOVED: TableSelection (We are replacing it with a Brand Storefront)
import type { MenuItem } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';
import { Utensils, MapPin, Clock as ClockIcon, ArrowRight } from 'lucide-react';

export default function CustomerView({ tableId }: { tableId: string | null }) {
  const router = useRouter();
  const { clearCart, addToCart } = useCart();
  const [isCartOpen, setCartOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(!!tableId); // If table scanned, skip storefront
  const { toast } = useToast();

  // --- LIVE DATA STATE ---
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- REAL-TIME FIRESTORE LISTENER ---
  useEffect(() => {
    const q = query(collection(db, "menu_items")); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MenuItem[];
      setMenuItems(items);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });
    return () => unsubscribe(); 
  }, []);

  const { timeLeft } = useSessionTimer(() => {
    clearCart();
    router.push('/thanks');
  });

  useEffect(() => {
    if (tableId && typeof window !== 'undefined' && window.innerWidth < 768) {
      toast({
        title: "Session Active",
        description: "Order within 10mins to keep your table session.",
        className: "bg-zinc-900 text-white border-b-4 border-amber-500",
        duration: 5000,
      });
    }
  }, [tableId, toast]);

  const categorizedMenu = useMemo(() => {
    const categoryOrder = [
      'Wraps', 'Shawarma', 'Kebabs & Falafel', 'Lebanese Grill', 
      'Broasted Chicken', 'Broast Platters', 'Platters', 'Salads', 
      'Burgers', 'Fries', 'Sides', 'Drinks'
    ];
    
    const grouped = menuItems.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);

    const orderedGroups = categoryOrder.map(category => ({
      category,
      items: grouped[category] || []
    })).filter(group => group.items.length > 0);

    const extraGroups = Object.keys(grouped)
      .filter(cat => !categoryOrder.includes(cat))
      .map(cat => ({
        category: cat,
        items: grouped[cat]
      }));

    return [...orderedGroups, ...extraGroups];
  }, [menuItems]);

  // --- LOADING SCREEN ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#d4af37] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="font-black uppercase italic text-zinc-900 tracking-tighter">Setting the Grill...</h2>
        </div>
      </div>
    );
  }

  // --- BRAND STOREFRONT / WELCOME VIEW (If no table scanned or not clicked 'Order Now') ---
  if (!showMenu && !tableId) {
    return (
      <div className="min-h-screen bg-[#d4af37] font-sans selection:bg-zinc-900 selection:text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Brand Identity */}
          <div className="space-y-2">
            <Image src="https://firebasestorage.googleapis.com/v0/b/grillicious-backend.firebasestorage.app/o/Grillicious-logo.webp?alt=media&token=efbfa1e4-5a67-417f-aff0-bef82099852a" alt="Grillicious Logo" width={400} height={100} className="mx-auto" />
            <div className="h-2 w-24 bg-zinc-900 mx-auto rounded-full" />
            <p className="font-bold text-zinc-900 uppercase tracking-[0.3em] text-xs pt-2">
              Authentic Grill & Broast
            </p>
          </div>

          {/* Restaurant Details Card */}
          <div className="bg-white border-4 border-zinc-900 p-8 rounded-[3rem] shadow-[12px_12px_0_0_#000] space-y-6 text-left transform -rotate-1">
            <p className="text-zinc-800 font-bold italic text-lg leading-tight">
              "The smoke of the grill meets the crunch of the broast. Experience Hyderabad's finest Lebanese flavors."
            </p>
            
            <div className="space-y-4 pt-4 border-t-2 border-zinc-100">
              <div className="flex items-center gap-4">
                <div className="bg-zinc-900 p-2 rounded-xl text-[#d4af37]"><MapPin size={18}/></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-zinc-400">Find Us</p>
                  <p className="font-black text-sm uppercase">Hyderabad-Vansthalipuram, HYD</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-zinc-900 p-2 rounded-xl text-[#d4af37]"><ClockIcon size={18}/></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-zinc-400">Hours</p>
                  <p className="font-black text-sm uppercase">12:00 PM - 12:00 AM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <button 
            onClick={() => setShowMenu(true)}
            className="group w-full bg-zinc-900 text-[#d4af37] py-6 rounded-[2rem] font-black uppercase italic text-2xl shadow-xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Order Take-Away
            <ArrowRight className="group-hover:translate-x-2 transition-transform" />
          </button>
          
          <p className="text-[10px] font-black uppercase text-zinc-800 tracking-widest opacity-60">
            Scan Table QR for Dine-In Experience
          </p>
        </div>
      </div>
    );
  }

  // --- MAIN MENU VIEW ---
  return (
    <div className="min-h-screen bg-[#d4af37] font-sans selection:bg-zinc-900 selection:text-white">
      <Header tableId={tableId || "Takeaway"} onCartClick={() => setCartOpen(true)} timeLeft={timeLeft} />
      
      <main className="container mx-auto px-4 py-8 pb-32">
        <header className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter text-zinc-900 leading-none">
              Menu
            </h1>
            <p className="text-zinc-900 font-bold mt-2 opacity-80 uppercase tracking-widest text-xs">
              {tableId ? `Table ${tableId} • Live Selection` : 'Take-Away • Instant Pickup'}
            </p>
          </div>
          {!tableId && (
            <div className="bg-zinc-900 text-[#d4af37] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Take-Away Mode
            </div>
          )}
        </header>

        <Accordion type="multiple" defaultValue={[]} className="w-full space-y-4">
          {categorizedMenu.map(({ category, items }) => (
            <AccordionItem value={category} key={category} className="border-none">
              <AccordionTrigger className="flex px-6 py-4 bg-zinc-900 text-white rounded-xl shadow-[4px_4px_0_0_#00000040] hover:no-underline transition-transform active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <span className="text-xl font-black uppercase italic tracking-tight">{category}</span>
                  <span className="text-[10px] bg-white text-zinc-900 px-2 py-0.5 rounded font-bold">{items.length}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-6 px-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item) => (
                    <div key={item.id} className="bg-white rounded-3xl p-2 shadow-xl border-2 border-zinc-900/5">
                      <MenuItemCard item={item} onAddToCart={addToCart} />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>

      <footer className="mt-20 bg-[#d4af37] text-zinc-900 py-12 px-6 border-t-4 border-zinc-900">
        <div className="container mx-auto flex flex-col items-center gap-6">
          <Image src="https://firebasestorage.googleapis.com/v0/b/grillicious-backend.firebasestorage.app/o/Grillicious-logo.webp?alt=media&token=efbfa1e4-5a67-417f-aff0-bef82099852a" alt="Grillicious Logo" width={180} height={45} className="filter invert(1)" />
          <div className="h-px w-16 bg-zinc-900" />
          <Link href="https://www.getpik.in/" target="_blank" className="group flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-800">Designed By</span>
            <div className="flex items-center gap-2 bg-white px-5 py-2 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0_0_#18181b]">
              <span className="text-zinc-900 font-black text-xl tracking-tight">GetPik</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </Link>
          <p className="text-[9px] text-zinc-800 font-medium uppercase tracking-widest mt-4">© 2026 All Rights Reserved</p>
        </div>
      </footer>

      <CartSheet isOpen={isCartOpen} onOpenChange={setCartOpen} tableId={tableId} />
      <CartIcon onOpen={() => setCartOpen(true)} />
    </div>
  );
}
