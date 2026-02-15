"use client"

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, 
  updateDoc, writeBatch, serverTimestamp, getDoc, setDoc 
} from 'firebase/firestore';
import { Order } from '@/lib/types';
import { 
  CheckCircle2, Printer, Square, CheckSquare, BellRing, 
  MessageCircleQuestion, Settings, X, Save, Loader2, Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [printTime, setPrintTime] = useState("");
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
    setPrintTime(new Date().toLocaleTimeString());
  }, [selectedTable, selectedForBill]);

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
    const key = order.tableId || 'Takeaway';
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
    toast({ title: "Item Marked as Served" });
  };

  const triggerFinalServed = async (orderId: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, "orders", orderId), { 
      status: "Served", 
      helpRequested: false 
    });
    toast({ title: "ART Cinema Treats Served!", description: "Session timer active." });
  };

  const resolveHelp = async (orderId: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, "orders", orderId), { helpRequested: false });
    toast({ title: "Staff Assistance Resolved" });
  };

  const archiveTable = async (tableId: string) => {
    if (!firestore) return;
    const toArchive = tableMap[tableId]?.filter(o => o.status === 'Served') || [];
    if (toArchive.length === 0) return toast({ title: "No served orders found", variant: "destructive" });
    
    const batch = writeBatch(firestore);
    toArchive.forEach(o => {
      batch.set(doc(collection(firestore, "order_history")), { ...o, archivedAt: serverTimestamp() });
      batch.delete(doc(firestore, "orders", o.id));
    });
    await batch.commit();
    toast({ title: "Seat Cleared & Archived" });
  };

  const saveSettings = async () => {
    if (!firestore) return;
    await setDoc(doc(firestore, "settings", "print_template"), printSettings);
    setShowSettings(false);
    toast({ title: "Receipt Settings Saved" });
  };

  if (!isMounted) return null;

  const allTables = ["Takeaway", ...Array.from({ length: 12 }, (_, i) => (i + 1).toString())];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #thermal-bill, #thermal-bill * { visibility: visible; }
          #thermal-bill { 
            position: absolute; left: 0; top: 0; width: 80mm; 
            padding: 4mm; color: black !important; background: white;
            font-family: monospace;
          }
        }
      `}</style>

      <div id="thermal-bill" className="hidden print:block">
        <div className="text-center border-b border-black pb-2 mb-2">
          <h2 className="text-lg font-bold uppercase">{printSettings.storeName}</h2>
          <p className="text-xs">{printSettings.address}</p>
          <p className="text-xs">Ph: {printSettings.phone}</p>
          <p className="text-xs">GST: {printSettings.gstin}</p>
        </div>
        <div className="flex justify-between font-bold mb-2 text-xs">
          <span>Seat: {selectedTable}</span>
          <span>{printTime}</span>
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
          <span>₹{orders.filter(o => selectedForBill.includes(o.id)).reduce((a, b) => a + b.totalPrice, 0)}</span>
        </div>
        <p className="text-center mt-6 text-xs italic">{printSettings.footerMessage}</p>
      </div>

      <div className="lg:col-span-1 grid grid-cols-2 gap-4 h-fit">
        <button onClick={() => setShowSettings(true)} className="col-span-2 p-4 bg-stone-100 rounded-2xl border-2 border-slate-900 font-black flex items-center justify-center gap-2 text-xs mb-2">
          <Settings size={16} /> RECEIPT SETUP
        </button>
        {allTables.map((tId) => {
            const hasHelp = tableMap[tId]?.some(o => o.helpRequested);
            return (
                <button 
                  key={tId} 
                  onClick={() => setSelectedTable(tId)} 
                  className={`p-6 rounded-[2rem] border-4 transition-all ${
                    selectedTable === tId ? "bg-slate-900 text-white border-slate-900 shadow-[6px_6px_0_0_#e76876]" : 
                    hasHelp ? "bg-rose-500 text-white border-slate-900 animate-pulse" :
                    tableMap[tId]?.length ? "bg-rose-500 text-white border-slate-900" : "bg-emerald-500 text-white border-slate-900"
                  }`}
                >
                  <span className="text-2xl font-black italic">{tId}</span>
                </button>
            )
        })}
      </div>

      <div className="lg:col-span-3 space-y-6">
        {selectedTable ? (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center bg-slate-900 p-6 rounded-[2.5rem] text-white mb-6 border-b-4 border-primary">
              <div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">SEAT {selectedTable}</h3>
                <p className="text-[10px] text-primary font-bold uppercase">{tableMap[selectedTable]?.length || 0} ACTIVE THEATER TICKETS</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="bg-primary text-white px-4 py-3 rounded-xl font-black text-xs uppercase italic flex items-center gap-2 shadow-[4px_4px_0_0_#000]"><Printer size={16}/> Print Bill</button>
                <button onClick={() => archiveTable(selectedTable)} className="bg-rose-500 text-white px-4 py-3 rounded-xl font-black text-xs uppercase italic shadow-[4px_4px_0_0_#000]">Clear Seat</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tableMap[selectedTable]?.map((order) => (
                <div key={order.id} className={`bg-white border-4 border-slate-900 p-6 rounded-[2.5rem] shadow-xl relative flex flex-col ${order.helpRequested ? 'ring-8 ring-rose-500 ring-inset' : ''}`}>
                  
                  {order.helpRequested && (
                    <div className="mb-4 bg-rose-500 p-4 rounded-2xl flex items-center justify-between">
                        <span className="text-white font-black italic uppercase text-xs animate-bounce">Seat Needs Help!</span>
                        <button onClick={() => resolveHelp(order.id)} className="bg-white text-rose-500 px-3 py-1 rounded-lg font-black uppercase text-[10px]">Resolve</button>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setSelectedForBill(prev => prev.includes(order.id) ? prev.filter(x => x !== order.id) : [...prev, order.id])}>
                       {selectedForBill.includes(order.id) ? <CheckSquare size={24} className="text-primary"/> : <Square size={24}/>}
                    </button>
                    <span className="font-black text-xs bg-slate-100 px-2 py-1 rounded">#{order.orderNumber}</span>
                  </div>

                  <div className="space-y-4 flex-1">
                    {order.status === 'Pending' && (
                      <button onClick={() => approveOrder(order.id)} className="w-full bg-primary py-4 rounded-2xl font-black uppercase italic text-sm flex items-center justify-center gap-2 border-2 border-slate-900 shadow-[4px_4px_0_0_#000] mb-4 text-white">
                        <Check size={18}/> Approve Ticket
                      </button>
                    )}

                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className={`flex justify-between items-center p-3 rounded-xl border-2 ${item.status === 'Served' ? 'bg-emerald-50 border-emerald-100 opacity-60' : 'bg-orange-50 border-orange-100'}`}>
                          <span className={`text-xs font-bold uppercase italic ${item.status === 'Served' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                             {item.quantity}x {item.name}
                          </span>
                          {item.status !== 'Served' && (
                            <button onClick={() => markItemServed(order.id, idx)} className="bg-slate-900 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase italic">Serve</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => triggerFinalServed(order.id)} 
                    className={`mt-6 w-full py-4 rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-2 border-2 border-slate-900 transition-all ${order.status === 'Served' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-emerald-500 text-white shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none'}`}
                    disabled={order.status === 'Served'}
                  >
                    <CheckCircle2 size={16}/> {order.status === 'Served' ? 'WATCHING SHOW' : 'FINAL SERVE'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[400px] flex items-center justify-center bg-white border-4 border-dashed border-orange-200 rounded-[4rem] text-orange-200 font-black uppercase italic p-12 text-center">
            Select an ART Cinemas seat to manage
          </div>
        )}
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[3rem] border-4 border-slate-900 p-8 flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Receipt Layout</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Establishment Name</label>
                <input className="w-full p-4 bg-orange-50 rounded-2xl font-bold outline-none focus:ring-2 ring-primary" value={printSettings.storeName} onChange={e => setPrintSettings({...printSettings, storeName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Address</label>
                <textarea className="w-full p-4 bg-orange-50 rounded-2xl font-bold outline-none h-24" value={printSettings.address} onChange={e => setPrintSettings({...printSettings, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Phone</label>
                  <input className="w-full p-4 bg-orange-50 rounded-2xl font-bold" value={printSettings.phone} onChange={e => setPrintSettings({...printSettings, phone: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">GSTIN</label>
                  <input className="w-full p-4 bg-orange-50 rounded-2xl font-bold" value={printSettings.gstin} onChange={e => setPrintSettings({...printSettings, gstin: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Footer Note</label>
                <input className="w-full p-4 bg-orange-50 rounded-2xl font-bold" value={printSettings.footerMessage} onChange={e => setPrintSettings({...printSettings, footerMessage: e.target.value})} />
              </div>
            </div>
            <button onClick={saveSettings} className="w-full bg-slate-900 text-primary py-5 rounded-3xl font-black uppercase italic flex items-center justify-center gap-2 shadow-[0_6px_0_0_#000] active:translate-y-1 active:shadow-none transition-all">
              <Save size={20} /> Update Bill Layout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
