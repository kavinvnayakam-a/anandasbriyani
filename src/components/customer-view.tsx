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
import { ArrowUp, Moon, Star, MapPinOff, ShieldAlert, RefreshCcw, LocateFixed } from 'lucide-react';
import { cn, haversineDistance } from "@/lib/utils";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/dasara-finedine.firebasestorage.app/o/RAVOYI%20LOGO.pdf.webp?alt=media&token=f09f33b3-b303-400e-bbc4-b5dca418c8af";

const KITCHEN_COORDS = { lat: 17.35786972797417, lng: 78.54533232987296 };
const ALLOWED_RADIUS_METERS = 100;

const HangingDecoration = ({ className, delay = "0s", height = "h-32", type = "lantern" }: { className?: string, delay?: string, height?: string, type?: "lantern" | "moon" | "star" }) => (
  <div 
    className={cn("absolute flex flex-col items-center z-10", className)}
    style={{ animation: `sway 4s ease-in-out infinite alternate ${delay}` }}
  >
    <div className={cn("w-[1px] bg-gradient-to-b from-transparent via-orange-400 to-orange-300", height)} />
    
    {type === "lantern" && (
      <div className="relative w-7 h-10">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-4 bg-gradient-to-b from-amber-300 to-amber-500 rounded-t-full border border-amber-200" />
        <div className="w-full h-full bg-[#0c1a2b] rounded-sm border border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)] relative overflow-hidden">
          <div className="absolute inset-x-1 top-1 bottom-1 bg-gradient-to-t from-orange-600 via-orange-400 to-amber-200 rounded-t-full flex items-center justify-center">
             <div className="w-1.5 h-3 bg-white rounded-full blur-[2px] opacity-80 animate-pulse" />
          </div>
        </div>
        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-9 h-1.5 bg-amber-600 rounded-sm border-t border-amber-300" />
      </div>
    )}

    {type === "moon" && (
      <Moon size={48} className="text-amber-400 fill-amber-400/20 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
    )}

    {type === "star" && (
      <Star size={16} className="text-amber-300 fill-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
    )}
  </div>
);

type LocationStatus = 'checking' | 'authorized' | 'too-far' | 'denied' | 'error';

