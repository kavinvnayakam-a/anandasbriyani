
"use client"

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { 
  collection, onSnapshot, query, where, Timestamp, getDocs, orderBy, doc 
} from 'firebase/firestore';
import { Order, Table as TableType } from '@/lib/types';
import { 
  Printer,
  ShoppingBag,
  Clock,
  User,
  LayoutList,
  Search,
  X,
  ReceiptText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

interface PrintSettings {
  storeName: string;
  address: string;
  phone: string;
  gstin: string;
  fssai: string;
  footerMessage: string;
  paperWidth: '58mm' | '80mm';
  triggerCashDrawer: boolean;
  optimizedFor: string;
}

const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  storeName: "Dindigul Ananda's Briyani",
  address: "Authentic Dindigul Briyani, Hyderabad - 500074",
  phone: "+91 98765 43210",
  gstin: "36ABCDE1234F1Z5",
  fssai: "12345678901234",
  footerMessage: "Thank you for visiting Dindigul Ananda's Briyani!",
  paperWidth: '80mm',
  triggerCashDrawer: false,
  optimizedFor: "Restsol RTP-81"
};

export default function TodayOrders() {
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<TableType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const todayDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!firestore) return;

    // Fetch print settings once
    const unsubSettings = onSnapshot(doc(firestore, "settings", "print_template"), (d) => {
      if (d.exists()) {
        const settings = { ...DEFAULT_PRINT_SETTINGS, ...d.data() } as PrintSettings;
        setPrintSettings(settings);
      }
    });

    const unsubTables = onSnapshot(query(collection(firestore, "tables"), orderBy("tableNumber")), (snapshot) => {
      setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as TableType));
    });

    const start = new Date(todayDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(todayDate);
    end.setHours(23, 59, 59, 999);

    const qLive = query(
      collection(firestore, "orders"), 
      where("timestamp", ">=", Timestamp.fromDate(start)),
      where("timestamp", "<=", Timestamp.fromDate(end))
    );

    const unsubLive = onSnapshot(qLive, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      setLiveOrders(data);
      if (loading) setLoading(false);
    });

    const fetchHistory = async () => {
      try {
        const qHist = query(
          collection(firestore, "order_history"),
          where("timestamp", ">=", Timestamp.fromDate(start)),
          where("timestamp", "<=", Timestamp.fromDate(end))
        );
        const snapshot = await getDocs(qHist);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        setHistoryOrders(data);
      } catch (e) {
        console.error("History fetch error:", e);
        toast({ variant: 'destructive', title: 'Error fetching history' });
      } finally {
        if(loading) setLoading(false);
      }
    };
    
    fetchHistory();
    return () => {
      unsubLive();
      unsubSettings();
      unsubTables();
    };
  }, [firestore, todayDate, toast, loading]);

  const allTodaysOrders = useMemo(() => {
    const combined = [...liveOrders, ...historyOrders];
    return combined.sort((a, b) => {
      const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : a.createdAt;
      const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : b.createdAt;
      return timeB - timeA;
    });
  }, [liveOrders, historyOrders]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return allTodaysOrders;
    return allTodaysOrders.filter(order => 
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber?.includes(searchTerm)
    );
  }, [allTodaysOrders, searchTerm]);

  const handlePrint = (order: Order) => {
    setPrintingOrder(order);
    setShowPrintPreview(true);
  };
  
  const executePrint = () => {
    window.print();
    setShowPrintPreview(false);
  };
  
  const tableNumberForPrinting = printingOrder ? tables.find(t => t.id === printingOrder.tableId)?.tableNumber : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-xl">
        <div className="flex items-center gap-6">
           <div className="p-4 bg-primary/10 rounded-2xl text-primary">
              <LayoutList size={32} />
           </div>
           <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-900">Today's Orders</h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Live and completed orders for {new Date(todayDate).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="relative flex-1 md:flex-none w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
          <input 
            type="text"
            placeholder="Search by name, order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold uppercase outline-none focus:border-primary transition-all w-full md:w-64 text-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center font-black uppercase italic text-zinc-400 animate-pulse">
            Loading Today's Orders...
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map(order => {
            const table = tables.find(t => t.id === order.tableId);
            const identifier = table ? `Table ${table.tableNumber}` : `Takeaway`;
            return (
            <div key={order.id} className="bg-white border-2 border-zinc-100 p-6 rounded-[2.5rem] shadow-lg flex flex-col gap-4 group">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-2xl font-black italic text-zinc-900 tracking-tighter">{identifier}</span>
                  <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest">#{order.orderNumber}</p>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[8px] font-black uppercase border",
                  order.status === 'Completed' || order.status === 'Handover' ? 'bg-zinc-100 text-zinc-500 border-zinc-200' : 
                  order.status === 'Ready' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                  order.status === 'Pending' ? 'bg-orange-100 text-orange-600 border-orange-200' :
                  'bg-blue-100 text-blue-600 border-blue-200'
                )}>
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-zinc-400"/>
                    <span className="text-[11px] font-bold uppercase italic text-zinc-700">{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 text-[9px] font-bold uppercase">
                    <Clock size={12}/> {formatTime(order.timestamp)}
                  </div>
              </div>

              <div className="space-y-2 flex-1 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-zinc-50 rounded-lg">
                    <span className="text-[10px] font-bold uppercase italic text-zinc-800"><span className="text-primary font-black mr-2">{item.quantity}x</span>{item.name}</span>
                    <span className="text-[10px] font-black text-zinc-500">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-zinc-200 pt-4 flex justify-between items-end">
                 <div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 leading-none">Total ({order.paymentMethod})</p>
                    <p className="text-xl font-black italic text-primary leading-none">{formatCurrency(order.totalPrice)}</p>
                 </div>
                 <button onClick={() => handlePrint(order)} className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-zinc-900 transition-all active:scale-95">
                    <Printer size={16}/>
                 </button>
              </div>
            </div>
          )})
        ) : (
          <div className="col-span-full h-64 flex flex-col items-center justify-center bg-zinc-50 border-4 border-dashed border-zinc-100 rounded-[2.5rem] text-zinc-200">
             <ShoppingBag size={48} className="opacity-40" />
             <p className="text-[10px] font-black uppercase tracking-widest mt-4">No orders for today yet.</p>
          </div>
        )}
      </div>

      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-800 p-0 overflow-hidden rounded-[3rem] shadow-2xl">
          <DialogHeader className="p-8 border-b border-zinc-800 flex justify-between items-center bg-black/40">
             <div>
                <DialogTitle className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                   <ReceiptText className="text-primary" /> Print Preview
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Verify Slips Before Printing</DialogDescription>
             </div>
             <button onClick={() => setShowPrintPreview(false)} className="p-2 text-zinc-500 hover:text-white">
                <X size={20} />
             </button>
          </DialogHeader>
          
          <div className="p-10 bg-zinc-950 flex flex-col md:flex-row items-start justify-center gap-10 no-print overflow-y-auto max-h-[60vh]">
            <div className="w-[302px] flex-shrink-0">
              <p className="text-center text-white/50 font-bold uppercase text-xs tracking-widest mb-2">Receipt</p>
              {printingOrder && <ReceiptComponent order={printingOrder} settings={printSettings} tableNumber={tableNumberForPrinting} />}
            </div>

            {printingOrder && printingOrder.tableId === 'Takeaway' && (
              <div className="w-[302px] flex-shrink-0">
                <p className="text-center text-white/50 font-bold uppercase text-xs tracking-widest mb-2">Collection Token</p>
                <CollectionTokenComponent order={printingOrder} />
              </div>
            )}

            <div className="w-[302px] flex-shrink-0">
              <p className="text-center text-white/50 font-bold uppercase text-xs tracking-widest mb-2">Kitchen Order Ticket</p>
              {printingOrder && <KOTComponent order={printingOrder} tableNumber={tableNumberForPrinting} />}
            </div>
          </div>

          <DialogFooter className="p-8 bg-zinc-900">
             <button onClick={executePrint} className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-zinc-900 transition-all">
                <Printer size={18} /> Execute {printSettings.optimizedFor} Print
             </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div id="printable-receipt" className="hidden">
        {printingOrder && (
          printingOrder.tableId === 'Takeaway' ? (
            <>
              {/* Page 1: Invoice */}
              <div style={{ breakAfter: 'page' }}>
                <ReceiptComponent order={printingOrder} settings={printSettings} tableNumber={null} />
              </div>
              {/* Page 2: Collection Token */}
              <div style={{ breakAfter: 'page' }}>
                <CollectionTokenComponent order={printingOrder} />
              </div>
              {/* Page 3: KOT */}
              <div>
                <KOTComponent order={printingOrder} tableNumber={null} />
              </div>
            </>
          ) : (
            <>
              {/* Dine-in: Receipt */}
              <div style={{ breakAfter: 'page' }}>
                <ReceiptComponent order={printingOrder} settings={printSettings} tableNumber={tableNumberForPrinting} />
              </div>
              {/* Dine-in: KOT */}
              <div>
                <KOTComponent order={printingOrder} tableNumber={tableNumberForPrinting} />
              </div>
            </>
          )
        )}
      </div>

    </div>
  );
}

