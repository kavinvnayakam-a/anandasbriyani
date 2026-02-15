
"use client"

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionTimer } from '@/hooks/use-session-timer';
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
  MapPin, 
  Clock as ClockIcon, 
  ChevronRight, 
  Search, 
  ArrowUp, 
  X,
  Heart,
  Film
} from 'lucide-react';
import { cn } from "@/lib/utils";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/dasara-finedine.firebasestorage.app/o/Art%20Cinemas%20Logo.jpeg?alt=media&token=0e8ee706-4ba1-458d-b2b9-d85434f8f2ba";

export default function CustomerView({ tableId }: { tableId: string | null, mode: 'dine-in' | 'takeaway' }) {
  const router = useRouter();
  const { clearCart, addToCart } = useCart();
  const [isCartOpen, setCartOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(!!tableId);
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

  const { timeLeft } = useSessionTimer(() => {
    clearCart();
    router.push('/thanks');
  });

  const categorizedMenu = useMemo(() => {
    const categoryOrder = ['Cinematic Specials', 'Popcorn & Snacks', 'Appetizers', 'Main Course', 'Desserts', 'Beverages'];
    
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
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
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
          <p className="mt-4 text-sm font-black text-primary animate-pulse tracking-widest uppercase">ART Cinemas</p>
        </div>
      </div>
    );
  }

  if (!showMenu && !tableId) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
        
        <div className="max-w-sm w-full space-y-12 text-center relative z-10">
          <div className="space-y-6">
            <div className="relative inline-block p-1 bg-primary rounded-full shadow-[0_0_50px_rgba(212,175,55,0.3)]">
              <Image src={LOGO_URL} alt="ART Cinemas Logo" width={100} height={100} className="rounded-full" priority />
            </div>
            <div className="space-y-2">
              <h2 className="text-5xl font-bold text-white leading-tight">Elite Cinema</h2>
              <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">Premium Culinary Experience</p>
            </div>
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl space-y-6 text-left border border-primary/10">
            <div className="flex items-center gap-4 group">
              <div className="bg-primary/10 p-3 rounded-2xl text-primary border border-primary/20">
                <MapPin size={20}/>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-primary/40 tracking-tight">Location</p>
                <p className="font-bold text-primary/90">Premium Cinema Lounge</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="bg-primary/10 p-3 rounded-2xl text-primary border border-primary/20">
                <ClockIcon size={20}/>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-primary/40 tracking-tight">Experience</p>
                <p className="font-bold text-primary/90">Curated Flavor Show</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowMenu(true)}
            className="w-full bg-primary text-black py-6 rounded-full font-black uppercase tracking-widest shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 hover:bg-white transition-all transform active:scale-95"
          >
            Explore Menu
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header tableId={tableId || "Takeaway"} onCartClick={() => setCartOpen(true)} timeLeft={timeLeft} />
      
      <div className="sticky top-20 z-30 bg-black/90 backdrop-blur-xl border-b border-primary/10 px-4 py-6 space-y-4">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Search cinematic treats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-14 pr-14 bg-zinc-900/50 border border-primary/10 rounded-full text-sm font-bold text-primary focus:ring-2 ring-primary/20 transition-all outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 bg-primary/20 rounded-full hover:bg-primary/30 transition-colors"
              >
                <X size={16} className="text-primary" />
              </button>
            )}
          </div>

          {!searchQuery && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 items-center">
              {categorizedMenu.map(({ category }) => (
                <button
                  key={category}
                  onClick={() => {
                    document.getElementById(category)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setActiveCategory(category);
                  }}
                  className={cn(
                    "shrink-0 px-6 py-2.5 rounded-full transition-all duration-300 font-bold uppercase tracking-widest text-[10px] border",
                    activeCategory === category 
                      ? "bg-primary text-black border-primary shadow-lg shadow-primary/20" 
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

      <main className="max-w-5xl mx-auto px-6 py-16 pb-40">
        <header className="mb-16 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic">
              {searchQuery ? `Searching...` : "The Menu"}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <span className="w-16 h-1 bg-primary rounded-full" />
              <p className="text-primary font-black text-xs uppercase tracking-[0.4em]">
                {tableId ? `Seat ${tableId}` : 'Cinema Take-Away'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-zinc-900/50 px-6 py-3 rounded-full border border-primary/10 shadow-xl">
             <Film className="text-primary" size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Premium Cinematic Dining</span>
          </div>
        </header>

        <div className="space-y-24">
          {categorizedMenu.length > 0 ? (
            categorizedMenu.map(({ category, items }) => (
              <section key={category} id={category} className="scroll-mt-64">
                <div className="flex items-center gap-8 mb-12">
                  <h3 className="text-2xl font-black italic uppercase tracking-widest text-primary shrink-0">
                    {category}
                  </h3>
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                  {items.map((item) => (
                    <MenuItemCard key={item.id} item={item} onAddToCart={addToCart} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="py-24 text-center space-y-8 bg-zinc-900/20 rounded-[4rem] border border-dashed border-primary/10">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                <div className="relative p-12 bg-zinc-900 rounded-full border border-primary/20 shadow-2xl">
                  <Search size={48} className="text-primary/10" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-white font-bold text-2xl">No items found</p>
                <p className="text-primary/40 text-sm font-bold uppercase tracking-widest">Try another search keyword</p>
              </div>
              <button 
                onClick={() => setSearchQuery("")} 
                className="inline-flex items-center gap-3 bg-primary text-black px-12 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg"
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
          "fixed bottom-28 right-8 z-[60] p-5 bg-zinc-900 border border-primary/30 shadow-2xl rounded-full text-primary transition-all duration-500 hover:bg-primary hover:text-black",
          showBackToTop ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-50"
        )}
      >
        <ArrowUp size={24} strokeWidth={4} />
      </button>

      <footer className="bg-zinc-950 border-t border-primary/10 py-24 px-8">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-12">
          <div className="relative p-1.5 bg-primary rounded-full shadow-2xl shadow-primary/20">
            <Image 
              src={LOGO_URL} 
              alt="ART Cinemas Logo" 
              width={72} 
              height={72} 
              className="rounded-full" 
            />
          </div>
          
          <div className="flex flex-col items-center gap-8 text-center">
             <div className="flex items-center gap-4">
               <span className="h-px w-10 bg-primary/20" />
               <p className="font-medium text-primary/40 text-sm tracking-wide">ELITE CINEMATIC DINING EXPERIENCE</p>
               <span className="h-px w-10 bg-primary/20" />
             </div>
             
             <Link href="https://www.getpik.in/" target="_blank" className="flex flex-col items-center gap-4 group">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/20 group-hover:text-primary transition-colors">Digital Experience By</span>
              <div className="px-12 py-5 bg-zinc-900 rounded-3xl border border-primary/10 flex items-center gap-5 transition-all group-hover:border-primary group-hover:bg-zinc-800 shadow-2xl">
                <span className="text-primary font-black text-2xl tracking-tighter">GetPik</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
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