export default function CustomerView({ tableId }: { tableId: string | null, mode: 'dine-in' | 'takeaway' }) {
  const { addToCart } = useCart();
  const [isCartOpen, setCartOpen] = useState(false);
  const firestore = useFirestore();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('checking');

  const checkLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }

    setLocationStatus('checking');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const distance = haversineDistance(
          position.coords.latitude,
          position.coords.longitude,
          KITCHEN_COORDS.lat,
          KITCHEN_COORDS.lng
        );

        if (distance <= ALLOWED_RADIUS_METERS) {
          setLocationStatus('authorized');
        } else {
          setLocationStatus('too-far');
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied');
        } else {
          setLocationStatus('error');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    checkLocation();
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
    const categoryOrder = ['Iftar Specials', 'Cinematic Combos', 'Combo', 'Specialties', 'Appetizers', 'Main Course', 'Biryani', 'Desserts', 'Beverages'];
    const grouped = menuItems.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);

    return Object.keys(grouped).sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    }).map(cat => ({ category: cat, items: grouped[cat] }));
  }, [menuItems]);

  if (locationStatus === 'checking') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0500] text-white p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#b8582e]/20 via-transparent to-transparent opacity-40" />
        
        <div className="relative mb-12 flex flex-col items-center">
          <div className="relative p-1 rounded-full bg-white mb-8 shadow-2xl shadow-white/10 animate-pulse">
            <Image src={LOGO_URL} alt="RAVOYI" width={100} height={100} className="rounded-full" />
          </div>
          <LocateFixed className="w-12 h-12 text-orange-500 animate-[spin_3s_linear_infinite]" />
        </div>
        
        <h2 className="text-2xl font-black uppercase tracking-[0.3em] text-white italic text-center leading-none">Verifying Proximity</h2>
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em] mt-6 animate-pulse">Establishing Secure Session</p>
      </div>
    );
  }

  if (locationStatus === 'too-far') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0500] p-8 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent opacity-40" />
        
        <div className="relative z-10 bg-white/5 p-10 rounded-[3.5rem] border border-white/10 max-w-sm w-full shadow-2xl backdrop-blur-xl">
          <div className="relative p-1 rounded-full bg-white mx-auto mb-10 w-24 h-24 shadow-xl border-4 border-orange-500/20">
            <Image src={LOGO_URL} alt="RAVOYI" fill className="rounded-full object-contain p-2" />
          </div>
          
          <div className="bg-orange-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-8">
            <MapPinOff className="text-orange-500 w-8 h-8" />
          </div>
          
          <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-4">Out of Range</h2>
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.3em] leading-relaxed mb-10">
            Access restricted to customers within <span className="text-orange-500">100 meters</span> of RAVOYI Kitchen.
          </p>
          
          <button 
            onClick={checkLocation}
            className="w-full py-5 bg-[#b8582e] text-white rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-[#b8582e]/20"
          >
            <RefreshCcw size={18} /> Retry Verification
          </button>
        </div>
        
        <p className="fixed bottom-12 text-[8px] font-black uppercase tracking-[0.6em] text-white/20">RAVOYI • Authentically Telangana</p>
      </div>
    );
  }

  if (locationStatus === 'denied') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0500] p-8 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-500/10 via-transparent to-transparent opacity-40" />
        
        <div className="relative z-10 bg-white/5 p-10 rounded-[3.5rem] border border-white/10 max-w-sm w-full shadow-2xl backdrop-blur-xl">
          <div className="relative p-1 rounded-full bg-white mx-auto mb-10 w-24 h-24 shadow-xl border-4 border-rose-500/20">
            <Image src={LOGO_URL} alt="RAVOYI" fill className="rounded-full object-contain p-2" />
          </div>

          <div className="bg-rose-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShieldAlert className="text-rose-500 w-8 h-8" />
          </div>
          
          <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-4">Location Locked</h2>
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.3em] leading-relaxed mb-10">
            Please enable <span className="text-rose-500">Location Permissions</span> in your browser settings to continue.
          </p>
          
          <button 
            onClick={checkLocation}
            className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
          >
            <RefreshCcw size={18} /> Enable & Refresh
          </button>
        </div>
      </div>
    );
  }

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <style jsx global>{`
        @keyframes sway {
          0% { transform: rotate(-2.5deg); transform-origin: top center; }
          100% { transform: rotate(2.5deg); transform-origin: top center; }
        }
      `}</style>

      <Header tableId={tableId} onCartClick={() => setCartOpen(true)} timeLeft={0} />

      <div className="absolute top-20 left-0 w-full h-[400px] overflow-hidden pointer-events-none z-10">
        <HangingDecoration className="left-[10%]" height="h-32" type="moon" delay="0s" />
        <HangingDecoration className="left-[28%]" height="h-24" type="star" delay="1.2s" />
        <HangingDecoration className="left-[50%]" height="h-44" type="star" delay="0.6s" />
        <HangingDecoration className="right-[22%]" height="h-36" type="lantern" delay="2s" />
        <HangingDecoration className="right-[8%]" height="h-20" type="star" delay="1.5s" />
      </div>
      
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-24 relative z-20">
        <header className="mb-24 text-center">
          <h1 className="text-7xl md:text-[11rem] font-black text-white tracking-tighter uppercase italic leading-none animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Iftar <span className="text-orange-500">Specials</span>
          </h1>
        </header>

        <div className="space-y-40">
          {categorizedMenu.map(({ category, items }) => (
            <section key={category} id={category} className="scroll-mt-52">
              <div className="flex flex-col gap-4 mb-16">
                <span className="text-orange-500/60 font-black text-[10px] uppercase tracking-[0.4em]">Experience</span>
                <div className="flex items-center gap-8">
                    <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                    {category}
                    </h3>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-orange-500/40 via-orange-500/10 to-transparent" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {items.map((item) => (
                  <MenuItemCard key={item.id} item={item} onAddToCart={addToCart} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="bg-black/60 border-t border-white/5 py-32 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-12">
          <div className="h-28 w-28 rounded-full border-2 border-orange-500/30 p-1 bg-white">
            <Image src={LOGO_URL} alt="RAVOYI Logo" width={112} height={112} className="rounded-full" />
          </div>
          
          <div className="text-center space-y-8">
             <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20">A Telangana Kitchen Experience</p>
             </div>

             <Link 
              href="https://www.getpik.in/pos" 
              target="_blank" 
              className="flex flex-col items-center gap-4 group transition-all duration-500"
             >
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/30 group-hover:text-orange-500 transition-colors">
                  Digital Connect By
                </span>
                <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 group-hover:border-orange-500/50 group-hover:bg-orange-500/5 transition-all">
                  <span className="text-white font-black text-xl tracking-tighter group-hover:text-orange-500 transition-colors">
                    GetPik
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
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
          "fixed bottom-28 right-8 z-50 p-5 bg-orange-500 text-black rounded-full shadow-2xl transition-all duration-500 hover:scale-110",
          showBackToTop ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        )}
      >
        <ArrowUp size={24} strokeWidth={4} />
      </button>
    </div>
  );
}
