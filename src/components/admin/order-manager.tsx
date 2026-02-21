"use client"

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, 
  updateDoc, writeBatch, serverTimestamp, getDoc, setDoc 
} from 'firebase/firestore';
import { Order } from '@/lib/types';
import { 
  CheckCircle2, Printer, Square, CheckSquare, X, Check, Clock, Settings
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
  const [isMounted, setIsMounted] = useState(false);
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
    setIsMounted(true);
  }, []);

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

  const approveOrder = async (orderId: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, "orders", orderId), { status: "Received" });
    toast({ title: "Order Received" });
  };

  const markItemServed = async (orderId: string, itemIndex: number) => {
    if (!firestore) return;
    const orderRef = doc(firestore, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) return;
    
    const items = [...orderSnap.data().items];
    items[itemIndex].status = "Served";
    await updateDoc(orderRef, { items });
  };

  const triggerFinalServed = async (orderId: string) => {
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

    toast({ title: "Ticket Archived" });
  };

  const saveSettings = async () => {
    if (!firestore) return;
    await setDoc(doc(firestore, "settings", "print_template"), printSettings);
    setShowSettings(false);
  };

  const formatOrderTime = (ts: any) => {
    if (!ts) return "";
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #thermal-bill, #thermal-bill * { visibility: visible; }
          #thermal-bill { 
            position: absolute; left: 0; top: 0; width: 80mm; 
            padding: 4mm; color: black !important; background: white;
            font-family: monospace;
          }
        }
      ` }} />

      <div id="thermal-bill" className="hidden print:block">
        <div className="text-center border-b border-black pb-2 mb-2">
          <h2 className="text-lg font-bold uppercase">{printSettings.storeName}</h2>
          <p className="text-xs">{printSettings.address}</p>
          <p className="text-xs">Ph: {printSettings.phone}</p>
        </div>
        <div className="flex justify-between font-bold mb-2 text-xs">
          <span>TAKEAWAY</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
        <div className="border-b border-black mb-2 text-xs">
          {orders.filter(o => selectedForBill.includes(o.id)).map(order => (
            <div key={order.id} className="mb-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold text-sm">
          <span>GRAND TOTAL</span>
          <span>₹{orders.filter(o => selectedForBill.includes(o.id)).reduce((a, b) => a + (b.totalPrice || 0), 0)}</span>
        </div>
        <p className="text-center mt-6 text-xs italic">{printSettings.footerMessage}</p>
      </div>

      <div className="flex justify-between items-center bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Live Takeaway Feed</h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Real-time counter management</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowSettings(true)} className="p-4 bg-zinc-800 text-zinc-400 rounded-2xl hover:text-white transition-all">
            <Settings size={20}/>
          </button>
          <button onClick={() => window.print()} className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-white hover:text-primary transition-all shadow-xl">
            <Printer size={18}/> Print Selection
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-zinc-900 border-2 border-zinc-800 rounded-[2.5rem] p-8 flex flex-col transition-all shadow-2xl overflow-hidden group hover:border-primary/30">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedForBill(prev => prev.includes(order.id) ? prev.filter(x => x !== order.id) : [...prev, order.id])}
                  className={cn("transition-colors", selectedForBill.includes(order.id) ? "text-primary" : "text-zinc-700 hover:text-zinc-500")}
                >
                  {selectedForBill.includes(order.id) ? <CheckSquare size={28}/> : <Square size={28}/>}
                </button>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest leading-none mb-1">Ticket</span>
                   <span className="font-black text-sm text-white italic">#{order.orderNumber}</span>
                </div>
              </div>
              <div className="text-right">
                 <span className="text-[10px] font-black uppercase text-primary tracking-widest leading-none block mb-1">Received</span>
                 <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs">
                    <Clock size={12}/> {formatOrderTime(order.timestamp)}
                 </div>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              {order.status === 'Pending' && (
                <button onClick={() => approveOrder(order.id)} className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-all mb-4">
                  <Check size={20}/> Accept Ticket
                </button>
              )}

              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className={cn(
                    "flex justify-between items-center p-4 rounded-2xl border-2 transition-all",
                    item.status === 'Served' ? 'bg-emerald-500/5 border-emerald-500/20 opacity-50' : 'bg-zinc-800/50 border-zinc-700/50'
                  )}>
                    <div className="flex items-center gap-3">
                      <span className="text-primary font-black italic text-sm">{item.quantity}x</span>
                      <span className={cn("text-xs font-bold uppercase italic", item.status === 'Served' ? 'line-through text-zinc-500' : 'text-zinc-100')}>
                         {item.name}
                      </span>
                    </div>
                    {item.status !== 'Served' && order.status !== 'Pending' && (
                      <button 
                        onClick={() => markItemServed(order.id, idx)} 
                        className="bg-zinc-800 text-primary border border-primary/20 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase italic hover:bg-primary hover:text-white transition-all"
                      >
                        Pack
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => triggerFinalServed(order.id)} 
              className="mt-8 w-full py-5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-2xl font-black uppercase italic text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-xl"
            >
              <CheckCircle2 size={20}/> Complete & Archive
            </button>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="col-span-full h-80 flex flex-col items-center justify-center bg-zinc-900/40 border-4 border-dashed border-zinc-800 rounded-[3rem] text-zinc-700">
             <CheckCircle2 size={48} className="mb-4" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Counter is Clear</p>
          </div>
        )}
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-zinc-900 w-full max-w-md rounded-[3rem] border border-zinc-800 p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Bill Template</h2>
              <button onClick={() => setShowSettings(false)} className="p-3 bg-zinc-800 rounded-2xl text-zinc-500 hover:text-white transition-all"><X size={20}/></button>
            </div>
            <div className="space-y-6">
              <input className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-2xl font-bold text-white outline-none focus:border-primary" value={printSettings.storeName} onChange={e => setPrintSettings({...printSettings, storeName: e.target.value})} placeholder="Store Name" />
              <textarea className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-2xl font-bold text-white h-24 outline-none focus:border-primary resize-none" value={printSettings.address} onChange={e => setPrintSettings({...printSettings, address: e.target.value})} placeholder="Address" />
              <input className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-2xl font-bold text-white outline-none focus:border-primary" value={printSettings.phone} onChange={e => setPrintSettings({...printSettings, phone: e.target.value})} placeholder="Phone" />
            </div>
            <button onClick={saveSettings} className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase italic mt-8 shadow-xl">
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}