"use client"

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, Timestamp, getDocs, orderBy, doc } from 'firebase/firestore';
import { Order } from '@/lib/types';
import { 
    Banknote, 
    TrendingUp, 
    Calendar,
    Users,
    ArrowUpRight,
    ShoppingBag,
    Search,
    Printer,
    Receipt,
    Wallet,
    CreditCard,
    Smartphone,
    X,
    ReceiptText
  } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrintSettings {
  storeName: string;
  address: string;
  phone: string;
  gstin: string;
  fssai: string;
}

export default function AnalyticsDashboard() {
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [printSettings, setPrintSettings] = useState<PrintSettings | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    setLoading(true);
    
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    const qLive = query(
      collection(firestore, "orders"), 
      where("timestamp", ">=", Timestamp.fromDate(start)),
      where("timestamp", "<=", Timestamp.fromDate(end))
    );

    const unsubLive = onSnapshot(qLive, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      setLiveOrders(data);
    });

    const unsubSettings = onSnapshot(doc(firestore, "settings", "print_template"), (d) => {
      if (d.exists()) setPrintSettings(d.data() as PrintSettings);
    });

    const fetchHistory = async () => {
      try {
        const qHist = query(
          collection(firestore, "order_history"),
          where("timestamp", ">=", Timestamp.fromDate(start)),
          where("timestamp", "<=", Timestamp.fromDate(end)),
          orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(qHist);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
        setHistoryOrders(data);
      } catch (e) {
        console.error("History fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    return () => unsubLive();
  }, [selectedDate, firestore]);

  const allOrders = useMemo(() => [...liveOrders, ...historyOrders], [liveOrders, historyOrders]);

  const stats = useMemo(() => {
    const revenue = allOrders.reduce((acc, order) => ({
      total: acc.total + (Number(order.totalPrice) || 0),
      subtotal: acc.subtotal + (Number((order as any).subtotal) || (Number(order.totalPrice) / 1.05)),
      gst: acc.gst + (Number((order as any).cgst || 0) + Number((order as any).sgst || 0) || (Number(order.totalPrice) - (Number(order.totalPrice) / 1.05)))
    }), { total: 0, subtotal: 0, gst: 0 });

    const payments = allOrders.reduce((acc, order) => {
      const method = order.paymentMethod || 'Cash';
      acc[method] = (acc[method] || 0) + Number(order.totalPrice);
      acc[`count_${method}`] = (acc[`count_${method}`] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { revenue, payments };
  }, [allOrders]);

  const filteredOrders = allOrders.filter(order => 
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderNumber?.includes(searchTerm)
  );

  const handlePrintReport = () => {
    setShowPrintPreview(true);
  };

  const executePrint = () => {
    window.print();
    setShowPrintPreview(false);
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-xl">
        <div className="flex flex-col">
          <h3 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900 leading-none">Business Analytics</h3>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Financial & Tax Performance</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
            <input 
              type="text"
              placeholder="Search Transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold uppercase outline-none focus:border-[#b8582e] transition-all w-full md:w-64 text-black"
            />
          </div>
          <div className="relative flex-1 md:flex-none">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8582e]" size={16} />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-12 pr-6 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold uppercase outline-none focus:border-[#b8582e] transition-all w-full md:w-auto text-black"
            />
          </div>
          <button 
            onClick={handlePrintReport}
            className="flex items-center gap-2 bg-[#b8582e] text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-zinc-900 transition-all active:scale-95"
          >
            <Printer size={16} /> Print EOD Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Grand Total (Sales)" 
          value={formatCurrency(stats.revenue.total)} 
          icon={<Banknote size={24} />} 
          trend="Incl. all taxes"
          color="text-[#b8582e]"
          bgColor="bg-[#b8582e]/10"
        />
        <StatCard 
          title="Net Revenue" 
          value={formatCurrency(stats.revenue.subtotal)} 
          icon={<TrendingUp size={24} />} 
          trend="Excl. GST Charges"
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard 
          title="GST Collections" 
          value={formatCurrency(stats.revenue.gst)} 
          icon={<Receipt size={24} />} 
          trend="Payable Liability"
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="UPI Collections" 
          value={formatCurrency(stats.payments.UPI || 0)} 
          icon={<Smartphone size={24} />} 
          trend={`${stats.payments.count_UPI || 0} Transactions`}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatCard 
          title="Cash Collections" 
          value={formatCurrency(stats.payments.Cash || 0)} 
          icon={<Wallet size={24} />} 
          trend={`${stats.payments.count_Cash || 0} Transactions`}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatCard 
          title="Card Collections" 
          value={formatCurrency(stats.payments.Card || 0)} 
          icon={<CreditCard size={24} />} 
          trend={`${stats.payments.count_Card || 0} Transactions`}
          color="text-zinc-900"
          bgColor="bg-zinc-100"
        />
      </div>

      <div className="bg-white border border-zinc-200 rounded-[3rem] shadow-2xl overflow-hidden">
        <div className="p-10 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-zinc-900">Transaction Registry</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Detailed log for {new Date(selectedDate).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-5 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Audit Trail Active
             </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-10 py-5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Order Token</th>
                <th className="px-10 py-5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Customer Info</th>
                <th className="px-10 py-5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Method</th>
                <th className="px-10 py-5 text-right text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Net Sale</th>
                <th className="px-10 py-5 text-right text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Tax</th>
                <th className="px-10 py-5 text-right text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                const subTotal = Number((order as any).subtotal) || (Number(order.totalPrice) / 1.05);
                const taxTotal = (Number((order as any).cgst || 0) + Number((order as any).sgst || 0)) || (Number(order.totalPrice) - subTotal);
                
                return (
                  <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-10 py-8">
                      <span className="text-2xl font-black italic text-zinc-900 tracking-tighter">#{order.orderNumber}</span>
                    </td>
                    <td className="px-10 py-8">
                      <p className="font-black uppercase italic text-zinc-800 text-xs leading-none">{order.customerName}</p>
                      <p className="text-[9px] font-bold text-zinc-400 mt-1.5 uppercase tracking-widest">{order.customerPhone}</p>
                    </td>
                    <td className="px-10 py-8">
                      <span className="px-4 py-1.5 rounded-full text-[8px] font-black uppercase border bg-zinc-50 border-zinc-200 text-zinc-500">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <span className="text-xs font-bold text-zinc-400 tracking-tight">{formatCurrency(subTotal)}</span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <span className="text-xs font-bold text-[#b8582e] tracking-tight">{formatCurrency(taxTotal)}</span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <span className="text-lg font-black italic text-zinc-900">{formatCurrency(order.totalPrice)}</span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <ShoppingBag size={48} className="text-zinc-100" />
                      <div>
                        <p className="text-sm font-black uppercase italic text-zinc-300">No transactions recorded</p>
                        <p className="text-[9px] font-bold text-zinc-200 uppercase tracking-widest mt-1">Try another date or search query</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT PREVIEW DIALOG */}
      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 p-0 overflow-hidden rounded-[3rem] shadow-2xl">
          <DialogHeader className="p-8 border-b border-zinc-800 flex justify-between items-center bg-black/40">
             <div>
                <DialogTitle className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                   <ReceiptText className="text-[#b8582e]" /> EOD Report Preview
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Verify Daily Summary Before Printing</DialogDescription>
             </div>
             <button onClick={() => setShowPrintPreview(false)} className="p-2 text-zinc-500 hover:text-white">
                <X size={20} />
             </button>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] p-10 bg-zinc-950 flex flex-col items-center">
            {/* Visual Preview Only */}
            <div className="bg-white text-black p-8 shadow-2xl font-mono text-[13px] w-[300px] font-black">
              <div className="text-center border-b-2 border-dashed border-black pb-4 mb-4">
                <h1 className="text-2xl font-black uppercase">{printSettings?.storeName || 'RAVOYI KITCHEN'}</h1>
                <p className="uppercase text-[10px] mt-1">{printSettings?.address}</p>
                <p className="text-lg font-black mt-4 border-y border-black py-2">DAILY SALES SUMMARY</p>
                <p className="text-[12px] mt-2 uppercase">DATE: {new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
              </div>

              <div className="space-y-3 border-b-2 border-dashed border-black pb-4 mb-4">
                <div className="flex justify-between font-black">
                  <span>TOTAL BILLS</span>
                  <span>{allOrders.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>NET SALES</span>
                  <span>{formatCurrency(stats.revenue.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TAX (GST 5%)</span>
                  <span>{formatCurrency(stats.revenue.gst)}</span>
                </div>
                <div className="flex justify-between text-2xl font-black border-t-2 border-black pt-3 mt-2">
                  <span>GRAND TOTAL</span>
                  <span>{formatCurrency(stats.revenue.total)}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <p className="font-black text-center mb-3 border-b border-black text-sm">PAYMENT BREAKDOWN</p>
                <div className="flex justify-between">
                  <span>UPI ({stats.payments.count_UPI || 0})</span>
                  <span>{formatCurrency(stats.payments.UPI || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASH ({stats.payments.count_Cash || 0})</span>
                  <span>{formatCurrency(stats.payments.Cash || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CARD ({stats.payments.count_Card || 0})</span>
                  <span>{formatCurrency(stats.payments.Card || 0)}</span>
                </div>
              </div>

              <div className="text-center pt-6 border-t-2 border-dashed border-black opacity-80">
                <p className="italic text-[10px] uppercase">Audit Report • {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </ScrollArea>

          <div className="p-8 bg-zinc-900 flex flex-col gap-4">
             <button onClick={executePrint} className="w-full py-5 bg-[#b8582e] text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-zinc-900 transition-all">
                <Printer size={18} /> Execute Report Print
             </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ACTUAL PRINTABLE ELEMENT (Moved out of Dialog Portal for reliability) */}
      <div id="printable-eod-report" className="hidden print:block font-mono text-black p-0 m-0 w-[80mm] font-black">
          <div className="text-center border-b-4 border-dashed border-black pb-6 mb-6">
            <h1 className="text-3xl font-black uppercase leading-tight mb-2">{printSettings?.storeName || 'RAVOYI KITCHEN'}</h1>
            <p className="uppercase text-[12px] font-black mb-4">{printSettings?.address}</p>
            <div className="text-2xl font-black border-y-4 border-black py-4 my-4 uppercase">
              End of Day Report
            </div>
            <p className="text-xl font-black uppercase">DATE: {new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
          </div>

          <div className="space-y-6 border-b-4 border-dashed border-black pb-6 mb-6 text-xl">
            <div className="flex justify-between">
              <span>TOTAL BILLS</span>
              <span>{allOrders.length}</span>
            </div>
            <div className="flex justify-between">
              <span>NET SALES</span>
              <span>{formatCurrency(stats.revenue.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>TAX (GST 5%)</span>
              <span>{formatCurrency(stats.revenue.gst)}</span>
            </div>
            <div className="flex justify-between text-4xl font-black border-t-4 border-black pt-6 mt-4">
              <span>TOTAL</span>
              <span>{formatCurrency(stats.revenue.total)}</span>
            </div>
          </div>

          <div className="space-y-4 mb-10 text-xl">
            <p className="font-black text-center mb-4 border-b-4 border-black pb-2 text-2xl uppercase">Payment Split</p>
            <div className="flex justify-between">
              <span>UPI ({stats.payments.count_UPI || 0})</span>
              <span>{formatCurrency(stats.payments.UPI || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>CASH ({stats.payments.count_Cash || 0})</span>
              <span>{formatCurrency(stats.payments.Cash || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>CARD ({stats.payments.count_Card || 0})</span>
              <span>{formatCurrency(stats.payments.Card || 0)}</span>
            </div>
          </div>

          <div className="text-center pt-8 border-t-4 border-dashed border-black opacity-100">
            <p className="italic text-[12px] uppercase font-black">Audit Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            <p className="text-[10px] mt-4 font-black uppercase tracking-widest">RAVOYI Management System</p>
          </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-eod-report, #printable-eod-report * { visibility: visible !important; }
          #printable-eod-report { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            display: block !important;
            width: 80mm !important;
            padding: 10px !important;
          }
          @page { margin: 0; size: auto; }
        }
      `}</style>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color, bgColor }: any) {
  return (
    <div className="bg-white border border-zinc-200 p-8 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110", bgColor, color)}>
          {icon}
        </div>
        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
           <ArrowUpRight size={10} /> {trend}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] leading-none mb-2">{title}</p>
        <p className="text-3xl font-black italic text-zinc-900 tracking-tighter leading-none">{value}</p>
      </div>
    </div>
  );
}