const formatTime = (ts: any) => {
    if (!ts) return "";
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};
  
const formatDate = (ts: any) => {
    if (!ts) return "";
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ReceiptComponent = ({ order, settings, tableNumber }: { order: Order, settings: PrintSettings, tableNumber: string | null }) => (
    <div className="bg-white text-black p-1 shadow-2xl font-mono text-[11px] w-[80mm]">
      <div className="text-center mb-4">
          <h2 className="text-xl font-black uppercase">{settings.storeName}</h2>
          <p className="text-[9px] uppercase font-bold leading-tight">{settings.address}</p>
          <p className="text-[9px] font-bold">PH: {settings.phone}</p>
          <p className="text-[9px] font-bold">GSTIN: {settings.gstin}</p>
      </div>

      <div className="border-y-2 border-dashed border-black py-1 my-2 text-[10px]">
          <div className="flex justify-between">
              <span>Date: {formatDate(order.timestamp)}</span>
              <span>Time: {formatTime(order.timestamp)}</span>
          </div>
          <div className="flex justify-between font-black">
              {tableNumber 
                  ? <span>Table No.: {tableNumber}</span>
                  : <span>Token No.: #{order.orderNumber}</span>
              }
              <span>{tableNumber ? 'Dine-In' : 'Takeaway'}</span>
          </div>
          <div className="flex justify-between mt-1 pt-1 border-t border-black/10">
              <span className="uppercase">Cust: {order.customerName}</span>
          </div>
      </div>

      <div className="mb-2">
          <div className="grid grid-cols-12 font-black border-b-2 border-dashed border-black pb-1 mb-1 text-[9px]">
              <span className="col-span-6">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Rate</span>
              <span className="col-span-2 text-right">Amt</span>
          </div>
          {order?.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 text-[9px] leading-tight font-bold py-1">
                  <span className="col-span-6 uppercase truncate pr-1">{item.name}</span>
                  <span className="col-span-2 text-center">{item.quantity}</span>
                  <span className="col-span-2 text-right">{item.price.toFixed(2)}</span>
                  <span className="col-span-2 text-right">{(item.price * item.quantity).toFixed(2)}</span>
              </div>
          ))}
      </div>

      <div className="border-t-2 border-dashed border-black pt-2 space-y-1 text-right text-[10px] font-bold">
          <div className="flex justify-between"><span>Sub Total</span> <span>{formatCurrency(order?.subtotal || 0, 2)}</span></div>
          <div className="flex justify-between"><span>CGST @ 2.5%</span> <span>{formatCurrency(order?.cgst || 0, 2)}</span></div>
          <div className="flex justify-between"><span>SGST @ 2.5%</span> <span>{formatCurrency(order?.sgst || 0, 2)}</span></div>
          {(order?.roundOff || 0) !== 0 && (
              <div className="flex justify-between"><span>Round off</span> <span>{order?.roundOff?.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between items-center text-base font-black border-t-2 border-black pt-1 mt-1">
              <span>TOTAL</span>
              <span>{formatCurrency(order?.totalPrice || 0)}</span>
          </div>
          {order?.paymentMethod === 'Cash' && order.cashReceived != null && (
              <div className="pt-2 mt-2 border-t-2 border-dashed border-black/40 text-xs">
                <div className="flex justify-between"><span>CASH RECEIVED</span> <span>{formatCurrency(order.cashReceived)}</span></div>
                <div className="flex justify-between"><span>CHANGE DUE</span> <span>{formatCurrency(order.changeDue || 0)}</span></div>
              </div>
          )}
      </div>

      <div className="text-center mt-4 border-t-2 border-dashed border-black pt-2">
          <p className="text-[9px] font-bold uppercase italic">{settings.footerMessage}</p>
      </div>
  </div>
);

const KOTComponent = ({ order, tableNumber }: { order: Order, tableNumber: string | null }) => (
    <div className="bg-white text-black p-4 font-mono w-[80mm]">
        <div className="text-center">
            <p className="text-lg font-black uppercase tracking-widest">KOT</p>
            <h1 className="text-6xl font-black italic leading-none my-2">
                {tableNumber ? `T${tableNumber}` : `#${order?.orderNumber}`}
            </h1>
            <p className="text-xl font-black mt-2">
                {tableNumber ? '(Dine-In)' : `(${order.customerName})`}
            </p>
        </div>
        <div className="border-y-2 border-dashed border-black my-4 py-2 text-left">
            {order.items.map((item, idx) => (
                <p key={idx} className="text-lg font-black uppercase">
                    {item.quantity}x {item.name}
                </p>
            ))}
        </div>
        <p className="text-center text-xs">{formatTime(order.timestamp)}</p>
    </div>
);

const CollectionTokenComponent = ({ order }: { order: Order }) => (
    <div className="bg-white text-black p-4 font-mono w-[80mm] text-center">
        <p className="text-lg font-black uppercase tracking-widest">Collection Token</p>
        <h1 className="text-8xl font-black italic leading-none my-4">#{order.orderNumber}</h1>
        <div className="border-y-2 border-dashed border-black py-2 my-2 text-left">
            <p className="text-xl font-black uppercase mb-1">{order.customerName}</p>
            {order.items.map((item, idx) => (
                <p key={idx} className="text-base font-black uppercase">
                    {item.quantity}x {item.name}
                </p>
            ))}
        </div>
        <p className="text-center text-xs mt-4 font-bold">Please show this token at the pickup counter.</p>
        <p className="text-center text-xs font-bold">{formatDate(order.timestamp)} {formatTime(order.timestamp)}</p>
    </div>
);
