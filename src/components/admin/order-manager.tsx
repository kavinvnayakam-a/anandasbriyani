"use client"

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, 
  updateDoc, setDoc 
} from 'firebase/firestore';
import { Order } from '@/lib/types';
import { 
  Printer, Settings, Check, Clock, User, Phone, Banknote, Store, X, Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PrintSettings {
  storeName: string;
  address: string;
  phone: string;
  gstin: string;
  footerMessage: string;
  paperWidth: '58mm' | '80mm';
}

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const firestore = useFirestore();
  
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    storeName: "RAVOYI Kitchen",
    address: "Authentic Telangana Kitchen, Hyderabad",
    phone: "+91 98765 43210",
    gstin: "36ABCDE1234F1Z5",
    footerMessage: "Thank you for visiting RAVOYI! Savor the spice.",
    paperWidth: '80mm'
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

  const confirmOrder = async (order: Order) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, "orders", order.id), { status: "Received" });
      
      // Prepare for printing
      setPrintingOrder(order);
      
      toast({ title: "Order Confirmed", description: "Receipt generating..." });
      
      // Small delay to ensure the hidden print div is populated
      setTimeout(() => {
        window.print();
      }, 500);
      
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not confirm order." });
    }
  };

  const saveSettings = async () => {
    if (!firestore) return;
    await setDoc(doc(firestore, "settings", "print_template"), printSettings);
    setShowSettings(false);
    toast({ title: "Settings Saved", description: "Print template updated." });
  };

  const formatOrderTime = (ts: any) => {
    if (!ts) return "";
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const pendingOrders = orders.filter(o => o.status === 'Pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-xl">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-900">Takeaway Counter Feed</h2>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Confirmed orders go to Kitchen Packing</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowSettings(true)} className="p-4 bg-zinc-50 text-zinc-400 rounded-2xl hover:text-[#b8582e] transition-all border border-zinc-200">
            <Settings size={20}/>
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
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest leading-none">Total (Incl. 5% GST)</span>
                  <span className="text-lg font-black italic text-[#b8582e] leading-none">₹{order.totalPrice} ({order.paymentMethod})</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => confirmOrder(order)} 
              className="mt-auto w-full py-5 bg-[#b8582e] text-white rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-zinc-900 transition-all active:scale-95"
            >
              <Check size={20}/> Confirm & Print Slip
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

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md bg-white rounded-[2rem] p-8 border-4 border-[#b8582e]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Receipt Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Store Name</Label>
              <Input 
                value={printSettings.storeName} 
                onChange={(e) => setPrintSettings({...printSettings, storeName: e.target.value})}
                className="rounded-xl border-2 font-bold"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">GSTIN Number</Label>
              <Input 
                value={printSettings.gstin} 
                onChange={(e) => setPrintSettings({...printSettings, gstin: e.target.value})}
                className="rounded-xl border-2 font-bold uppercase"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Address</Label>
              <Input 
                value={printSettings.address} 
                onChange={(e) => setPrintSettings({...printSettings, address: e.target.value})}
                className="rounded-xl border-2 font-bold"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Paper Width</Label>
              <div className="flex gap-2">
                {['58mm', '80mm'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setPrintSettings({...printSettings, paperWidth: size as any})}
                    className={cn(
                      "flex-1 py-3 rounded-xl border-2 font-black uppercase text-xs transition-all",
                      printSettings.paperWidth === size ? "bg-[#b8582e] text-white border-[#b8582e]" : "bg-zinc-50 border-zinc-200 text-zinc-400"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <button 
              onClick={saveSettings}
              className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase flex items-center justify-center gap-2 hover:bg-[#b8582e] transition-all"
            >
              <Save size={18} /> Update Template
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div id="printable-receipt" className="hidden print:block font-mono text-black" style={{ width: printSettings.paperWidth }}>
        <div className="p-4 text-center border-b border-dashed border-black">
          <h1 className="text-xl font-black uppercase">{printSettings.storeName}</h1>
          <p className="text-[10px] uppercase">{printSettings.address}</p>
          <p className="text-[10px]">Tel: {printSettings.phone}</p>
          <p className="text-[10px] font-bold">GST: {printSettings.gstin}</p>
        </div>

        {printingOrder && (
          <>
            <div className="py-2 border-b border-dashed border-black text-[10px]">
              <div className="flex justify-between font-bold">
                <span>ORDER: #{printingOrder.orderNumber}</span>
                <span>{formatOrderTime(printingOrder.timestamp)}</span>
              </div>
              <p>CUSTOMER: {printingOrder.customerName}</p>
              <p>PHONE: {printingOrder.customerPhone}</p>
            </div>

            <div className="py-2 border-b border-dashed border-black text-[10px]">
              <div className="grid grid-cols-12 gap-1 font-bold mb-1 border-b border-dashed border-black pb-1">
                <span className="col-span-1">#</span>
                <span className="col-span-7">ITEM</span>
                <span className="col-span-4 text-right">PRICE</span>
              </div>
              {printingOrder.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1 mb-1">
                  <span className="col-span-1">{item.quantity}</span>
                  <span className="col-span-7 uppercase">{item.name}</span>
                  <span className="col-span-4 text-right">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="py-2 text-right text-[10px] border-b border-dashed border-black">
               <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{printingOrder.subtotal?.toFixed(0) || (printingOrder.totalPrice / 1.05).toFixed(0)}</span>
               </div>
               <div className="flex justify-between">
                  <span>CGST @ 2.5%:</span>
                  <span>₹{printingOrder.cgst?.toFixed(0) || (printingOrder.totalPrice * 0.025 / 1.05).toFixed(0)}</span>
               </div>
               <div className="flex justify-between">
                  <span>SGST @ 2.5%:</span>
                  <span>₹{printingOrder.sgst?.toFixed(0) || (printingOrder.totalPrice * 0.025 / 1.05).toFixed(0)}</span>
               </div>
            </div>

            <div className="py-4 text-right">
              <div className="text-lg font-black uppercase">Grand Total: ₹{printingOrder.totalPrice}</div>
              <p className="text-[10px]">Paid via: {printingOrder.paymentMethod}</p>
            </div>

            <div className="pt-4 text-center border-t border-dashed border-black">
              <p className="text-[8px] italic">{printSettings.footerMessage}</p>
              <p className="text-[8px] mt-2 font-bold">ORDER TOKEN: #{printingOrder.orderNumber}</p>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
            background: white !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>
    </div>
  );
}
