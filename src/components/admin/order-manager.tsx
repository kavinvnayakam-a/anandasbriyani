"use client"

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, 
  updateDoc, serverTimestamp, getDoc, setDoc 
} from 'firebase/firestore';
import { Order } from '@/lib/types';
import { 
  Printer, Square, CheckSquare, Settings, Check, Clock, User, Phone, Banknote, Store
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PrintSettings {
  storeName: string;
  address: string;
  phone: string;
  gstin: string;
  footerMessage: string;
}

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedForBill, setSelectedForBill] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const firestore = useFirestore();
  
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    storeName: "RAVOYI Kitchen",
    address: "Authentic Telangana Kitchen",
    phone: "+91 000 000 0000",
    gstin: "36ABCDE1234F1Z5",
    footerMessage: "Thank you for visiting RAVOYI! Savor the spice."
  });
  
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, "orders"), orderBy("timestamp", "desc"));
    const unsubOrders = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
    });

    const unsubSettings = onSnapshot(doc(firestore, "settings", "print_template"), (d) => {
      if (d.exists()) setPrintSettings(d.data() as PrintSettings);
    });

    return () => { unsubOrders(); unsubSettings(); };
  }, [firestore]);

  const confirmOrder = async (orderId: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, "orders", orderId), { status: "Received" });
    toast({ title: "Order Confirmed", description: "Sent to Kitchen Packing." });
  };

  const saveSettings = async () => {
    if (!firestore) return;
    await setDoc(doc(firestore, "settings", "print_template"), printSettings);
    setShowSettings(false);
  };

  const formatOrderTime = (ts: any) => {
    if (!ts) return "";
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Only show Pending orders in the Counter feed
  const pendingOrders = orders.filter(o => o.status === 'Pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-xl">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-900">Takeaway Counter Feed</h2>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Pending orders awaiting confirmation</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowSettings(true)} className="p-4 bg-zinc-50 text-zinc-400 rounded-2xl hover:text-[#b8582e] transition-all border border-zinc-200">
            <Settings size={20}/>
          </button>
          <button onClick={() => window.print()} className="bg-[#b8582e] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-900 transition-all shadow-xl">
            <Printer size={18}/> Print Invoices
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pendingOrders.map((order) => (
          <div key={order.id} className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 flex flex-col transition-all shadow-lg hover:shadow-2xl hover:border-[#b8582e]/30 group">
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 flex items-center justify-center">
                  <span className="text-2xl font-black text-[#b8582e] italic leading-none">#{order.orderNumber}</span>
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-none mb-1">Status</p>
                   <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-[9px] font-black uppercase border border-orange-200">Pending</span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                 <div className="flex items-center gap-2 text-zinc-400 font-bold text-[10px] uppercase">
                    <Clock size={12}/> {formatOrderTime(order.timestamp)}
                 </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <User size={16} className="text-[#b8582e]" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest leading-none">Customer</span>
                  <span className="text-xs font-bold uppercase italic text-zinc-900">{order.customerName}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <Phone size={16} className="text-[#b8582e]" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest leading-none">Contact</span>
                  <span className="text-xs font-bold text-zinc-900">{order.customerPhone}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#b8582e]/5 rounded-2xl border border-[#b8582e]/10">
                <Banknote size={16} className="text-[#b8582e]" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest leading-none">Payment / Total</span>
                  <span className="text-lg font-black italic text-[#b8582e] leading-none">₹{order.totalPrice} ({order.paymentMethod})</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => confirmOrder(order.id)} 
              className="mt-auto w-full py-5 bg-[#b8582e] text-white rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-zinc-900 transition-all active:scale-95"
            >
              <Check size={20}/> Confirm & Send to Kitchen
            </button>
          </div>
        ))}

        {pendingOrders.length === 0 && (
          <div className="col-span-full h-80 flex flex-col items-center justify-center bg-zinc-50 border-4 border-dashed border-zinc-200 rounded-[3rem] text-zinc-300">
             <Store size={48} className="mb-4 opacity-20" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Counter Clear</p>
          </div>
        )}
      </div>
    </div>
  );
}
