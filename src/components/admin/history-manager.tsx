"use client"

import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore';
import { 
  Calendar as CalendarIcon, 
  ShoppingBag, 
  Clock, 
  ChevronRight, 
  Banknote, 
  Hash,
  Search,
  ArrowLeft
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function HistoryManager() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [selectedDate]);

  const fetchHistory = async () => {
    setIsLoading(true);
    if (!selectedDate) {
      setPastOrders([]);
      setIsLoading(false);
      return;
    }
    try {
      // Create date range for the selected day in the local timezone
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Query the single 'order_history' collection
      const historyCollection = collection(db, "order_history");
      const q = query(
        historyCollection, 
        where("timestamp", ">=", Timestamp.fromDate(startOfDay)),
        where("timestamp", "<=", Timestamp.fromDate(endOfDay)),
        orderBy("timestamp", "desc")
      );
      
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      setPastOrders(orders);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setPastOrders([]); // Clear on error
    } finally {
      setIsLoading(false);
    }
  };


  // Calculations for the Daily Summary
  const totalRevenue = pastOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const totalOrders = pastOrders.length;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* 1. DATE SELECTOR & HEADER */}
      <div className="bg-[#d4af37] p-8 rounded-[2.5rem] border-4 border-zinc-900 shadow-[8px_8px_0_0_#000] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-zinc-900 p-4 rounded-2xl text-[#d4af37] shadow-lg">
            <CalendarIcon size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-zinc-900 leading-none">Archive Hub</h2>
            <p className="text-[10px] font-black text-zinc-900/60 uppercase tracking-[0.2em] mt-1">Browse Past Transactions</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border-4 border-zinc-900 w-full md:w-auto">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent px-4 py-2 font-black uppercase outline-none text-zinc-900 w-full"
          />
        </div>
      </div>

      {/* 2. DAILY SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 p-6 rounded-[2rem] border-4 border-zinc-900 flex items-center justify-between text-white shadow-[6px_6px_0_0_#d4af37]">
          <div>
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Daily Revenue</p>
            <p className="text-4xl font-black italic text-[#d4af37]">{formatCurrency(totalRevenue)}</p>
          </div>
          <Banknote size={40} className="opacity-20" />
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border-4 border-zinc-900 flex items-center justify-between shadow-[6px_6px_0_0_#000]">
          <div>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Orders Served</p>
            <p className="text-4xl font-black italic">{totalOrders}</p>
          </div>
          <ShoppingBag size={40} className="opacity-10" />
        </div>
      </div>

      {/* 3. HISTORY FEED */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 text-center font-black uppercase italic animate-pulse text-zinc-400">Searching Archives...</div>
        ) : pastOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastOrders.map((order) => (
              <div key={order.id} className="bg-white border-4 border-zinc-900 p-6 rounded-[2.5rem] shadow-lg relative group hover:-translate-y-1 transition-all">
                
                {/* Order Number Badge */}
                <div className="absolute top-0 right-0 bg-zinc-900 text-[#d4af37] px-4 py-1.5 font-black italic border-b-2 border-l-2 border-zinc-900 rounded-bl-2xl text-xs">
                  #{order.orderNumber}
                </div>

                <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase mb-4">
                  <Clock size={12}/> 
                  {order.timestamp?.seconds 
                    ? new Date(order.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : "Unknown Time"}
                  <span className="mx-2">•</span>
                  {order.tableId === 'Takeaway' ? '🥡 Collection' : `🪑 Table ${order.tableId}`}
                </div>

                <div className="space-y-3 mb-6">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border-2 border-zinc-100">
                      <span className="font-black uppercase italic text-xs truncate">
                        <span className="text-[#d4af37] mr-2">{item.quantity}x</span>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t-2 border-zinc-100 flex justify-between items-end">
                  <div>
                    <p className="text-[8px] font-black uppercase text-zinc-400 leading-none mb-1 text-left">Final Total</p>
                    <p className="text-2xl font-black italic leading-none">{formatCurrency(order.totalPrice)}</p>
                  </div>
                  <div className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase">
                    Completed
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-zinc-50 border-4 border-dashed border-zinc-200 rounded-[3.5rem] text-center">
            <Search size={48} className="text-zinc-200 mb-4" />
            <h3 className="text-2xl font-black uppercase italic text-zinc-300">No Records Found</h3>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-2">Try selecting a different date from the calendar</p>
          </div>
        )}
      </div>
    </div>
  );
}
