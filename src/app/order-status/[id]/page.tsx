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
  Heart,
  Film
} from 'lucide-react';
import { cn } from "@/lib/utils";

export default function OrderStatusPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();

  const [status, setStatus] = useState('Pending');
  const [orderData, setOrderData] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [helpLoading, setHelpLoading] = useState(false);
  const [showOrderMore, setShowOrderMore] = useState(false);
  const [fullMenu, setFullMenu] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeLeft, setTimeLeft] = useState(180);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastStatus = useRef<string>('');

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
        if (data.status === 'Served' && !isTimerRunning) {
          setIsTimerRunning(true);
        }
        setStatus(data.status);
        setOrderData(data);
      }
    });
    return () => unsub();
  }, [id, firestore, isTimerRunning]);

  useEffect(() => {
    if (!isTimerRunning || !id) return;
    const timerKey = `expiry_${id}`;
    let expiryTime = localStorage.getItem(timerKey);
    if (!expiryTime) {
      expiryTime = (Date.now() + 180000).toString();
      localStorage.setItem(timerKey, expiryTime);
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((parseInt(expiryTime!) - Date.now()) / 1000));
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
    if (!gameActive || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let basketX = canvas.width / 2;
    const items: any[] = [];
    const emojis = ["🍿", "🥤", "🍔", "🍫", "🍕"];
    let frame = 0;
    let animationId: number;

    const gameLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(0,0,0,0.1)";
      ctx.font = "60px serif";
      ctx.textAlign = "center";
      ctx.fillText("🍿", basketX, canvas.height - 100);

      if (frame % 60 === 0) {
        items.push({ 
          x: Math.random() * (canvas.width - 60) + 30, 
          y: -50, 
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
          speed: 2 + Math.random() * 2 
        });
      }

      items.forEach((p, i) => {
        p.y += p.speed;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(234, 88, 12, 0.3)";
        ctx.font = "50px serif";
        ctx.fillText(p.emoji, p.x, p.y);

        if (p.y > canvas.height - 140 && p.y < canvas.height - 70 && Math.abs(p.x - basketX) < 60) {
          setScore(s => s + 1);
          items.splice(i, 1);
        }
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
    <div className="fixed inset-0 bg-orange-50/30 font-sans overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 opacity-100" />

      {isTimerRunning && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl scale-90">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Session ends in:</span>
          <span className="font-mono font-bold text-primary">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>
      )}

      <div className={cn(
        "absolute top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 transition-all duration-700",
        gameActive ? "-translate-y-40 opacity-0" : "translate-y-0 opacity-100"
      )}>
        <div className="bg-white/80 backdrop-blur-xl border border-orange-100 p-6 rounded-[2.5rem] shadow-xl shadow-orange-900/5 flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Order #{orderData?.orderNumber}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seat {orderData?.tableId}</span>
          </div>
          <div className="relative h-4 w-full bg-orange-100/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: status === 'Pending' ? '30%' : status === 'Served' ? '100%' : '65%' }}
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase">
              {status === 'Pending' ? 'Theater Approval' : status === 'Served' ? 'Snacks Served!' : 'Preparing Treats'}
            </span>
            <Heart size={14} className="text-primary fill-primary animate-pulse" />
          </div>
        </div>
      </div>

      {!gameActive && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 flex gap-4">
          <button onClick={() => setShowOrderMore(true)} className="flex-1 bg-white h-16 rounded-2xl flex items-center justify-center gap-2 shadow-xl border border-orange-50">
            <PlusCircle size={20} className="text-primary" />
            <span className="text-[11px] font-black uppercase tracking-widest">More Snacks</span>
          </button>
          <button onClick={requestHelp} className={cn(
            "flex-1 h-16 rounded-2xl flex items-center justify-center gap-2 shadow-xl transition-all",
            orderData?.helpRequested ? 'bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-orange-600'
          )}>
            <BellRing size={20} />
            <span className="text-[11px] font-black uppercase tracking-widest">{orderData?.helpRequested ? 'Coming!' : 'Call Staff'}</span>
          </button>
        </div>
      )}

      {!gameActive && !showOrderMore && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-orange-50/40 backdrop-blur-sm p-8">
          <div className="bg-white p-10 rounded-[4rem] shadow-2xl text-center space-y-8 max-w-sm border border-orange-100">
            <div className="text-7xl">{isGameOver ? "🎥" : "🍿"}</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif italic text-slate-800">Popcorn Catch</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catch the ART Cinemas treats!</p>
            </div>
            <button 
              onClick={() => { setScore(0); setGameActive(true); setIsGameOver(false); }} 
              className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-orange-600 transition-all"
            >
              {isGameOver ? "Play Again" : "Start Game"}
            </button>
          </div>
        </div>
      )}

      {gameActive && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-none">
          <span className="text-8xl font-serif italic text-primary drop-shadow-lg">{score}</span>
        </div>
      )}

      {showOrderMore && (
        <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end">
          <div className="w-full bg-white rounded-t-[3rem] p-8 border-t border-orange-100 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif italic text-slate-800">Cinema Specials</h2>
              <button onClick={() => setShowOrderMore(false)} className="p-2 bg-orange-50 rounded-full"><X size={20} /></button>
            </div>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text" 
                placeholder="Search cinema menu..." 
                className="w-full pl-12 pr-4 py-4 bg-orange-50/50 border-none rounded-2xl text-sm outline-none" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-6 pb-10">
              {Object.keys(groupedMenu).length > 0 ? (
                Object.keys(groupedMenu).map((cat) => (
                  <div key={cat} className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest">{cat}</p>
                    {groupedMenu[cat].map((item: any) => (
                      <button key={item.id} onClick={() => addMoreFood(item)} className="w-full flex justify-between items-center p-5 bg-white border border-orange-50 rounded-2xl shadow-sm active:scale-95 transition-all">
                        <span className="text-sm font-bold text-slate-700">{item.name}</span>
                        <span className="text-xs font-black text-slate-400">₹{item.price}</span>
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No treats found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
