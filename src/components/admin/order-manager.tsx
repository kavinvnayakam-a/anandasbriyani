"use client"

import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { Order } from '@/lib/types';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  ChefHat, 
  Play, 
  Check,
  Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const { toast } = useToast();

  // 1. Fetch Live Orders
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
    });
    return () => unsubscribe();
  }, []);

  // 2. Map Orders to Tables
  const tableMap = orders.reduce((acc, order) => {
    const key = order.tableId || 'Takeaway';
    if (!acc[key]) acc[key] = [];
    acc[key].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  // 3. Date Formatting Fix (Handles Firestore Timestamp objects)
  const formatOrderTime = (timestamp: any) => {
    if (!timestamp) return "Just now";
    try {
      // If it's a Firestore Timestamp {seconds, nanoseconds}
      const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
      if (isNaN(date.getTime())) return "Pending...";
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return "Pending...";
    }
  };

  // 4. Update Status (Received/Ready)
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await updateDoc(doc(db, "orders", orderId), { status: newStatus });
  };

  // 5. Archive and Clear Table
  const archiveAndClearTable = async (tableId: string) => {
    const items = tableMap[tableId];
    const tableDisplayName = tableId === 'Takeaway' ? 'Takeaway' : `Table ${tableId}`;

    if (!items || items.length === 0) {
      toast({
          title: "Nothing to clear",
          description: `${tableDisplayName} is already empty.`,
      });
      return;
    }
    
    if (!confirm(`Are you sure? This will archive all ${items.length} order(s) for ${tableDisplayName} and clear the table.`)) return;

    const historyCollection = collection(db, "order_history");
    const batch = writeBatch(db);

    try {
      for (const order of items) {
        // Step A: Copy to History collection with a new random ID
        const historyDocRef = doc(historyCollection);
        batch.set(historyDocRef, {
          ...order,
          archivedAt: serverTimestamp(),
          finalStatus: 'Completed'
        });
        
        // Step B: Remove from Live 'orders' collection
        const liveOrderDocRef = doc(db, "orders", order.id);
        batch.delete(liveOrderDocRef);
      }
      
      await batch.commit();

      setSelectedTable(null);
      toast({
        title: "Table Cleared! ✅",
        description: `Orders for ${tableDisplayName} were successfully archived.`,
      });
    } catch (err: any) {
      console.error("Archiving Error:", err);
      toast({ title: "Error", description: err.message || "Could not archive orders.", variant: "destructive" });
    }
  };


  const allTables = ["Takeaway", ...Array.from({ length: 12 }, (_, i) => (i + 1).toString())];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      {/* LEFT: TABLE SELECTION GRID */}
      <div className="lg:col-span-1 grid grid-cols-2 gap-4 h-fit">
        {allTables.map((tId) => {
          const tableOrders = tableMap[tId] || [];
          const hasPending = tableOrders.some(o => o.status === 'Pending');
          const hasReady = tableOrders.some(o => o.status === 'Ready');

          return (
            <button
              key={tId}
              onClick={() => setSelectedTable(tId)}
              className={`relative p-6 rounded-[2rem] border-4 transition-all flex flex-col items-center justify-center gap-1 ${
                selectedTable === tId 
                  ? "bg-zinc-900 border-[#d4af37] text-white scale-105 shadow-[6px_6px_0_0_#000]" 
                  : hasPending 
                    ? "bg-rose-500 border-zinc-900 text-white animate-pulse" 
                    : tableOrders.length > 0 
                      ? "bg-zinc-900 border-[#d4af37] text-white" 
                      : "bg-white border-zinc-200 text-zinc-400"
              }`}
            >
              <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                {tId === 'Takeaway' ? 'Collection' : 'Table'}
              </span>
              <span className="text-2xl font-black italic leading-none">{tId}</span>
              
              {tableOrders.length > 0 && (
                <div className="absolute -top-2 -right-2 bg-[#d4af37] text-zinc-900 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-zinc-900">
                  {tableOrders.length}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* RIGHT: LIVE TICKETS AREA */}
      <div className="lg:col-span-3">
        {selectedTable ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Header for Selected Table */}
            <div className="flex justify-between items-center bg-zinc-900 p-6 rounded-[2.5rem] text-white border-b-4 border-[#d4af37]">
              <div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">
                  {selectedTable === 'Takeaway' ? 'Takeaway Orders' : `Table ${selectedTable}`}
                </h3>
                <p className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest mt-1">Live Management</p>
              </div>
              <button 
                onClick={() => archiveAndClearTable(selectedTable)}
                className="flex items-center gap-2 bg-rose-500 text-white px-6 py-3 rounded-2xl font-black uppercase italic text-sm hover:bg-rose-600 transition-all shadow-[4px_4px_0_0_#000]"
              >
                <Check size={18} /> Finish & Clear
              </button>
            </div>

            {/* Individual Order Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(tableMap[selectedTable] || []).map((order) => (
                <div key={order.id} className="bg-white border-4 border-zinc-900 p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col">
                  
                  {/* Order Number Ribbon */}
                  <div className="absolute top-0 right-0 bg-[#d4af37] px-6 py-1.5 font-black italic border-b-2 border-l-2 border-zinc-900 rounded-bl-2xl text-zinc-900 flex items-center gap-1">
                    <Hash size={12} strokeWidth={3}/> {order.orderNumber || '0000'}
                  </div>

                  <div className="flex items-center gap-3 mb-6 pt-2">
                    <div className="bg-zinc-100 p-2 rounded-xl"><Clock size={16} className="text-zinc-400" /></div>
                    <span className="font-bold text-sm text-zinc-600">{formatOrderTime(order.timestamp)}</span>
                  </div>

                  {/* Items List */}
                  <div className="flex-1 space-y-3 mb-8">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-zinc-50 p-3 rounded-2xl border-2 border-zinc-100">
                        <span className="font-black uppercase italic text-sm">
                          <span className="text-[#d4af37] mr-2">{item.quantity}x</span> 
                          {item.name}
                        </span>
                        <span className="text-xs font-bold text-zinc-400">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Dynamic Action Buttons */}
                  <div className="mt-auto">
                    {order.status === 'Pending' ? (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'Received')}
                        className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl border-b-4 border-emerald-700 flex items-center justify-center gap-2 hover:brightness-110 active:translate-y-1 active:border-b-0 transition-all"
                      >
                        <Play size={18} fill="white" /> APPROVE ORDER
                      </button>
                    ) : order.status === 'Received' ? (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'Ready')}
                        className="w-full bg-[#d4af37] text-zinc-900 font-black py-4 rounded-2xl border-b-4 border-zinc-700 flex items-center justify-center gap-2 hover:brightness-110 active:translate-y-1 active:border-b-0 transition-all"
                      >
                        <ChefHat size={18} /> MARK AS READY
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-4 bg-emerald-50 rounded-2xl border-2 border-emerald-500 border-dashed text-emerald-600 font-black uppercase italic text-sm">
                        <CheckCircle2 size={18} /> Ready for pickup
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white border-4 border-dashed border-zinc-200 rounded-[4rem] text-zinc-300 p-12 text-center">
            <div className="bg-zinc-50 p-10 rounded-full mb-6">
              <ChefHat size={60} strokeWidth={1} />
            </div>
            <h3 className="text-3xl font-black uppercase italic tracking-tighter">Kitchen Dashboard</h3>
            <p className="text-sm font-bold uppercase tracking-widest mt-2 max-w-xs">
              Select a table or takeaway to manage incoming orders
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
