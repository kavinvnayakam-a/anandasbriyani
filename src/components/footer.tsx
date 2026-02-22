
"use client"

import { useMemo } from 'react';
import { useCart } from '@/hooks/use-cart';
import { menuItems } from '@/lib/menu-data';
import { Header } from '@/components/header';
import { MenuItemCard } from '@/components/menu-item-card';
import { CartSheet } from '@/components/cart-sheet';
import { CartIcon } from '@/components/cart-icon';
import TableSelection from './table-selection';
import type { MenuItem } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from 'react';
import Link from 'next/link';

export default function CustomerView({ tableId }: { tableId: string | null }) {
  const { addToCart } = useCart();
  const [isCartOpen, setCartOpen] = useState(false);

  const categorizedMenu = useMemo(() => {
    const categoryOrder = [
      'Wraps', 'Shawarma', 'Kebabs & Falafel', 'Lebanese Grill', 
      'Broasted Chicken', 'Broast Platters', 'Platters', 'Salads', 
      'Burgers', 'Fries', 'Sides', 'Drinks'
    ];
    
    const grouped = menuItems.reduce((acc, item) => {
      const category = item.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);

    return categoryOrder.map(category => ({
      category,
      items: grouped[category] || []
    })).filter(group => group.items.length > 0);
  }, []);

  if (!tableId) {
    return <TableSelection />;
  }

  return (
    <div className="min-h-screen bg-[#e76876] font-sans flex flex-col">
      <Header tableId={tableId} onCartClick={() => setCartOpen(true)} timeLeft={0} />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-zinc-900 leading-none">
            Menu
          </h1>
          <p className="text-zinc-900 font-bold mt-2 opacity-80 uppercase tracking-widest text-xs">
            Authentic Grill & Broast
          </p>
        </header>

        <Accordion type="multiple" defaultValue={[]} className="w-full space-y-4">
          {categorizedMenu.map(({ category, items }) => (
            <AccordionItem value={category} key={category} className="border-none">
              <AccordionTrigger className="flex px-6 py-4 bg-zinc-900 text-white rounded-xl shadow-[4px_4px_0_0_#00000040] hover:no-underline transition-transform active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <span className="text-xl font-black uppercase italic tracking-tight">
                    {category}
                  </span>
                  <span className="text-[10px] bg-white text-zinc-900 px-2 py-0.5 rounded font-bold">
                    {items.length}
                  </span>
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

      <footer className="mt-20 bg-zinc-900 text-white py-12 px-6 border-t-4 border-white">
        <div className="container mx-auto flex flex-col items-center gap-6">
          <div className="text-2xl font-black italic uppercase tracking-tighter text-[#e76876]">
            Grillicious
          </div>
          
          <div className="h-px w-16 bg-zinc-800" />
          
          <Link 
            href="https://www.getpik.in/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-2 transition-transform hover:scale-105"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 group-hover:text-[#e76876] transition-colors">
              Designed By
            </span>
            <div className="flex items-center gap-2 bg-white px-5 py-2 rounded-2xl border-2 border-[#e76876] shadow-[4px_4px_0_0_#e76876] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all">
              <span className="text-zinc-900 font-black text-xl tracking-tight">GetPik</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </Link>
          
          <p className="text-[9px] text-zinc-600 font-medium uppercase tracking-widest mt-4">
            © 2026 All Rights Reserved
          </p>
        </div>
      </footer>

      <CartSheet isOpen={isCartOpen} onOpenChange={setCartOpen} tableId={tableId} />
      <CartIcon onOpen={() => setCartOpen(true)} />
    </div>
  );
}
