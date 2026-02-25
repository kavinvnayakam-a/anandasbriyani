"use client"

import { useState, useMemo, useEffect } from 'react';
import { useCart } from '@/hooks/use-cart';
import { useFirestore } from '@/firebase'; 
import { collection, onSnapshot, query } from 'firebase/firestore'; 
import { Header } from '@/components/header';
import { MenuItemCard } from '@/components/menu-item-card';
import { CartSheet } from '@/components/cart-sheet';
import { CartIcon } from '@/components/cart-icon';
import type { MenuItem } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp } from 'lucide-react';
import { cn } from "@/lib/utils";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/getpik-digital.firebasestorage.app/o/dindigual_anandas_briyani%2FDAB_logo.webp?alt=media&token=2a082303-daa9-4187-89de-bbeefac2ceec";

const TimeBanner = () => {
  return (
    <div className="bg-card/50 border-b-2 border-accent/20 text-center py-3 backdrop-blur-sm sticky top-[77px] md:top-[88px] z-40">
      <div className="flex flex-col md:flex-row justify-center items-center gap-x-8 gap-y-2">
        <div className="flex items-center gap-3">
          <p className="text-xs font-black uppercase text-accent tracking-widest">Lunch (Biriyani & Meals):</p>
          <p className="text-sm font-bold text-white">12:00 PM – 4:00 PM</p>
        </div>
        <div className="hidden md:block h-6 w-px bg-accent/20" />
        <div className="flex items-center gap-3">
          <p className="text-xs font-black uppercase text-accent tracking-widest">Dinner (Biriyani & Tiffin):</p>
          <p className="text-sm font-bold text-white">6:30 PM – 10:30 PM</p>
        </div>
      </div>
    </div>
  );
};


export default function CustomerView({ tableId }: { tableId: string | null, mode: 'dine-in' | 'takeaway' }) {
  const { addToCart } = useCart();
  const [isCartOpen, setCartOpen] = useState(false);
  const firestore = useFirestore();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activePeriod, setActivePeriod] = useState<'lunch' | 'dinner' | 'other' | null>(null);

  useEffect(() => {
    // This effect runs only on the client
    const checkTime = () => {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      
      // Lunch: 12:00 PM to 4:00 PM (16:00)
      if (currentHour >= 12 && currentHour < 16) {
        setActivePeriod('lunch');
      } 
      // Dinner: 6:30 PM (18.5) to 10:30 PM (22.5)
      else if (currentHour >= 18.5 && currentHour < 22.5) {
        setActivePeriod('dinner');
      } 
      else {
        setActivePeriod('other');
      }
    };
    
    checkTime();
    const interval = setInterval(checkTime, 60000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, "menu_items")); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[];
      setMenuItems(items);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe(); 
  }, [firestore]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categorizedMenu = useMemo(() => {
    if (!activePeriod) return [];

    const lunchCategories = ['Main Course', 'Biryani & Rice'];
    const dinnerCategories = ['Starters', 'Appetizers', 'Puff\'s', 'Biryani & Rice'];

    const availableItems = menuItems.filter(item => {
      const category = item.category;
      const isTimeRestricted = [...lunchCategories, ...dinnerCategories].includes(category);
      
      if (!isTimeRestricted) return true; // Always show all-day items

      if (activePeriod === 'lunch' && lunchCategories.includes(category)) {
        return true;
      }
      if (activePeriod === 'dinner' && dinnerCategories.includes(category)) {
        return true;
      }

      return false; // Hide time-restricted items outside their window
    });

    const categoryOrder = ['Iftar Specials', 'Cinematic Combos', 'Combo', 'Specialties', 'Appetizers', 'Main Course', 'Biryani & Rice', 'Desserts', 'Beverages'];
    const grouped = availableItems.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);

    return Object.keys(grouped).sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    }).map(cat => ({ category: cat, items: grouped[cat] })).filter(group => group.items.length > 0);
  }, [menuItems, activePeriod]);

  if (loading || !activePeriod) {
    // You can return a loader here if you want
    return null; 
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      
      <Header tableId={tableId} onCartClick={() => setCartOpen(true)} timeLeft={0} />
      <TimeBanner />
      
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-24 relative z-20">
        <header className="mb-24 text-center">
          <h1 className="text-7xl md:text-[11rem] font-black text-white tracking-tighter uppercase italic leading-none animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Our <span className="text-accent">Menu</span>
          </h1>
        </header>

        <div className="space-y-40">
          {categorizedMenu.length > 0 ? categorizedMenu.map(({ category, items }) => (
            <section key={category} id={category} className="scroll-mt-52">
              <div className="flex flex-col gap-4 mb-16">
                <span className="text-accent/60 font-black text-[10px] uppercase tracking-[0.4em]">Experience</span>
                <div className="flex items-center gap-8">
                    <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                    {category}
                    </h3>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-accent/40 via-accent/10 to-transparent" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {items.map((item) => (
                  <MenuItemCard key={item.id} item={item} onAddToCart={addToCart} />
                ))}
              </div>
            </section>
          )) : (
            <div className="text-center py-20">
              <p className="text-2xl font-bold text-white/50">No items available at this time.</p>
              <p className="text-accent/80 mt-2">Please check our lunch and dinner timings.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-card/60 border-t border-white/5 py-32 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-12">
          <div className="h-28 w-28 rounded-full border-2 border-accent/30 p-1 bg-white">
            <Image src={LOGO_URL} alt="Dindigul Ananda's Briyani Logo" width={112} height={112} className="rounded-full object-cover" />
          </div>
          
          <div className="text-center space-y-8">
             <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-foreground/20">An Authentic Briyani Experience</p>
             </div>

             <Link 
              href="https://www.getpik.in/pos" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-4 group transition-all duration-500"
             >
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground/30 group-hover:text-accent transition-colors">
                  Digital Connect By
                </span>
                <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 group-hover:border-accent/50 group-hover:bg-accent/5 transition-all">
                  <span className="text-foreground font-black text-xl tracking-tighter group-hover:text-accent transition-colors">
                    GetPik
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_10px_hsl(var(--accent))]" />
                </div>
             </Link>
          </div>
        </div>
      </footer>

      <CartSheet isOpen={isCartOpen} onOpenChange={setCartOpen} tableId={tableId} />
      {!isCartOpen && <CartIcon onOpen={() => setCartOpen(true)} />}

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={cn(
          "fixed bottom-28 right-8 z-50 p-5 bg-accent text-accent-foreground rounded-full shadow-2xl transition-all duration-500 hover:scale-110",
          showBackToTop ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        )}
      >
        <ArrowUp size={24} strokeWidth={4} />
      </button>
    </div>
  );
}
