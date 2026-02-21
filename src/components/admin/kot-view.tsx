"use client"

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, 
  updateDoc, writeBatch, serverTimestamp, getDoc 
} from 'firebase/firestore';
import { Order } from '@/lib/types';
import { 
  CheckCircle2, Clock, Check, ChefHat, User, Hash, Box, PackageCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function KotView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    // Show Received, Preparing, Served orders in KOT
    const q = query(collection(firestore, "orders"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
    });
    return () => unsubscribe();
  }, [firestore]);

  const markItemPacked = async (orderId: string, itemIndex: number) => {
    if (!firestore) return;
    const orderRef = doc(firestore, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) return;
    
    const items = [...orderSnap.data().items];
    items[itemIndex].status = "Served";
    
    // Check if all items are packed
    const allPacked = items.every(item => item.status === 'Served');
    const newStatus = allPacked ? "Served" : "Preparing";

    await updateDoc(orderRef, { items, status: newStatus });
    toast({ title: allPacked ? "Order Fully Packed" : "Item Packed" });
  };

  const markReadyForPickup = async (orderId: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, "orders", orderId), { status: "Ready" });
    toast({ title: "Ready for Pickup", description: "Customer notified & timer started." });
  };

  const archiveOrder = async (orderId: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, "orders", orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const batch = writeBatch(firestore);
    batch.set(doc(collection(firestore, "order_history")), { 
      ...data, 
      status: "Completed",
      archivedAt: serverTimestamp() 
    });
    batch.delete(orderRef);
    await batch.commit();

    toast({ title: "Order Archived" });
  };

  const formatOrderTime = (ts: any) => {
    if (!ts) return "";
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const kitchenOrders = orders.filter(o => ['Received', 'Preparing', 'Served', 'Ready'].includes(o.status));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-[#b8582e] p-4 rounded-3xl shadow-lg shadow-[#b8582e]/20 text-white">
            <Box size={32} />
          </div>
          <div>
            <h3 className="text-3xl font-black italic uppercase text-zinc-900 tracking-tighter">Kitchen Packing Queue</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active food preparation & packing</p>
          </div>
        </div>
        
        <div className="bg-white border border-zinc-200 rounded-3xl px-8 py-5 shadow-xl flex items-center gap-4">
            <span className="text-5xl font-black text-[#b8582e] italic leading-none">{kitchenOrders.length}</span>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-tight">Active<br/>Tickets</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {kitchenOrders.map((order) => (
          <div key={order.id} className={cn(
            "bg-white border-2 rounded-[3rem] p-8 flex flex-col transition-all shadow-xl hover:shadow-2xl relative overflow-hidden group",
            order.status === 'Ready' ? 'border-emerald-500/50' : 'border-zinc-200'
          )}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center border border-zinc-100">
                    <Hash size={20} className="text-[#b8582e]" />
                 </div>
                 <div>
                    <span className="text-2xl font-black italic text-zinc-900">#{order.orderNumber}</span>
                    <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase mt-1">
                       <Clock size={12}/> {formatOrderTime(order.timestamp)}
                    </div>
                 </div>
              </div>
              
              <div className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase border",
                order.status === 'Received' ? 'bg-blue-100 text-blue-600 border-blue-200' : 
                order.status === 'Preparing' ? 'bg-orange-100 text-orange-600 border-orange-200' :
                order.status === 'Served' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                'bg-emerald-500 text-white border-emerald-600'
              )}>
                {order.status === 'Served' ? 'Packed' : order.status}
              </div>
            </div>

            <div className="mb-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <User size={14} className="text-zinc-400" />
                 <span className="text-[10px] font-black uppercase text-zinc-600">{order.customerName}</span>
               </div>
               <span className="text-[10px] font-black text-[#b8582e] uppercase italic">{order.items.length} Items</span>
            </div>

            <div className="space-y-3 flex-1 mb-8">
              {order.items.map((item, idx) => (
                <div key={idx} className={cn(
                  "flex justify-between items-center p-4 rounded-2xl border transition-all",
                  item.status === 'Served' ? 'bg-emerald-50 border-emerald-100 opacity-50' : 'bg-white border-zinc-100 shadow-sm'
                )}>
                  <div className="flex items-center gap-3">
                    <span className="text-[#b8582e] font-black italic text-sm">{item.quantity}x</span>
                    <span className={cn("text-xs font-bold uppercase italic", item.status === 'Served' ? 'line-through text-zinc-400' : 'text-zinc-900')}>
                       {item.name}
                    </span>
                  </div>
                  {item.status !== 'Served' && order.status !== 'Ready' && (
                    <button 
                      onClick={() => markItemPacked(order.id, idx)} 
                      className="bg-[#b8582e] text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase italic hover:bg-zinc-900 transition-all"
                    >
                      Pack
                    </button>
                  )}
                  {item.status === 'Served' && (
                    <PackageCheck className="text-emerald-500" size={18} />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-auto space-y-3">
              {order.status !== 'Ready' && (
                <button 
                  onClick={() => markReadyForPickup(order.id)}
                  disabled={order.status !== 'Served'}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl",
                    order.status === 'Served' 
                    ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                  )}
                >
                  <CheckCircle2 size={20}/> Ready for Pickup
                </button>
              )}

              {order.status === 'Ready' && (
                <button 
                  onClick={() => archiveOrder(order.id)} 
                  className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-black uppercase italic text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-[#b8582e] transition-all shadow-xl"
                >
                  <Check size={20}/> Handover & Archive
                </button>
              )}
            </div>
          </div>
        ))}

        {kitchenOrders.length === 0 && (
          <div className="col-span-full h-80 flex flex-col items-center justify-center bg-zinc-50 border-4 border-dashed border-zinc-200 rounded-[3rem] text-zinc-300">
             <ChefHat size={48} className="mb-4 opacity-20" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Kitchen is Quiet</p>
          </div>
        )}
      </div>
    </div>
  );
}
