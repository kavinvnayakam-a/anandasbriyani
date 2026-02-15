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
  Heart
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
            <div className="relative inline-block p-1 bg-primary rounded-full shadow-[0_0_50px_rgba(212,175,55,0.2)]">
              <Image src={LOGO_URL} alt="ART Cinemas Logo" width={100} height={100} className="rounded-full" priority />
            </div>
            <div className="space-y-2">
              <h2 className="text-5xl font-serif italic text-white leading-tight">Elite Cinema,</h2>
              <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">Premium Culinary Theater</p>
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
            className="w-full bg-primary text-black py-6 rounded-full font-black uppercase tracking-widest shadow-[0_0_30px_rgba(212,175,55,0.2)] flex items-center justify-center gap-3 hover:bg-white transition-all transform active:scale-95"
          >
            Enter The Show
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header tableId={tableId || "Takeaway"} onCartClick={() => setCartOpen(true)} timeLeft={timeLeft} />
      
      <div className="sticky top-16 z-30 bg-black/80 backdrop-blur-md border-b border-primary/10 px-4 py-4 space-y-4 shadow-2xl">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search cinematic treats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-12 bg-zinc-900/50 border border-primary/10 rounded-2xl text-sm font-bold text-primary focus:ring-2 ring-primary/20 transition-all outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-primary/20 rounded-full hover:bg-primary/30 transition-colors"
              >
                <X size={14} className="text-primary" />
              </button>
            )}
          </div>

          {!searchQuery && (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 items-center">
              {categorizedMenu.map(({ category }) => (
                <button
                  key={category}
                  onClick={() => {
                    document.getElementById(category)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setActiveCategory(category);
                  }}
                  className="relative group shrink-0"
                >
                  <div className={cn(
                    "dasara-banner relative z-10 px-8 py-3 transition-all duration-300",
                    activeCategory === category 
                      ? "bg-primary text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]" 
                      : "bg-zinc-900 text-primary border border-primary/20 hover:bg-zinc-800"
                  )}>
                    <span className="font-serif italic text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
                      {category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-12 pb-40">
        <header className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-6xl font-serif italic text-white tracking-tighter">
              {searchQuery ? `Searching "${searchQuery}"` : "Feature Menu"}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
              <span className="w-12 h-[1px] bg-primary" />
              <p className="text-primary font-black text-[10px] uppercase tracking-[0.4em]">
                {tableId ? `Theater Seat ${tableId}` : 'Cinema Take-Away'}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-full border border-primary/10 shadow-lg">
             <Heart className="text-primary fill-primary animate-pulse" size={14} />
             <span className="text-[9px] font-black uppercase tracking-widest text-primary/40">Premium Cinematic Dining</span>
          </div>
        </header>

        <div className="space-y-20">
          {categorizedMenu.length > 0 ? (
            categorizedMenu.map(({ category, items }) => (
              <section key={category} id={category} className="scroll-mt-48">
                <div className="flex items-center gap-6 mb-12">
                  <div className="dasara-banner bg-primary px-12 py-4 text-black shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                    <h3 className="text-xs font-serif italic font-black uppercase tracking-[0.3em]">
                      {category}
                    </h3>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                  {items.map((item) => (
                    <MenuItemCard key={item.id} item={item} onAddToCart={addToCart} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="py-20 text-center space-y-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                <div className="relative p-12 bg-zinc-900 rounded-full border border-primary/10 shadow-2xl">
                  <Search size={48} className="text-primary/20" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-white font-bold text-xl">No feature found</p>
                <p className="text-primary/40 text-xs font-black uppercase tracking-widest italic">Try searching another treat</p>
              </div>
              <button 
                onClick={() => setSearchQuery("")} 
                className="inline-flex items-center gap-2 bg-primary text-black px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white transition-all"
              >
                Reset Menu <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </main>

      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-28 right-6 z-[60] p-4 bg-zinc-900 border border-primary/30 shadow-[0_0_20px_rgba(212,175,55,0.3)] rounded-full text-primary transition-all duration-500 hover:bg-primary hover:text-black",
          showBackToTop ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-50"
        )}
      >
        <ArrowUp size={24} strokeWidth={3} />
      </button>

      <footer className="bg-black border-t border-primary/10 py-20 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-10">
          <div className="relative p-1 bg-primary rounded-full shadow-[0_0_40px_rgba(212,175,55,0.2)]">
            <Image 
              src={LOGO_URL} 
              alt="ART Cinemas Logo" 
              width={64} 
              height={64} 
              className="rounded-full" 
            />
          </div>
          
          <div className="flex flex-col items-center gap-6">
             <div className="flex items-center gap-3">
               <span className="h-[1px] w-8 bg-primary/20" />
               <p className="font-serif italic text-primary/40 text-sm">Finely curated cinematic dining experience.</p>
               <span className="h-[1px] w-8 bg-primary/20" />
             </div>
             
             <Link href="https://www.getpik.in/" target="_blank" className="flex flex-col items-center gap-3 group mt-4">
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-primary/20 group-hover:text-primary transition-colors">Experience By</span>
              <div className="px-10 py-4 bg-zinc-900 rounded-2xl border border-primary/10 flex items-center gap-4 transition-all group-hover:border-primary group-hover:bg-zinc-800 shadow-xl">
                <span className="text-primary font-black text-lg tracking-tighter">GetPik</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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