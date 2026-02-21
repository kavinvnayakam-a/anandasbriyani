"use client"

import { useEffect, useState, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { 
  doc, 
  onSnapshot
} from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChefHat,
  Flame,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import { useSessionTimer } from '@/hooks/use-session-timer';
import SessionTimer from '@/components/session-timer';

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const firestore = useFirestore();

  const [status, setStatus] = useState('Pending');
  const [orderData, setOrderData] = useState<any>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastStatus = useRef<string>('');

  const { timeLeft } = useSessionTimer(() => {
    router.push('/thanks');
  });

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!id || !firestore) return;
    
    const unsubOrder = onSnapshot(doc(firestore, "orders", id), (docSnapshot) => {
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

    return () => unsubOrder();
  }, [id, firestore]);

  return (
    <div className="fixed inset-0 bg-black font-sans overflow-hidden select-none">
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-30" />

      <div className="absolute inset-0 overflow-y-auto pb-20 no-scrollbar">
        <div className="max-w-md mx-auto px-6 pt-12 space-y-10">
          
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-primary/20 p-8 rounded-[2.5rem] shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex justify-between items-center relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Kitchen Ticket</span>
                <span className="text-xl font-black italic uppercase text-white">#{orderData?.orderNumber}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                  <span className="text-[10px] font-black uppercase text-primary tracking-widest">Takeaway</span>
                </div>
                <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-black/40 rounded-full border border-primary/10 shadow-[0_0_10px_rgba(184,88,46,0.2)]">
                  <SessionTimer timeLeft={timeLeft} />
                </div>
              </div>
            </div>

            <div className="relative h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(184,88,46,0.5)]"
                style={{ width: status === 'Pending' ? '30%' : status === 'Served' ? '100%' : '65%' }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {status === 'Pending' ? 'Waiting for Kitchen' : status === 'Served' ? 'Ready for pickup!' : 'Flames Active'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary uppercase italic">{status}</span>
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3rem] text-center space-y-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <div className="relative bg-zinc-900 p-6 rounded-full border border-primary/20">
                <ChefHat className="h-10 w-10 text-primary animate-bounce" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black italic uppercase text-white">We're on it!</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 leading-relaxed">
                Our chefs are crafting your Telangana kitchen specialties with authentic spice blends. Please wait at the counter.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-primary/10 flex flex-col items-center gap-3 text-center">
              <Flame size={20} className="text-primary" />
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Authentic Preparation</span>
            </div>
            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-primary/10 flex flex-col items-center gap-3 text-center">
              <ChefHat size={20} className="text-primary" />
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Handcrafted Spices</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}