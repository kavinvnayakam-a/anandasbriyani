
"use client"

import { useEffect, useState, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp, 
  arrayUnion, 
  increment,
  collection,
  getDocs
} from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';
import { 
  PlusCircle, 
  BellRing, 
  X, 
  Search,
  Film,
  Ticket,
  ChevronRight,
  Clock
} from 'lucide-react';
import { cn } from "@/lib/utils";
import Image from 'next/image';
import placeholderData from '@/app/lib/placeholder-images.json';
import { useSessionTimer } from '@/hooks/use-session-timer';
import SessionTimer from '@/components/session-timer';

export default function OrderStatusPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();

  const [status, setStatus] = useState('Pending');
  const [orderData, setOrderData] = useState<any>(null);
  const [helpLoading, setHelpLoading] = useState(false);
  const [showOrderMore, setShowOrderMore] = useState(false);
  const [fullMenu, setFullMenu] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastStatus = useRef<string>('');

  const { timeLeft } = useSessionTimer(() => {
    // Optional: Logic when the 3-min demo timer ends
    console.log("Session demo concluded");
  });

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  useEffect(() => {
    if (!id || !firestore) return;
    const unsub = onSnapshot(doc(firestore, "orders", id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (lastStatus.current && lastStatus.current !== data.status) {
          audioRef.current?.play().catch(() => {});
        }
        lastStatus.current = data.status;
        setStatus(data.status);
        setOrderData(data);
      }
    });
    return () => unsub();
  }, [id, firestore]);

  useEffect(() => {
    if (!firestore) return;
    const fetchMenu = async () => {
      const querySnapshot = await getDocs(collection(firestore, "menu_items"));
      setFullMenu(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchMenu();
  }, [firestore]);

  const addMoreFood = async (item: any) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, "orders", id), {
      items: arrayUnion({ name: item.name, quantity: 1, price: item.price, status: "Pending", addedAt: new Date().toISOString() }),
      totalPrice: increment(item.price),
      status: "Pending" 
    });
    setShowOrderMore(false);
  };

  const requestHelp = async () => {
    if (helpLoading || !firestore) return;
    setHelpLoading(true);
    await updateDoc(doc(firestore, "orders", id), { helpRequested: true, helpRequestedAt: serverTimestamp() });
    setHelpLoading(false);
  };

  const groupedMenu = fullMenu.reduce((acc: Record<string, any[]>, item) => {
    const cat = item.category || 'General';
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isAvailable = item.available !== false;

    if (matchesSearch && isAvailable) {
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
    }
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black font-sans overflow-hidden select-none">
      
      {/* Background Cinematic Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-30" />

      {/* Main Content Area (Scrollable part) */}
      <div className="absolute inset-0 overflow-y-auto pb-40 no-scrollbar">
        <div className="max-w-md mx-auto px-6 pt-12 space-y-10">
          
          {/* Order Status Header */}
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-primary/20 p-8 rounded-[2.5rem] shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex justify-between items-center relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Live Ticket</span>
                <span className="text-xl font-black italic uppercase text-white">#{orderData?.orderNumber}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                  <span className="text-[10px] font-black uppercase text-primary tracking-widest">{orderData?.tableId}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-black/40 rounded-full border border-primary/10 shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                  <SessionTimer timeLeft={timeLeft} />
                </div>
              </div>
            </div>

            <div className="relative h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                style={{ width: status === 'Pending' ? '30%' : status === 'Served' ? '100%' : '65%' }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {status === 'Pending' ? 'Theater Approval' : status === 'Served' ? 'Enjoy the show!' : 'Treats Incoming'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary uppercase italic">{status}</span>
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              </div>
            </div>
          </div>

          {/* Ad Banner */}
          <div className="relative group overflow-hidden rounded-[2rem] border border-primary/20 aspect-[2/1] bg-zinc-900 shadow-2xl">
            <Image 
              src={placeholderData.ads[0].url} 
              alt="Promotion" 
              fill 
              className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
              data-ai-hint={placeholderData.ads[0].hint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-1">ART Exclusive</p>
              <h4 className="text-lg font-black italic uppercase text-white tracking-tight leading-none">Upgrade to Gold Class</h4>
              <p className="text-[9px] font-bold text-zinc-400 uppercase mt-2">Visit the concierge for more details</p>
            </div>
          </div>

          {/* Upcoming Movies Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black italic uppercase tracking-widest text-white flex items-center gap-2">
                <Film size={16} className="text-primary" /> Coming Soon
              </h3>
              <button className="text-[9px] font-black uppercase text-primary tracking-widest flex items-center gap-1 hover:text-white transition-colors">
                View All <ChevronRight size={10} />
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
              {placeholderData.movies.map((movie) => (
                <div key={movie.id} className="shrink-0 w-40 space-y-3">
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-xl group">
                    <Image 
                      src={movie.url} 
                      alt={movie.title} 
                      fill 
                      className="object-cover transition-transform duration-500 group-hover:scale-110" 
                      data-ai-hint={movie.hint}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                    <div className="absolute top-2 right-2">
                       <div className="bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                          <Ticket size={12} className="text-primary" />
                       </div>
                    </div>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-center text-zinc-400 truncate px-1">
                    {movie.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 flex gap-4">
        <button 
          onClick={() => setShowOrderMore(true)} 
          className="flex-1 bg-zinc-900 h-16 rounded-2xl flex items-center justify-center gap-3 shadow-2xl border border-primary/20 hover:border-primary/50 transition-all active:scale-95"
        >
          <PlusCircle size={20} className="text-primary" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">More Snacks</span>
        </button>
        <button 
          onClick={requestHelp} 
          className={cn(
            "flex-1 h-16 rounded-2xl flex items-center justify-center gap-3 shadow-2xl transition-all border border-transparent active:scale-95",
            orderData?.helpRequested ? 'bg-emerald-600 text-white' : 'bg-primary text-black hover:bg-white'
          )}
        >
          <BellRing size={20} className={cn(orderData?.helpRequested && "animate-ring")} />
          <span className="text-[11px] font-black uppercase tracking-[0.2em]">
            {orderData?.helpRequested ? 'Help Coming' : 'Call Staff'}
          </span>
        </button>
      </div>

      {/* Order More Slide-up Menu */}
      {showOrderMore && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end animate-in fade-in duration-300">
          <div className="w-full bg-zinc-950 rounded-t-[3rem] p-8 border-t border-primary/20 max-h-[85vh] flex flex-col shadow-[0_-20px_50px_rgba(212,175,55,0.1)]">
            <div className="flex justify-between items-center mb-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-1">Menu</span>
                <h2 className="text-2xl font-black italic uppercase text-white">Cinema Specials</h2>
              </div>
              <button 
                onClick={() => setShowOrderMore(false)} 
                className="p-3 bg-zinc-900 text-primary rounded-full hover:bg-primary hover:text-black transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="relative mb-8">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40" size={18} />
              <input 
                type="text" 
                placeholder="Search cinema menu..." 
                className="w-full pl-14 pr-6 py-5 bg-zinc-900/50 border border-primary/10 rounded-2xl text-sm font-bold text-white outline-none focus:ring-2 ring-primary/20 transition-all" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pb-10 no-scrollbar">
              {Object.keys(groupedMenu).length > 0 ? (
                Object.keys(groupedMenu).map((cat) => (
                  <div key={cat} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <p className="text-[10px] font-black uppercase text-primary tracking-[0.3em] shrink-0">{cat}</p>
                      <div className="h-px flex-1 bg-primary/10" />
                    </div>
                    {groupedMenu[cat].map((item: any) => (
                      <button 
                        key={item.id} 
                        onClick={() => addMoreFood(item)} 
                        className="w-full flex justify-between items-center p-6 bg-zinc-900/30 border border-primary/5 hover:border-primary/20 rounded-[1.5rem] transition-all active:scale-95 text-left group"
                      >
                        <span className="text-sm font-bold text-zinc-100 group-hover:text-primary transition-colors">{item.name}</span>
                        <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-lg">₹{item.price}</span>
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <p className="text-xs font-black text-zinc-600 uppercase tracking-widest">No treats found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
