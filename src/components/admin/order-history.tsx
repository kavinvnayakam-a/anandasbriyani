"use client"

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { Search, Calendar, Hash, Utensils, Printer, Clock } from 'lucide-react';

export default function OrderHistory() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);

        const q = query(
          collection(firestore, "order_history"),
          where("timestamp", ">=", Timestamp.fromDate(start)),
          where("timestamp", "<=", Timestamp.fromDate(end)),
          orderBy("timestamp", "desc")
        );

        const snap = await getDocs(q);
        const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHistory(docs);
      } catch (err) {
        console.error("History fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [selectedDate, firestore]);


  const filteredHistory = history.filter(h => 
    h.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.orderNumber?.toString().includes(searchTerm)
  );

  const formatTime = (ts: any) => {
    if (!ts) return "";
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-[2.5rem] border-4 border-zinc-900 shadow-[8px_8px_0_0_#000]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input 
            type="text" 
            placeholder="Search Customer or Order #..." 
            className="w-full pl-12 pr-4 py-4 bg-zinc-50 border-4 border-zinc-100 rounded-2xl font-black uppercase italic outline-none focus:border-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input 
            type="date" 
            className="w-full pl-12 pr-4 py-4 bg-zinc-50 border-4 border-zinc-100 rounded-2xl font-black uppercase outline-none focus:border-primary transition-all"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center font-black uppercase italic text-zinc-400 animate-pulse">
            Accessing Archives...
          </div>
        ) : filteredHistory.length > 0 ? (
          filteredHistory.map((order) => (
            <div key={order.id} className="bg-white border-4 border-zinc-900 p-8 rounded-[3rem] shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all">
              
              <div className="absolute top-0 right-0 bg-zinc-900 text-white px-6 py-2.5 font-black italic border-b-4 border-l-4 border-zinc-900 rounded-bl-[2rem] text-sm z-10 shadow-sm">
                #{order.orderNumber}
              </div>

              <div className="flex items-center gap-3 text-zinc-400 text-[10px] font-black uppercase mb-6 pt-2">
                <Clock size={14}/> {formatTime(order.timestamp)}
                <span className="mx-1">•</span>
                <Utensils size={14}/> {order.tableId === 'Takeaway' ? 'Collection' : `Table ${order.tableId}`}
              </div>

              <div className="space-y-3 mb-8 min-h-[100px]">
                {order.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border-2 border-zinc-100 font-black uppercase italic text-[11px]">
                    <span className="truncate pr-4">
                      <span className="text-primary mr-2">{item.quantity}x</span>
                      {item.name}
                    </span>
                    <span className="text-zinc-400 shrink-0 font-bold">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t-4 border-zinc-900 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black uppercase text-zinc-400 leading-none mb-1 text-left">Total (Incl. Tax)</p>
                  <p className="text-3xl font-black italic text-zinc-900 leading-none tracking-tighter">₹{order.totalPrice}</p>
                </div>
                <button 
                  onClick={() => window.print()} 
                  className="p-4 bg-primary text-white rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                >
                  <Printer size={20} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-32 bg-zinc-100/50 border-4 border-dashed border-zinc-200 rounded-[4rem] text-center">
             <Hash size={48} className="text-zinc-300 mb-4" />
             <h3 className="text-2xl font-black uppercase italic text-zinc-400 tracking-tighter">No Archives Found</h3>
             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Try a different search or date</p>
          </div>
        )}
      </div>
    </div>
  );
}
