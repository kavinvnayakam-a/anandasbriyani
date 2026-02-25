"use client"

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, 
  updateDoc, writeBatch, serverTimestamp, getDoc, getDocs, where, Timestamp 
} from 'firebase/firestore';
import { Order } from '@/lib/types';
import { 
  CheckCircle2, Clock, Check, ChefHat, User, Hash, Box, PackageCheck, Handshake, History, Flame
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function KotView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCleaning, setIsCleaning] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  // 1. Fetch Live Orders
  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, "orders"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
    });
    return () => unsubscribe();
  }, [firestore]);

  // 2. Auto-Archive Logic (11:00 PM Cutoff)
  useEffect(() => {
    if (!firestore || orders.length === 0 || isCleaning) return;

    const performAutoArchive = async () => {
      setIsCleaning(true);
      try {
        const now = new Date();
        const cutoff = new Date();
        cutoff.setHours(23, 0, 0, 0); // 11:00 PM cutoff
        
        if (now < cutoff) {
          cutoff.setDate(cutoff.getDate() - 1);
        }

        const expiredOrders = orders.filter(order => {
          const orderDate = order.timestamp?.seconds 
            ? new Date(order.timestamp.seconds * 1000) 
            : new Date(order.createdAt);
          return orderDate < cutoff;
        });

        if (expiredOrders.length > 0) {
          console.log(`🧹 Auto-Archive: Moving ${expiredOrders.length} stale orders to history...`);
          const batch = writeBatch(firestore);
          
          expiredOrders.forEach(order => {
            const historyRef = doc(collection(firestore, "order_history"));
            const orderRef = doc(firestore, "orders", order.id);
            
            batch.set(historyRef, { 
              ...order, 
              status: "Completed",
              archivedAt: serverTimestamp(),
              archiveReason: "Daily 11PM Auto-Archive"
            });
            batch.delete(orderRef);
          });

          await batch.commit();
          toast({ 
            title: "Daily Archive Complete", 
            description: `Archived ${expiredOrders.length} orders from the day.` 
          });
        }
      } catch (err) {
        console.error("Auto-archive failure:", err);
      } finally {
        setIsCleaning(false);
      }
    };

    performAutoArchive();
  }, [firestore, orders, isCleaning, toast]);

  const markItemPacked = async (orderId: string, itemIndex: number) => {
    if (!firestore) return;
    const orderRef = doc(firestore, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) return;
    
    const items = [...orderSnap.data().items];
    items[itemIndex].status = "Served";
    
    const allPacked = items.every(item => item.status === 'Served');
    const newStatus = allPacked ? "Served" : "Preparing";

    await updateDoc(orderRef, { items, status: newStatus });
    toast({ title: allPacked ? "Order Fully Packed" : "Item Packed" });
  };

  const markReadyForPickup = async (orderId: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, "orders", orderId), { status: "Ready" });
    toast({ title: "Ready for Pickup", description: "Customer notified." });
  };

  const markHandover = async (orderId: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, "orders", orderId), { status: "Handover" });
    toast({ title: "Order Handovered", description: "Moved to handover section." });
  };

  const formatOrderTime = (ts: any) => {
    if (!ts) return "";
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const { preparationQueue, handoverQueue } = useMemo(() => {
    return {
      preparationQueue: orders.filter(o => ['Received', 'Preparing', 'Served', 'Ready'].includes(o.status)),
      handoverQueue: orders.filter(o => o.status === 'Handover')
    };
  }, [orders]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-4 rounded-3xl shadow-lg shadow-primary/20 text-white">
            <Box size={32} />
          </div>
          <div>
            <h3 className="text-3xl font-black italic uppercase text-zinc-900 tracking-tighter">Kitchen Workspace</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Shift resets at 11:00 PM • {preparationQueue.length + handoverQueue.length} Active Tickets
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white border border-zinc-200 rounded-3xl px-6 py-4 shadow-sm flex items-center gap-4">
              <span className="text-3xl font-black text-orange-500 italic leading-none">{preparationQueue.length}</span>
              <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-tight">Preparing</span>
          </div>
          <div className="bg-white border border-zinc-200 rounded-3xl px-6 py-4 shadow-sm flex items-center gap-4">
              <span className="text-3xl font-black text-primary italic leading-none">{handoverQueue.length}</span>
              <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-tight">Handed Over</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
             <Flame className="text-orange-500" size={20} />
             <h4 className="text-xl font-black uppercase italic text-zinc-900 tracking-tight">Active Preparation</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {preparationQueue.length > 0 ? preparationQueue.map((order) => (
              <OrderTicket 
                key={order.id} 
                order={order} 
                onPack={markItemPacked}
                onReady={markReadyForPickup}
                onHandover={markHandover}
                formatTime={formatOrderTime}
              />
            )) : (
              <EmptyState icon={<ChefHat size={48}/>} label="No pending orders" />
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-3 mb-2">
             <History className="text-zinc-400" size={20} />
             <h4 className="text-xl font-black uppercase italic text-zinc-400 tracking-tight">Handed Over</h4>
          </div>

          <div className="flex flex-col gap-6">
            {handoverQueue.length > 0 ? handoverQueue.map((order) => (
              <OrderTicket 
                key={order.id} 
                order={order} 
                formatTime={formatOrderTime}
                isHandover
              />
            )) : (
              <div className="h-40 flex items-center justify-center border-4 border-dashed border-zinc-100 rounded-[2.5rem] text-zinc-200">
                <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Handovers</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function OrderTicket({ order, onPack, onReady, onHandover, formatTime, isHandover }: any) {
  return (
    <div className={cn(
      "bg-white border-2 rounded-[2.5rem] p-6 flex flex-col transition-all shadow-xl hover:shadow-2xl relative overflow-hidden group",
      order.status === 'Ready' ? 'border-emerald-500/50' : 
      isHandover ? 'border-primary bg-primary/5 opacity-80' : 
      'border-zinc-100'
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100">
              <Hash size={16} className="text-primary" />
           </div>
           <div>
              <span className="text-xl font-black italic text-zinc-900">#{order.orderNumber}</span>
              <div className="flex items-center gap-2 text-zinc-400 text-[8px] font-bold uppercase">
                 <Clock size={10}/> {formatTime(order.timestamp)}
              </div>
           </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mb-4 flex items-center justify-between">
         <span className="text-[9px] font-black uppercase text-zinc-500 truncate max-w-[120px]">{order.customerName}</span>
         <span className="text-[9px] font-black text-primary uppercase italic">{order.items.length} Items</span>
      </div>

      <div className="space-y-2 flex-1 mb-6">
        {order.items.map((item: any, idx: number) => (
          <div key={idx} className={cn(
            "flex justify-between items-center p-3 rounded-xl border transition-all",
            item.status === 'Served' ? 'bg-emerald-50 border-emerald-100 opacity-50' : 'bg-zinc-50 border-zinc-100'
          )}>
            <div className="flex items-center gap-2">
              <span className="text-primary font-black italic text-[10px]">{item.quantity}x</span>
              <span className={cn("text-[10px] font-bold uppercase italic truncate max-w-[140px]", item.status === 'Served' ? 'line-through text-zinc-400' : 'text-zinc-900')}>
                 {item.name}
              </span>
            </div>
            {!isHandover && item.status !== 'Served' && order.status !== 'Ready' && (
              <button onClick={() => onPack(order.id, idx)} className="bg-primary text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase italic">
                Pack
              </button>
            )}
            {item.status === 'Served' && <PackageCheck className="text-emerald-500" size={14} />}
          </div>
        ))}
      </div>

      <div className="mt-auto">
        {!isHandover && (
          <>
            {order.status !== 'Ready' ? (
              <button 
                onClick={() => onReady(order.id)}
                disabled={order.status !== 'Served'}
                className={cn(
                  "w-full py-4 rounded-2xl font-black uppercase italic text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95",
                  order.status === 'Served' 
                  ? "bg-emerald-500 text-white shadow-lg" 
                  : "bg-zinc-100 text-zinc-300 cursor-not-allowed"
                )}
              >
                <CheckCircle2 size={16}/> Mark Ready
              </button>
            ) : (
              <button 
                onClick={() => onHandover(order.id)} 
                className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase italic text-[10px] flex items-center justify-center gap-2 shadow-lg"
              >
                <Handshake size={16}/> Handover
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: any = {
    'Received': 'bg-blue-100 text-blue-600 border-blue-200',
    'Preparing': 'bg-orange-100 text-orange-600 border-orange-200',
    'Served': 'bg-emerald-100 text-emerald-600 border-emerald-200',
    'Ready': 'bg-emerald-500 text-white border-emerald-600',
    'Handover': 'bg-primary text-white border-primary'
  };
  return (
    <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase border", config[status])}>
      {status === 'Served' ? 'Packed' : status === 'Handover' ? 'Collected' : status}
    </span>
  );
}

function EmptyState({ icon, label }: any) {
  return (
    <div className="col-span-full h-64 flex flex-col items-center justify-center bg-zinc-50 border-4 border-dashed border-zinc-100 rounded-[2.5rem] text-zinc-200">
       <div className="opacity-20">{icon}</div>
       <p className="text-[10px] font-black uppercase tracking-widest mt-2">{label}</p>
    </div>
  );
}
