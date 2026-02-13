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
  X 
} from 'lucide-react';
import { cn } from "@/lib/utils";

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
    const categoryOrder = ['Dasara Specials', 'Starters', 'Biryani & Rice', 'Burgers and Sandwiches', 'Pasta\'s', 'Dessert', 'Beverages'];
    
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
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-600 rounded-full animate-spin" />
          <p className="mt-4 text-sm font-medium text-orange-400 animate-pulse tracking-widest uppercase">Dasara Fine Dine</p>
        </div>
      </div>
    );
  }

  if (!showMenu && !tableId) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full space-y-12 text-center">
          <div className="space-y-6">
            <div className="inline-block p-2 bg-white rounded-full shadow-sm ring-1 ring-black/5">
              <Image src="https://firebasestorage.googleapis.com/v0/b/swissdelights-2a272.firebasestorage.app/o/Dasara%20Fine%20Dine.jpg?alt=media&token=b7591bfd-13ee-4d28-b8c0-278f3662c5b7" alt="Logo" width={150} height={150} className="rounded-full" priority />
            </div>
            <h2 className="text-3xl font-serif italic text-slate-800">Flavors of tradition, <br/>served with love.</h2>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-orange-900/5 space-y-6 text-left border border-white">
            <div className="flex items-center gap-4 group">
              <div className="bg-orange-50 p-3 rounded-2xl text-orange-600 transition-colors">
                <MapPin size={20}/>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-tight">Location</p>
                <p className="font-semibold text-slate-700">L. B. Nagar, Hyderabad</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="bg-amber-50 p-3 rounded-2xl text-amber-600 transition-colors">
                <ClockIcon size={20}/>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-tight">Open Daily</p>
                <p className="font-semibold text-slate-700">24hrs Dining</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowMenu(true)}
            className="w-full bg-slate-900 text-white py-6 rounded-full font-bold shadow-2xl shadow-orange-200 flex items-center justify-center gap-3 hover:bg-orange-600 transition-all transform active:scale-95"
          >
            Explore Menu
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header tableId={tableId || "Takeaway"} onCartClick={() => setCartOpen(true)} timeLeft={timeLeft} />
      
      <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b border-orange-100 px-4 py-4 space-y-4">
        <div className="max-w-5xl mx-auto flex flex-col gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search for delicacies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-12 bg-orange-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-orange-500/20 transition-all outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-orange-200 rounded-full hover:bg-orange-300 transition-colors"
              >
                <X size={14} className="text-slate-600" />
              </button>
            )}
          </div>

          {!searchQuery && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {categorizedMenu.map(({ category }) => (
                <button
                  key={category}
                  onClick={() => {
                    document.getElementById(category)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setActiveCategory(category);
                  }}
                  className={cn(
                    "px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                    activeCategory === category 
                      ? "bg-slate-900 text-white shadow-lg" 
                      : "bg-orange-100 text-orange-600 hover:bg-orange-200"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-12 pb-40">
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-4xl font-serif italic text-slate-900">
            {searchQuery ? `Results for "${searchQuery}"` : "Dasara Fine Dine"}
          </h1>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
            <span className="w-8 h-[2px] bg-primary" />
            <p className="text-slate-400 font-medium text-xs uppercase tracking-widest">
              {tableId ? `Table ${tableId}` : 'Take-Away Experience'}
            </p>
          </div>
        </header>

        <div className="space-y-16">
          {categorizedMenu.length > 0 ? (
            categorizedMenu.map(({ category, items }) => (
              <section key={category} id={category} className="scroll-mt-48">
                <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-4">
                  {category}
                  <span className="h-px flex-1 bg-orange-100" />
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {items.map((item) => (
                    <div key={item.id}>
                      <MenuItemCard item={item} onAddToCart={addToCart} />
                    </div>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="inline-block p-6 bg-orange-50 rounded-full">
                <Search size={40} className="text-orange-200" />
              </div>
              <p className="text-slate-500 font-medium italic">No items found matching "{searchQuery}"</p>
              <button onClick={() => setSearchQuery("")} className="text-primary text-sm font-bold uppercase tracking-widest hover:underline">
                View Full Menu
              </button>
            </div>
          )}
        </div>
      </main>

      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-28 right-6 z-[60] p-4 bg-white border border-orange-100 shadow-2xl rounded-full text-slate-900 transition-all duration-500",
          showBackToTop ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-50"
        )}
      >
        <ArrowUp size={24} strokeWidth={2.5} />
      </button>

      <footer className="bg-white border-t border-orange-100 py-16 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-8">
          <Image 
            src="https://firebasestorage.googleapis.com/v0/b/swissdelights-2a272.firebasestorage.app/o/Dasara%20Fine%20Dine.jpg?alt=media&token=b7591bfd-13ee-4d28-b8c0-278f3662c5b7" 
            alt="Dasara Logo" 
            width={80} 
            height={80} 
            className="rounded-full opacity-80" 
          />
          <Link href="https://www.getpik.in/" target="_blank" className="flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Powered By</span>
            <div className="px-6 py-2 bg-orange-50 rounded-full border border-orange-100 flex items-center gap-2">
              <span className="text-slate-900 font-bold text-sm">GetPik</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </Link>
        </div>
      </footer>

      <CartSheet isOpen={isCartOpen} onOpenChange={setCartOpen} tableId={tableId} />
      <CartIcon onOpen={() => setCartOpen(true)} />
    </div>
  );
}