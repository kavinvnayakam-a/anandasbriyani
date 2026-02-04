"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import MenuManager from "@/components/admin/menu-manager"; 
import OrderManager from "@/components/admin/order-manager"; 
import AnalyticsDashboard from "@/components/admin/analytics-dashboard";
import OrderHistory from "@/components/admin/order-history"; 
import { useFirestore } from "@/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  BarChart3, 
  LogOut, 
  ShoppingBag,
  Bell,
  Clock,
  MessageCircleQuestion
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'history' | 'menu' | 'analytics'>('orders');
  const [takeawayCount, setTakeawayCount] = useState(0);
  const firestore = useFirestore();

  // Live listener for Takeaway order count to show in sidebar
  useEffect(() => {
    if (!firestore) return;
    const q = query(
      collection(firestore, "orders"), 
      where("tableId", "==", "Takeaway")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTakeawayCount(snapshot.size);
    });
    
    return () => unsubscribe();
  }, [firestore]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white font-sans selection:bg-zinc-900 selection:text-white">
      
      {/* 1. SIDEBAR - Mustard Yellow */}
      <nav className="w-full md:w-72 bg-[#e76876] text-zinc-900 flex md:flex-col border-b-4 md:border-b-0 md:border-r-4 border-zinc-900 z-40">
        
        {/* Logo Section */}
        <div className="hidden md:block p-8 border-b-2 border-zinc-900/10">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-zinc-900">
            Swiss Delights
          </h1>
          <p className="text-[10px] font-black text-zinc-900/60 uppercase tracking-widest mt-1">Admin Control</p>
        </div>

        {/* Navigation Links */}
        <div className="flex md:flex-col flex-1 justify-around md:justify-start gap-3 p-4 md:p-6">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex items-center justify-between p-4 rounded-2xl font-black uppercase italic transition-all border-2 ${
              activeTab === 'orders' 
              ? 'bg-zinc-900 text-[#e76876] border-zinc-900 shadow-[4px_4px_0_0_#000]' 
              : 'text-zinc-900 border-transparent hover:bg-zinc-900/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <LayoutDashboard className="w-5 h-5" />
              <span className="hidden md:inline">Live Kitchen</span>
            </div>
          </button>

          {/* NEW: ORDER HISTORY BUTTON */}
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-4 p-4 rounded-2xl font-black uppercase italic transition-all border-2 ${
              activeTab === 'history' 
              ? 'bg-zinc-900 text-[#e76876] border-zinc-900 shadow-[4px_4px_0_0_#000]' 
              : 'text-zinc-900 border-transparent hover:bg-zinc-900/10'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="hidden md:inline">Order History</span>
          </button>

          {/* Special Takeaway Indicator in Sidebar */}
          <div className="hidden md:block px-4 py-2 mt-2">
            <div className={`flex items-center justify-between p-4 rounded-2xl border-2 border-zinc-900/20 bg-zinc-900/5`}>
               <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 text-zinc-600" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Takeaway Queue</span>
               </div>
               <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${takeawayCount > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-zinc-300 text-zinc-600'}`}>
                {takeawayCount}
               </span>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-4 p-4 rounded-2xl font-black uppercase italic transition-all border-2 ${
              activeTab === 'menu' 
              ? 'bg-zinc-900 text-[#e76876] border-zinc-900 shadow-[4px_4px_0_0_#000]' 
              : 'text-zinc-900 border-transparent hover:bg-zinc-900/10'
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="hidden md:inline">Edit Menu</span>
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-4 p-4 rounded-2xl font-black uppercase italic transition-all border-2 ${
              activeTab === 'analytics' 
              ? 'bg-zinc-900 text-[#e76876] border-zinc-900 shadow-[4px_4px_0_0_#000]' 
              : 'text-zinc-900 border-transparent hover:bg-zinc-900/10'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="hidden md:inline">Analytics</span>
          </button>
        </div>

        {/* Sidebar Footer */}
        <div className="hidden md:block p-8 mt-auto border-t-2 border-zinc-900/10">
          <button className="flex items-center gap-3 font-black uppercase italic text-zinc-900 hover:translate-x-1 transition-transform">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* STICKY HEADER - Mustard Yellow */}
        <header className="sticky top-0 z-30 bg-[#e76876] border-b-4 border-zinc-900 px-6 py-6 md:px-12 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="md:hidden text-2xl font-black italic uppercase tracking-tighter">G.</div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900/60">
                  Storefront / {activeTab === 'orders' ? 'Orders' : activeTab === 'menu' ? 'Inventory' : activeTab === 'history' ? 'Archives' : 'Insights'}
                </span>
                <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-zinc-900 leading-none">
                  {activeTab === 'orders' ? 'Kitchen View' : activeTab === 'menu' ? 'Menu Manager' : activeTab === 'history' ? 'Order History' : 'Performance'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-4 self-end md:self-center">
              {/* Table Legend - Only on Orders */}
              {activeTab === 'orders' && (
                <div className="flex gap-4 bg-zinc-900 text-[#e76876] px-4 py-2 rounded-xl border-2 border-zinc-900 shadow-sm">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Occupied
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase text-[#e76876]/60">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Available
                  </div>
                </div>
              )}
              
              <button className="p-3 bg-zinc-900 text-[#e76876] rounded-xl border-2 border-zinc-900 relative">
                <Bell size={20} />
                {takeawayCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-zinc-900 animate-bounce">
                    {takeawayCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-6 md:p-12 bg-zinc-50 flex-1">
          {activeTab === 'orders' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
               <OrderManager />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-500">
              <OrderHistory />
            </div>
          )}
          
          {activeTab === 'menu' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <MenuManager />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="animate-in fade-in slide-in-from-right-2 duration-500">
              <AnalyticsDashboard />
            </div>
          )}
        </div>
        
        {/* GETPIK FOOTER */}
        <div className="text-center py-8 bg-zinc-100 border-t-2 border-zinc-200">
            <Link href="https://www.getpik.in/" target="_blank" className="group inline-flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500">Designed By</span>
                <div className="flex items-center gap-2 bg-white px-5 py-2 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0_0_#18181b]">
                    <span className="text-zinc-900 font-black text-xl tracking-tight">GetPik</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
            </Link>
        </div>
      </div>
      <Link href="mailto:info@getpik.in" className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white p-4 rounded-full shadow-lg border-2 border-[#e76876] hover:bg-zinc-800 transition-colors">
          <MessageCircleQuestion className="h-6 w-6" />
          <span className="sr-only">Support</span>
      </Link>
    </div>
  );
}
