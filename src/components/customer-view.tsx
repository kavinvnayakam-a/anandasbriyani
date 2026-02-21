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
import { 
  Search, 
  ArrowUp, 
  X,
  ChefHat,
  Flame
} from 'lucide-react';
import { cn } from "@/lib/utils";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/dasara-finedine.firebasestorage.app/o/RAVOYI%20LOGO.pdf.webp?alt=media&token=f09f33b3-b303-400e-bbc4-b5dca418c8af";

export default function CustomerView({ tableId }: { tableId: string | null, mode: 'dine-in' | 'takeaway' }) {
  const { addToCart } = useCart();
  const [isCartOpen, setCartOpen] = useState(false);
  const firestore = useFirestore();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, "menu_items")); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MenuItem[];
      setMenuItems(items);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe(); 
  }, [firestore]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categorizedMenu = useMemo(() => {
    const categoryOrder = ['Cinematic Combos', 'Combo', 'Specialties', 'Appetizers', 'Main Course', 'Biryani', 'Desserts', 'Beverages'];
    
    const filtered = menuItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const grouped = filtered.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);

    return Object.keys(grouped).sort((a, b) => {
      const indexA = categoryOrder.findIndex(cat => a.toLowerCase().includes(cat.toLowerCase()));
      const indexB = categoryOrder.findIndex(cat => b.toLowerCase().includes(cat.toLowerCase()));
      
      const posA = indexA === -1 ? 999 : indexA;
      const posB = indexB === -1 ? 999 : indexB;
      
      return posA - posB;
    }).map(cat => ({ category: cat, items: grouped[cat] }));
  }, [menuItems, searchQuery]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="mt-4 text-sm font-black text-primary animate-pulse tracking-widest uppercase">RAVOYI</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <Header tableId={tableId} onCartClick={() => setCartOpen(true)} timeLeft={0} />
      
      <div className="sticky top-20 z-30 bg-black/95 backdrop-blur-xl border-b border-primary/10 px-4 py-4 md:py-6 space-y-4">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search kitchen specialties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 md:h-14 pl-12 pr-12 bg-zinc-900/50 border border-primary/10 rounded-full text-xs md:text-sm font-bold text-primary focus:ring-2 ring-primary/20 transition-all outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-primary/20 rounded-full hover:bg-primary/30 transition-colors"
              >
                <X size={14} className="text-primary" />
              </button>
            )}
          </div>

          {!searchQuery && (
            <div className="flex flex-wrap gap-2 md:gap-3 items-center justify-start md:justify-center">
              {categorizedMenu.map(({ category }) => (
                <button
                  key={category}
                  onClick={() => {
                    document.getElementById(category)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setActiveCategory(category);
                  }}
                  className={cn(
                    "shrink-0 px-4 md:px-6 py-2 rounded-full transition-all duration-300 font-bold uppercase tracking-widest text-[8px] md:text-[10px] border",
                    activeCategory === category 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                      : "bg-transparent text-primary/60 border-primary/20 hover:border-primary/40 hover:text-primary"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-16 pb-40">
        <header className="mb-8 md:mb-16 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 md:space-y-4">
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase italic">
              {searchQuery ? `Searching...` : "Kitchen Menu"}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <span className="w-12 md:w-16 h-1 bg-primary rounded-full" />
              <p className="text-primary font-black text-[10px] md:text-xs uppercase tracking-[0.4em]">
                A Telangana Kitchen
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-3 bg-zinc-900/50 px-4 md:px-6 py-2 md:py-3 rounded-full border border-primary/10 shadow-xl">
             <ChefHat className="text-primary" size={14} />
             <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary/60">Authentic Flavors</span>
          </div>
        </header>

        <div className="space-y-16 md:space-y-24">
          {categorizedMenu.length > 0 ? (
            categorizedMenu.map(({ category, items }) => (
              <section key={category} id={category} className="scroll-mt-64 md:scroll-mt-72">
                <div className="flex items-center gap-4 md:gap-8 mb-8 md:mb-12">
                  <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-widest text-primary shrink-0">
                    {category}
                  </h3>
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                  {items.map((item) => (
                    <MenuItemCard key={item.id} item={item} onAddToCart={addToCart} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="py-16 md:py-24 text-center space-y-8 bg-zinc-900/20 rounded-[2rem] md:rounded-[4rem] border border-dashed border-primary/10">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                <div className="relative p-8 md:p-12 bg-zinc-900 rounded-full border border-primary/20 shadow-2xl">
                  <Search className="w-8 h-8 md:w-12 md:h-12 text-primary/10" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-white font-bold text-xl md:text-2xl">No items found</p>
                <p className="text-primary/40 text-[10px] md:text-sm font-bold uppercase tracking-widest">Try another search keyword</p>
              </div>
              <button 
                onClick={() => setSearchQuery("")} 
                className="inline-flex items-center gap-3 bg-primary text-white px-8 md:px-12 py-3 md:py-4 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-white hover:text-primary transition-all shadow-lg"
              >
                Clear Search <X size={14} />
              </button>
            </div>
          )}
        </div>
      </main>

      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-24 md:bottom-28 right-6 md:right-8 z-[60] p-4 md:p-5 bg-zinc-900 border border-primary/30 shadow-2xl rounded-full text-primary transition-all duration-500 hover:bg-primary hover:text-white",
          showBackToTop ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-50"
        )}
      >
        <ArrowUp className="w-5 h-5 md:w-6 md:h-6" strokeWidth={4} />
      </button>

      <footer className="bg-zinc-950 border-t border-primary/10 py-16 md:py-24 px-6 md:px-8">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-8 md:gap-12">
          <div className="relative p-2 bg-white rounded-full ravoyi-highlight">
            <Image 
              src={LOGO_URL} 
              alt="RAVOYI Logo" 
              width={80} 
              height={80} 
              className="rounded-full" 
            />
          </div>
          
          <div className="flex flex-col items-center gap-6 md:gap-8 text-center">
             <div className="flex items-center gap-3 md:gap-4">
               <span className="h-px w-8 md:w-10 bg-primary/20" />
               <p className="font-medium text-primary/40 text-[10px] md:text-sm tracking-wide">A TELANGANA KITCHEN EXPERIENCE</p>
               <span className="h-px w-8 md:w-10 bg-primary/20" />
             </div>
             
             <Link href="https://www.getpik.in/" target="_blank" className="flex flex-col items-center gap-4 group">
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.5em] text-primary/20 group-hover:text-primary transition-colors">Digital Experience By</span>
              <div className="px-8 md:px-12 py-4 md:py-5 bg-zinc-900 rounded-2xl md:rounded-3xl border border-primary/10 flex items-center gap-4 transition-all group-hover:border-primary group-hover:bg-zinc-800 shadow-2xl">
                <span className="text-primary font-black text-xl md:text-2xl tracking-tighter">GetPik</span>
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>
            </Link>
          </div>
        </div>
      </footer>

      <CartSheet isOpen={isCartOpen} onOpenChange={setCartOpen} tableId={tableId} />
      <CartIcon onOpen={() => setCartOpen(true)} />
    </div>
  );
}