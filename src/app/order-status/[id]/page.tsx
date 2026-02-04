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
  Clock, 
  MessageCircleQuestion, 
  PlusCircle, 
  BellRing, 
  X, 
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  Heart,
  ShoppingBag
} from 'lucide-react';
import { cn } from "@/lib/utils";

export default function OrderStatusPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();

  // --- LOGIC STATES (Preserved) ---
  const [status, setStatus] = useState('Pending');
  const [orderData, setOrderData] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [helpLoading, setHelpLoading] = useState(false);
  const [showOrderMore, setShowOrderMore] = useState(false);
  const [fullMenu, setFullMenu] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(180);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastStatus = useRef<string>('Pending');

  // --- 1. PREVENT REFRESH & DISABLE BACK BUTTON ---
  useEffect(() => {
    // Disable Back Button
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };

    // Prevent Refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Are you sure? Your order session is active.";
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // --- 2. FIREBASE & TIMER LOGICS (Preserved) ---
  useEffect(() => {
    if (!firestore) return;
    const fetchMenu = async () => {
      setLoadingMenu(true);
      try {
        const querySnapshot = await getDocs(collection(firestore, "menu_items"));
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFullMenu(items);
        const categories = [...new Set(items.map(i => i.category || 'General'))];
        if (categories.length > 0) setExpandedCategories({ [categories[0]]: true });
      } finally { setLoadingMenu(false); }
    };
    fetchMenu();
  }, [firestore]);

  useEffect(() => {
    if (!isTimerRunning || !id) return;
    const timerKey = `end_timer_${id}`;
    let savedEndTime = localStorage.getItem(timerKey);
    if (!savedEndTime) {
      const newEndTime = (Date.now() + 180000).toString();
      localStorage.setItem(timerKey, newEndTime);
      savedEndTime = newEndTime;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((parseInt(savedEndTime!) - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        localStorage.removeItem(timerKey);
        router.push('/thanks'); 
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, id, router]);

  useEffect(() => {
    if (!id || !firestore) return;
    const unsub = onSnapshot(doc(firestore, "orders", id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data.status === 'Served' && !isTimerRunning) setIsTimerRunning(true);
        setStatus(data.status);
        setOrderData(data);
      }
    });
    return () => unsub();
  }, [id, firestore, isTimerRunning]);

  // --- 3. PASTRY RAIN GAME LOGIC ---
  useEffect(() => {
    if (!gameActive || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let basketX = canvas.width / 2;
    const pastries: any[] = [];
    const emojis = ["🥐", "🧁", "🥨", "🍩", "🍪"];
    let frame = 0;
    let animationId: number;

    const gameLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Basket
      ctx.font = "50px serif";
      ctx.textAlign = "center";
      ctx.fillText("🧺", basketX, canvas.height - 100);

      if (frame % 40 === 0) {
        pastries.push({ 
          x: Math.random() * (canvas.width - 60) + 30, 
          y: -50, 
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
          speed: 4 + Math.random() * 3 
        });
      }

      pastries.forEach((p, i) => {
        p.y += p.speed;
        ctx.font = "40px serif";
        ctx.fillText(p.emoji, p.x, p.y);

        // Catch check
        if (p.y > canvas.height - 130 && p.y < canvas.height - 80 && Math.abs(p.x - basketX) < 50) {
          setScore(s => s + 1);
          pastries.splice(i, 1);
        }
        // Miss check
        if (p.y > canvas.height) {
          setGameActive(false);
          setIsGameOver(true);
        }
      });

      frame++;
      animationId = requestAnimationFrame(gameLoop);
    };

    const handleMove = (e: any) => {
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      basketX = x;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });
    animationId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
    };
  }, [gameActive]);

  // --- 4. ACTION HANDLERS (Preserved) ---
  const addMoreFood = async (item: any) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, "orders", id), {
        items: arrayUnion({ name: item.name, quantity: 1, price: item.price, status: "Pending", addedAt: new Date().toISOString() }),
        totalPrice: increment(item.price),
        status: "Pending" 
      });
      setShowOrderMore(false);
    } catch (err) { console.error(err); }
  };

  const requestHelp = async () => {
    if (helpLoading || orderData?.helpRequested || !firestore) return;
    setHelpLoading(true);
    try { await updateDoc(doc(firestore, "orders", id), { helpRequested: true, helpRequestedAt: serverTimestamp() }); } 
    finally { setHelpLoading(false); }
  };

  const groupedMenu = fullMenu.reduce((acc: Record<string, any[]>, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    if (item.name.toLowerCase().includes(searchQuery.toLowerCase())) acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-[#FDFDFD] font-sans overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-40" />

      {/* HEADER: WHITE GLOSS PILL */}
      <div className={cn(
        "absolute top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 transition-all duration-700",
        gameActive ? "-translate-y-40 opacity-0" : "translate-y-0 opacity-100"
      )}>
        <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-[2.5rem] shadow-xl shadow-black/5 flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#b73538]">Order #{orderData?.orderNumber}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tbl {orderData?.tableId}</span>
          </div>
          
          <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#b73538] transition-all duration-1000"
              style={{ width: status === 'Pending' ? '30%' : status === 'Served' ? '100%' : '65%' }}
            />
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-tighter">
              {status === 'Pending' ? 'Wait Approval' : status === 'Served' ? 'Order Served' : 'Baking Delights'}
            </span>
            <Heart size={14} className="text-[#b73538] fill-[#b73538] animate-pulse" />
          </div>
        </div>
      </div>

      {/* BOTTOM ACTIONS: BRAND RED */}
      {!gameActive && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 flex gap-4">
          <button onClick={() => setShowOrderMore(true)} className="flex-1 bg-white h-16 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-black/5 border border-slate-100 active:scale-95 transition-all">
            <PlusCircle size={20} className="text-[#b73538]" />
            <span className="text-[11px] font-black uppercase tracking-widest">Order More</span>
          </button>
          
          <button onClick={requestHelp} className={cn(
            "flex-1 h-16 rounded-2xl flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95",
            orderData?.helpRequested ? 'bg-emerald-500 text-white' : 'bg-[#b73538] text-white shadow-red-900/10'
          )}>
            <BellRing size={20} />
            <span className="text-[11px] font-black uppercase tracking-widest">{orderData?.helpRequested ? 'Coming!' : 'Help'}</span>
          </button>
        </div>
      )}

      {/* GAME OVERLAYS */}
      {!gameActive && !showOrderMore && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#FDFDFD]/60 backdrop-blur-sm p-8">
          <div className="bg-white p-10 rounded-[4rem] shadow-2xl shadow-black/5 text-center space-y-8 max-w-sm border border-slate-50">
            <div className="text-7xl">{isGameOver ? "🥣" : "🥐"}</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif italic text-slate-800">Pastry Catch</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Don't let them touch the ground!</p>
            </div>
            <button 
              onClick={() => { setScore(0); setGameActive(true); setIsGameOver(false); }} 
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
            >
              {isGameOver ? "Play Again" : "Start Game"}
            </button>
          </div>
        </div>
      )}

      {/* GAME SCORE */}
      {gameActive && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
          <span className="text-7xl font-serif italic text-[#b73538] opacity-80">{score}</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Caught</span>
        </div>
      )}

      {/* ADD MORE POPUP (Boutique Theme) */}
      {showOrderMore && (
        <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end">
          <div className="w-full bg-[#FDFDFD] rounded-t-[3rem] p-8 border-t border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif italic text-slate-800">Extra Delights</h2>
              <button onClick={() => setShowOrderMore(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input type="text" placeholder="Search menu..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex-1 overflow-y-auto space-y-6 pb-10 no-scrollbar">
              {Object.keys(groupedMenu).map((cat) => (
                <div key={cat} className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-[#b73538] tracking-widest">{cat}</p>
                  {groupedMenu[cat].map((item: any) => (
                    <button key={item.id} onClick={() => addMoreFood(item)} className="w-full flex justify-between items-center p-5 bg-white border border-slate-50 rounded-2xl shadow-sm hover:ring-1 ring-[#b73538] transition-all">
                      <span className="text-sm font-bold text-slate-700">{item.name}</span>
                      <span className="text-xs font-black text-slate-400">₹{item.price}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}