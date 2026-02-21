"use client"

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, where, Timestamp, getDocs, orderBy } from 'firebase/firestore';
import { Order } from '@/lib/types';
import { 
    Banknote, 
    TrendingUp, 
    Calendar,
    Users,
    ArrowUpRight,
    ShoppingBag,
    Search,
    Filter
  } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsDashboard() {
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
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

  const allOrders = [...liveOrders, ...historyOrders];
  const totalRevenue = allOrders.reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);
  const totalOrders = allOrders.length;
  const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
  
  const filteredOrders = allOrders.filter(order => 
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderNumber?.includes(searchTerm)
  );

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-xl">
        <div className="flex flex-col">
          <h3 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900 leading-none">Business Analytics</h3>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Performance & Revenue Tracking</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
            <input 
              type="text"
              placeholder="Search Orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold uppercase outline-none focus:border-[#b8582e] transition-all w-full md:w-64"
            />
          </div>
          <div className="relative flex-1 md:flex-none">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8582e]" size={16} />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-12 pr-6 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-bold uppercase outline-none focus:border-[#b8582e] transition-all w-full md:w-auto"
            />
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Daily Revenue" 
          value={formatCurrency(totalRevenue)} 
          icon={<Banknote size={24} />} 
          trend="+12% vs last week"
          color="text-[#b8582e]"
          bgColor="bg-[#b8582e]/10"
        />
        <StatCard 
          title="Total Orders" 
          value={totalOrders} 
          icon={<ShoppingBag size={24} />} 
          trend={`${liveOrders.length} live right now`}
          color="text-zinc-900"
          bgColor="bg-zinc-100"
        />
        <StatCard 
          title="Avg Order Value" 
          value={formatCurrency(averageOrderValue)} 
          icon={<TrendingUp size={24} />} 
          trend="Per collection token"
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard 
          title="Customer Reach" 
          value={totalOrders} 
          icon={<Users size={24} />} 
          trend="All takeaway mode"
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
      </div>

      {/* MAIN DATA TABLE */}
      <div className="bg-white border border-zinc-200 rounded-[3rem] shadow-2xl overflow-hidden">
        <div className="p-10 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-zinc-900">Transaction Registry</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Detailed log for {new Date(selectedDate).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-5 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync Active
             </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-10 py-5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Order Token</th>
                <th className="px-10 py-5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Customer Info</th>
                <th className="px-10 py-5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Status</th>
                <th className="px-10 py-5 text-left text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Method</th>
                <th className="px-10 py-5 text-right text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Amount (Incl. GST)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-10 py-8">
                    <span className="text-2xl font-black italic text-zinc-900 tracking-tighter">#{order.orderNumber}</span>
                  </td>
                  <td className="px-10 py-8">
                    <p className="font-black uppercase italic text-zinc-800 text-xs leading-none">{order.customerName}</p>
                    <p className="text-[9px] font-bold text-zinc-400 mt-1.5 uppercase tracking-widest">{order.customerPhone}</p>
                  </td>
                  <td className="px-10 py-8">
                     <span className={cn(
                       "px-4 py-1.5 rounded-full text-[8px] font-black uppercase border",
                       order.status === 'Completed' ? 'bg-zinc-100 text-zinc-500 border-zinc-200' :
                       order.status === 'Handover' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                       'bg-[#b8582e]/10 text-[#b8582e] border-[#b8582e]/20'
                     )}>
                       {order.status}
                     </span>
                  </td>
                  <td className="px-10 py-8">
                    <span className="text-[10px] font-black uppercase text-zinc-400">{order.paymentMethod}</span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <span className="text-lg font-black italic text-zinc-900">{formatCurrency(order.totalPrice)}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
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
        
        <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center">
           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Showing {filteredOrders.length} records</p>
           <button className="text-[10px] font-black uppercase tracking-widest text-[#b8582e] hover:underline">Export CSV Report</button>
        </div>
      </div>
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
