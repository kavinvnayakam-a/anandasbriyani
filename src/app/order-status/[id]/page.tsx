
"use client"

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
  CheckCircle2, 
  ChefHat, 
  Star,
  PackageCheck,
  ShieldAlert,
  BellRing
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Order } from '@/lib/types';

const HALEEM_HERO = "https://firebasestorage.googleapis.com/v0/b/dasara-finedine.firebasestorage.app/o/Haleem.webp?alt=media&token=be38e4df-e859-48e5-8811-14b5142bc2b5";
const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/dasara-finedine.firebasestorage.app/o/RAVOYI%20LOGO.pdf.webp?alt=media&token=f09f33b3-b303-400e-bbc4-b5dca418c8af";
const BEEP_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const PICKUP_TIMER_DURATION = 3 * 60; // 3 minutes in seconds

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const orderId = params?.id as string;
  
  const orderRef = useMemoFirebase(
    () => orderId && firestore ? doc(firestore, "orders", orderId) : null,
    [orderId, firestore]
  );
  
  const { data: order, isLoading } = useDoc<Order>(orderRef);

  const [timeLeft, setTimeLeft] = useState(PICKUP_TIMER_DURATION);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const audioPlayed = useRef(false);

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    // Beep when order is Ready for the customer to hear
    if (order?.status === 'Ready') {
      if (!audioPlayed.current) {
        const audio = new Audio(BEEP_SOUND_URL);
        audio.play().catch(e => console.log("Audio play blocked by browser:", e));
        audioPlayed.current = true;
      }
    }

    // Start 3-min timer ONLY when Handover is clicked in Admin
    if (order?.status === 'Handover') {
      setIsTimerActive(true);
    }
  }, [order?.status]);

  useEffect(() => {
    let interval: any;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      router.push('/thanks');
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, router]);

  if (isLoading) return null;

  const getStatusSteps = () => {
    const status = order?.status || 'Pending';
    return [
      { 
        id: 1, 
        label: 'Waiting for Approval', 
        time: 'Order Pending', 
        completed: ['Received', 'Preparing', 'Served', 'Ready', 'Handover'].includes(status), 
        active: status === 'Pending', 
        icon: ShieldAlert 
      },
      { 
        id: 2, 
        label: 'Order Confirmed', 
        time: 'Payment Received', 
        completed: ['Preparing', 'Served', 'Ready', 'Handover'].includes(status), 
        active: status === 'Received', 
        icon: CheckCircle2 
      },
      { 
        id: 3, 
        label: 'Preparing & Quality Check', 
        time: 'In Kitchen', 
        completed: ['Ready', 'Handover'].includes(status), 
        active: ['Preparing', 'Served'].includes(status), 
        icon: ChefHat 
      },
      { 
        id: 4, 
        label: 'Final Ready for Pickup', 
        time: isTimerActive ? `Closing in ${formatTimer(timeLeft)}` : (status === 'Ready' ? 'Collect at Counter' : 'Pending'), 
        completed: status === 'Handover', 
        active: ['Ready', 'Handover'].includes(status), 
        icon: BellRing 
      },
    ];
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const steps = getStatusSteps();

  return (
    <div className="min-h-screen bg-[#0a0500] text-white pb-10 overflow-hidden">
      
      <div className="relative h-[40vh] w-full overflow-hidden">
        <Image 
          src={HALEEM_HERO} 
          alt="Ravoyi Haleem"
          fill
          className="object-cover"
          priority
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0500] via-transparent to-transparent" />
        
        <div className="absolute top-8 right-6 z-30">
          <div className="relative p-1 bg-white rounded-full shadow-2xl border-2 border-[#b8582e]">
            <Image 
              src={LOGO_URL} 
              alt="Ravoyi Logo" 
              width={60} 
              height={60} 
              className="rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="relative -mt-24 px-4 md:px-6 z-20">
        <div className="bg-[#b8582e] rounded-[3rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          
          <div className="mb-10 pb-6 border-b border-white/10 flex justify-between items-end">
            <div>
              <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em] mb-1">Takeaway Token</p>
              <h2 className="text-6xl font-black text-white italic tracking-tighter">#{order?.orderNumber || '---'}</h2>
            </div>
            {isTimerActive && (
              <div className="bg-black/20 px-6 py-4 rounded-[2rem] border border-white/10 flex flex-col items-center animate-pulse">
                 <p className="text-[8px] font-black uppercase tracking-widest text-white/60">Collection Done</p>
                 <p className="text-3xl font-black text-white tabular-nums">{formatTimer(timeLeft)}</p>
              </div>
            )}
          </div>

          <div className="space-y-10">
            {steps.map((step, idx) => (
              <div key={step.id} className="relative flex gap-8">
                
                {idx !== steps.length - 1 && (
                  <div className={cn(
                    "absolute left-[21px] top-12 w-[2px] h-10 transition-colors duration-500",
                    step.completed ? "bg-white" : "bg-white/10"
                  )} />
                )}

                <div className={cn(
                  "relative z-10 w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-700",
                  step.completed || step.active 
                    ? "bg-transparent border-white text-white" 
                    : "bg-transparent border-white/10 text-white/10"
                )}>
                  {step.completed && !step.active ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <step.icon 
                      size={20} 
                      strokeWidth={step.active ? 3 : 2} 
                      className={cn(step.active && "animate-pulse")}
                    />
                  )}
                </div>

                <div className="flex flex-col justify-center">
                  <h3 className={cn(
                    "font-black text-lg uppercase tracking-tight italic leading-none",
                    step.completed || step.active ? "text-white" : "text-white/20"
                  )}>
                    {step.label}
                  </h3>
                  <p className={cn(
                    "text-[9px] font-bold uppercase tracking-widest mt-1.5",
                    step.completed || step.active ? "text-white/40" : "text-white/10"
                  )}>
                    {step.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 pt-8 border-t border-white/10 flex flex-col items-center gap-4">
             <div className="flex items-center gap-3">
                <Star size={10} className="text-white/20 fill-white/20" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Ravoyi Telangana Kitchen</p>
                <Star size={10} className="text-white/20 fill-white/20" />
             </div>
          </div>
        </div>
      </div>

      <footer className="mt-12 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-sm">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">Powered by</span>
            <span className="text-white font-black text-lg tracking-tighter leading-none">GetPik</span>
        </div>
      </footer>
    </div>
  );
}
