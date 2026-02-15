
"use client"

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, 
  updateDoc, writeBatch, serverTimestamp, getDoc, setDoc 
} from 'firebase/firestore';
import { Order } from '@/lib/types';
import { 
  CheckCircle2, Printer, Square, CheckSquare, X, Check, Clock, ChevronRight, LayoutDashboard, Settings
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
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedForBill, setSelectedForBill] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const firestore = useFirestore();
  
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    storeName: "ART Cinemas",
    address: "Premium Theater Complex",
    phone: "+91 000 000 0000",
    gstin: "36ABCDE1234F1Z5",
    footerMessage: "Thank you for visiting ART Cinemas! Enjoy the show."
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

  const tableMap = orders.reduce((acc, order) => {
    const key = order.tableId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  const approveOrder = async (orderId: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, "orders", orderId), { status: "Received" });
    toast({ title: "Order Approved" });
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

    toast({ title: "Ticket Completed & Archived" });
  };

  const resolveHelp = async (orderId: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, "orders", orderId), { helpRequested: false });
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

  const allSeatIds: string[] = [];
  for (let s = 1; s <= 5; s++) {
    for (let st = 1; st <= 5; st++) {
      allSeatIds.push(`Screen ${s} - Seat ${st}`);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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

      {/* THERMAL RECEIPT PREVIEW (HIDDEN) */}
      <div id="thermal-bill" className="hidden print:block">
        <div className="text-center border-b border-black pb-2 mb-2">
          <h2 className="text-lg font-bold uppercase">{printSettings.storeName}</h2>
          <p className="text-xs">{printSettings.address}</p>
          <p className="text-xs">Ph: {printSettings.phone}</p>
        </div>
        <div className="flex justify-between font-bold mb-2 text-xs">
          <span>{selectedTable}</span>
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

      {/* SEAT GRID SIDEBAR */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Theater Map</h3>
            <button onClick={() => setShowSettings(true)} className="p-2 hover:text-primary transition-colors">
              <Settings size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
            {allSeatIds.map((tId) => {
              const hasHelp = tableMap[tId]?.some(o => o.helpRequested);
              const isActive = tableMap[tId]?.length > 0;
              const shortId = tId.replace('Screen ', 'S').replace(' - Seat ', '-');
              return (
                <button 
                  key={tId} 
                  onClick={() => setSelectedTable(tId)} 
                  className={cn(
                    "aspect-square rounded-lg border-2 text-[9px] font-black transition-all flex items-center justify-center",
                    selectedTable === tId ? "bg-primary text-black border-primary scale-110 shadow-lg shadow-primary/20 z-10" : 
                    hasHelp ? "bg-red-500 text-white border-red-400 animate-pulse" :
                    isActive ? "bg-zinc-800 text-primary border-primary/30" : "bg-zinc-900 text-zinc-700 border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  {shortId}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-3xl p-6">
          <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Live Load</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-white italic tracking-tighter">{orders.length}</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase pb-1.5">Active Tickets</span>
          </div>
        </div>
      </div>

      {/* KOT VIEW */}
      <div className="lg:col-span-3 space-y-6">
        {selectedTable ? (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl mb-8">
              <div>
                <div className="flex items-center gap-3 text-primary mb-2">
                   <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em]">Seat Focus Mode</span>
                </div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">{selectedTable}</h3>
              </div>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className="bg-white text-black px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-primary transition-all shadow-xl">
                  <Printer size={18}/> Print Bill
                </button>
                <button onClick={() => setSelectedTable(null)} className="p-3 bg-zinc-800 text-zinc-400 rounded-2xl hover:text-white transition-colors">
                  <X size={24}/>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tableMap[selectedTable]?.map((order) => (
                <div key={order.id} className={cn(
                  "bg-zinc-900 border-2 rounded-[2.5rem] p-8 relative flex flex-col transition-all shadow-2xl overflow-hidden",
                  order.helpRequested ? 'border-red-500 shadow-red-500/10' : 'border-zinc-800'
                )}>
                  {order.status === 'Served' && (
                    <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-emerald-500/30">
                      Already Served
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setSelectedForBill(prev => prev.includes(order.id) ? prev.filter(x => x !== order.id) : [...prev, order.id])}
                        className={cn("transition-colors", selectedForBill.includes(order.id) ? "text-primary" : "text-zinc-700 hover:text-zinc-500")}
                      >
                        {selectedForBill.includes(order.id) ? <CheckSquare size={28}/> : <Square size={28}/>}
                      </button>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest leading-none mb-1">Order Ref</span>
                         <span className="font-black text-sm text-white italic">#{order.orderNumber}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] font-black uppercase text-primary tracking-widest leading-none block mb-1">Time</span>
                       <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs">
                          <Clock size={12}/> {formatOrderTime(order.timestamp)}
                       </div>
                    </div>
                  </div>

                  {order.helpRequested && (
                    <div className="mb-6 bg-red-500 p-4 rounded-2xl flex items-center justify-between text-white shadow-lg animate-pulse">
                        <span className="font-black italic uppercase text-[11px] tracking-widest flex items-center gap-2">
                           Bell Notification
                        </span>
                        <button onClick={() => resolveHelp(order.id)} className="bg-white text-red-500 px-4 py-2 rounded-xl font-black uppercase text-[10px] hover:scale-105 transition-all shadow-md">Acknowledge</button>
                    </div>
                  )}

                  <div className="space-y-4 flex-1">
                    {order.status === 'Pending' && (
                      <button onClick={() => approveOrder(order.id)} className="w-full bg-primary text-black py-5 rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-all mb-4">
                        <Check size={20}/> Approve KOT
                      </button>
                    )}

                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className={cn(
                          "flex justify-between items-center p-4 rounded-2xl border-2 transition-all group",
                          item.status === 'Served' ? 'bg-emerald-500/5 border-emerald-500/20 opacity-50' : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
                        )}>
                          <div className="flex items-center gap-3">
                            <span className="text-primary font-black italic text-sm">{item.quantity}x</span>
                            <span className={cn("text-xs font-bold uppercase italic", item.status === 'Served' ? 'line-through text-zinc-500' : 'text-zinc-100')}>
                               {item.name}
                            </span>
                          </div>
                          {item.status !== 'Served' && (
                            <button 
                              onClick={() => markItemServed(order.id, idx)} 
                              className="bg-zinc-800 text-primary border border-primary/20 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase italic hover:bg-primary hover:text-black transition-all"
                            >
                              Serve
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => triggerFinalServed(order.id)} 
                    className={cn(
                      "mt-8 w-full py-5 rounded-2xl font-black uppercase italic text-[11px] tracking-widest flex items-center justify-center gap-3 border-2 transition-all shadow-xl",
                      order.status === 'Served' ? 'bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed' : 'bg-primary text-black border-primary hover:scale-[1.02]'
                    )}
                    disabled={order.status === 'Served'}
                  >
                    <CheckCircle2 size={20}/> 
                    {order.status === 'Served' ? 'Order Finished' : 'Complete & Archive'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-zinc-900/50 border-4 border-dashed border-zinc-800 rounded-[3rem] p-12 text-center group">
            <div className="relative mb-6">
               <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
               <LayoutDashboard size={64} className="text-zinc-800 relative z-10 group-hover:text-zinc-700 transition-colors" />
            </div>
            <h3 className="text-2xl font-black uppercase italic text-zinc-700 tracking-tighter group-hover:text-zinc-600 transition-colors">Theater Terminal Ready</h3>
            <p className="text-[10px] font-bold text-zinc-800 uppercase tracking-[0.4em] mt-3">Select a seat to manage active tickets</p>
          </div>
        )}
      </div>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-zinc-900 w-full max-w-md rounded-[3rem] border border-zinc-800 p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Receipt Design</h2>
              <button onClick={() => setShowSettings(false)} className="p-3 bg-zinc-800 rounded-2xl text-zinc-500 hover:text-white transition-all"><X size={20}/></button>
            </div>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Cinema Brand Name</label>
                <input className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-2xl font-bold text-white outline-none focus:border-primary" value={printSettings.storeName} onChange={e => setPrintSettings({...printSettings, storeName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Physical Address</label>
                <textarea className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-2xl font-bold text-white h-24 outline-none focus:border-primary resize-none" value={printSettings.address} onChange={e => setPrintSettings({...printSettings, address: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Support Line</label>
                <input className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-2xl font-bold text-white outline-none focus:border-primary" value={printSettings.phone} onChange={e => setPrintSettings({...printSettings, phone: e.target.value})} />
              </div>
            </div>
            <button onClick={saveSettings} className="w-full bg-primary text-black py-5 rounded-2xl font-black uppercase italic mt-8 shadow-xl hover:scale-[1.02] transition-all">
              Commit Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
