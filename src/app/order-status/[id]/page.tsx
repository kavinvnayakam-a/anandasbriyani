"use client"

import { useEffect, useState, useRef } from 'react';
import { db } from '@/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';
import { ChefHat, CheckCircle2, Timer, Zap, Play, Clock, Hash, Utensils, ChevronDown, ChevronUp } from 'lucide-react';

interface GrillPipe {
  x: number;
  top: number;
  bottom: number;
  passed: boolean;
}

export default function OrderStatusPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // UI & Game State
  const [status, setStatus] = useState('Pending');
  const [orderData, setOrderData] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [isGrilled, setIsGrilled] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(180); 
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- NEW: SOUND & COLLAPSE STATE ---
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastStatus = useRef<string>('Pending');

  // --- 1. GLOBAL REFRESH & BACK NAVIGATION LOCK ---
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => window.history.pushState(null, "", window.location.href);
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Warning: Refreshing will reset your game score!";
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // --- 2. FIREBASE REAL-TIME SYNC + SOUND TRIGGER ---
  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "orders", id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        
        // Trigger sound if status changes to Ready
        if (data.status === 'Ready' && lastStatus.current !== 'Ready') {
          playNotification();
          if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
        }
        
        lastStatus.current = data.status;
        setStatus(data.status);
        setOrderData(data);
        
        if (data.status === 'Ready') setIsTimerRunning(true);
        if (data.status === 'Served') {
          localStorage.removeItem(`grill_timer_${id}`);
          router.push('/thanks'); 
        }
      }
    });
    return () => unsub();
  }, [id, router]);

  // --- 3. REFRESH-PROOF PERSISTENT TIMER ---
  useEffect(() => {
    if (!isTimerRunning || !id) return;
    const timerKey = `grill_timer_${id}`;
    let savedEndTime = localStorage.getItem(timerKey);
    if (!savedEndTime) {
      const newEndTime = (Date.now() + 180000).toString();
      localStorage.setItem(timerKey, newEndTime);
      savedEndTime = newEndTime;
    }
    const timerInterval = setInterval(() => {
      const now = Date.now();
      const end = parseInt(savedEndTime!);
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerInterval);
        localStorage.removeItem(timerKey);
        router.push('/thanks');
      }
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [isTimerRunning, id]);

  // --- SOUND LOGIC ---
  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play blocked", e));
    }
  };

  const startAndUnmute = () => {
    // Unmute/Unlock audio context on user click
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
        audioRef.current!.currentTime = 0;
      });
    }
    setIsMuted(false);
    setScore(0);
    setGameActive(true);
    setIsGrilled(false);
  };

  // --- 4. FLAPPY CHICKEN GAME LOGIC ---
  useEffect(() => {
    if (!gameActive || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationFrameId: number;
    let birdY = canvas.height / 2;
    let velocity = 0;
    const gravity = 0.25; 
    const lift = -6;      
    let pipes: GrillPipe[] = [];
    let frameCount = 0;
    const birdX = 80;

    const gameLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#18181b"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      velocity += gravity;
      birdY += velocity;
      ctx.font = "45px serif";
      ctx.textAlign = "center";
      ctx.fillText(gameActive ? "🐔" : "🍗", birdX, birdY);

      if (frameCount % 120 === 0) { 
        const gap = 240; 
        const top = Math.random() * (canvas.height - gap - 100) + 50;
        pipes.push({ x: canvas.width, top, bottom: top + gap, passed: false });
      }

      pipes.forEach((p) => {
        p.x -= 2.5; 
        ctx.fillStyle = "#d4af37";
        ctx.fillRect(p.x, 0, 60, p.top);
        ctx.fillRect(p.x, p.bottom, 60, canvas.height - p.bottom);
        
        if (birdX + 20 > p.x && birdX - 20 < p.x + 60) {
          if (birdY - 20 < p.top || birdY + 20 > p.bottom) {
            setGameActive(false);
            setIsGrilled(true);
            if ("vibrate" in navigator) navigator.vibrate(100);
          }
        }
        
        if (!p.passed && p.x + 60 < birdX) {
          setScore(prev => prev + 1);
          p.passed = true;
        }
      });

      if (birdY > canvas.height || birdY < 0) {
        setGameActive(false);
        setIsGrilled(true);
      }

      pipes = pipes.filter(p => p.x > -100);
      frameCount++;
      animationFrameId = window.requestAnimationFrame(gameLoop);
    };

    const handleJump = (e: any) => { 
      e.preventDefault(); 
      if(gameActive) velocity = lift; 
    };

    window.addEventListener('touchstart', handleJump, { passive: false });
    window.addEventListener('mousedown', handleJump);
    animationFrameId = window.requestAnimationFrame(gameLoop);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('touchstart', handleJump);
      window.removeEventListener('mousedown', handleJump);
    };
  }, [gameActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-zinc-900 font-sans overflow-hidden touch-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      {/* Hidden Audio Element - Use a high-quality 'Ding' or notification sound URL */}
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      {/* --- COLLAPSIBLE HEADER --- */}
      <div className={`absolute top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 flex flex-col gap-4 transition-all duration-700 transform ${gameActive ? '-translate-y-[150%] opacity-0' : 'translate-y-0 opacity-100'}`}>
        
        <div className="flex gap-2">
          <div className="flex-1 bg-white border-4 border-zinc-900 rounded-[1.5rem] p-4 flex flex-col items-center justify-center shadow-[4px_4px_0_0_#d4af37]">
            <p className="text-[10px] font-black uppercase text-zinc-400 leading-none mb-1">Table</p>
            <p className="text-3xl font-black italic text-zinc-900 leading-none">
              {orderData?.tableId === 'Takeaway' ? 'TK' : orderData?.tableId}
            </p>
          </div>
          <div className="flex-[2] bg-zinc-900 border-4 border-[#d4af37] rounded-[1.5rem] p-4 flex flex-col items-center justify-center shadow-[4px_4px_0_0_#000]">
            <p className="text-[10px] font-black uppercase text-[#d4af37]/50 leading-none mb-1 text-center">Order Number</p>
            <p className="text-3xl font-black italic text-[#d4af37] leading-none tracking-tighter">
              #{orderData?.orderNumber || '0000'}
            </p>
          </div>
        </div>

        {/* PROGRESS BAR SECTION */}
        <div className="bg-zinc-900/90 backdrop-blur-md border-4 border-zinc-900 rounded-[2.5rem] p-4 shadow-2xl">
          <div className="relative h-14 w-full bg-zinc-800 rounded-2xl overflow-hidden flex items-center border-2 border-zinc-700">
            <div 
              className={`h-full transition-all duration-1000 ${
                status === 'Pending' ? 'bg-rose-500' : status === 'Received' ? 'bg-[#d4af37]' : 'bg-emerald-500'
              }`}
              style={{ width: status === 'Pending' ? '30%' : status === 'Received' ? '65%' : '100%' }}
            />
            <div className="absolute inset-0 flex items-center justify-center gap-3">
              <span className="text-white">
                {status === 'Pending' ? <Timer className="animate-spin" size={20}/> : 
                 status === 'Received' ? <ChefHat className="animate-bounce" size={20}/> : 
                 <CheckCircle2 size={20}/>}
              </span>
              <span className="text-sm font-black uppercase italic text-white drop-shadow-md">
                {status === 'Pending' ? 'Waiting Approval' : 
                 status === 'Received' ? 'Kitchen Grilling' : 
                 'FOOD READY!'}
              </span>
            </div>
          </div>

          {status === 'Ready' && (
            <div className="mt-3 flex items-center justify-center gap-2 bg-emerald-500/10 py-2 rounded-xl border border-emerald-500/20 animate-pulse">
               <Clock size={14} className="text-emerald-500"/>
               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                 Auto-close in {formatTime(timeLeft)}
               </span>
            </div>
          )}
        </div>
      </div>

      {/* --- GAME OVERLAY --- */}
      {!gameActive && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-8">
          <div className="bg-white border-8 border-zinc-900 p-8 rounded-[4rem] shadow-[15px_15px_0_0_#d4af37] text-center space-y-6 max-w-sm animate-in zoom-in-95 duration-300">
            {isGrilled ? <div className="text-8xl">🍗</div> : <div className="text-8xl animate-bounce">🐔</div>}
            
            <div className="space-y-2">
              <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none text-zinc-900">
                GRILL HOP
              </h2>
              <div className="flex items-center justify-center gap-2 bg-zinc-100 py-2 px-4 rounded-2xl border-2 border-zinc-200">
                <Hash size={14} className="text-[#d4af37]"/>
                <p className="text-zinc-900 font-black uppercase text-xl italic leading-none">
                  {orderData?.orderNumber}
                </p>
                <div className="w-1 h-4 bg-zinc-300 mx-1" />
                <Utensils size={14} className="text-[#d4af37]"/>
                <p className="text-zinc-900 font-black uppercase text-xl italic leading-none">
                  T-{orderData?.tableId}
                </p>
              </div>
            </div>
            
            <button 
              onClick={startAndUnmute}
              className="w-full bg-[#d4af37] text-zinc-900 py-6 rounded-3xl font-black uppercase italic text-2xl shadow-[0_8px_0_0_#b3922d] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              <Play fill="currentColor" size={24} /> {isGrilled ? "TRY AGAIN" : "PLAY NOW"}
            </button>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter italic">Sound will be enabled after you play</p>
          </div>
        </div>
      )}

      {/* --- HUD --- */}
      {gameActive && (
        <>
          <div className="absolute bottom-10 left-10 z-50 flex items-baseline gap-2 pointer-events-none bg-black/40 p-4 rounded-3xl backdrop-blur-sm border border-white/10">
            <span className="text-7xl font-black italic text-[#d4af37] drop-shadow-[4px_4px_0_#000] leading-none">{score}</span>
            <span className="text-xs font-black text-white uppercase tracking-widest">Points</span>
          </div>

          {/* Mini-indicator during game so user can still see if status changes */}
          <div className="absolute bottom-10 right-10 z-50">
             <div className={`p-4 rounded-full border-4 border-zinc-900 shadow-xl ${status === 'Ready' ? 'bg-emerald-500' : 'bg-[#d4af37]'} animate-pulse`}>
                {status === 'Ready' ? <CheckCircle2 className="text-white" size={24}/> : <ChefHat className="text-zinc-900" size={24}/>}
             </div>
          </div>
        </>
      )}
    </div>
  );
}