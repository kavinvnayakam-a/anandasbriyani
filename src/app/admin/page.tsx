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
  LogOut, 
  ShoppingBag,
  Bell,
  Clock,
  MessageCircleQuestion,
  Coffee,
  TrendingUp,
  Settings,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'history' | 'menu' | 'analytics'>('orders');
  const [takeawayCount, setTakeawayCount] = useState(0);
  const firestore = useFirestore();

  // --- LOGIC PRESERVED: Live listener for Takeaway order count ---
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
    <div className="flex flex-col md:flex-row min-h-screen bg-[#FDFDFD] font-sans selection:bg-[#b73538] selection:text-white">
      
      {/* 1. SIDEBAR - Executive Slate Theme */}
      <nav className="w-full md:w-64 bg-slate-900 text-white flex md:flex-col z-40 shadow-2xl">
        
        {/* Logo Section - Boutique Styling */}
        <div className="hidden md:flex flex-col items-center py-10 border-b border-slate-800">
          <div className="bg-white p-3 rounded-2xl mb-4 shadow-lg">
             <div className="w-8 h-8 bg-[#b73538] rounded-lg flex items-center justify-center font-black text-white text-xs">SD</div>
          </div>
          <h1 className="text-sm font-black uppercase tracking-[0.3em] text-white">Swiss Delight</h1>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Management Portal</p>
        </div>

        {/* Navigation Links - Preserved logic, Refined styling */}
        <div className="flex md:flex-col flex-1 justify-around md:justify-start gap-1 p-4 md:p-3 mt-4">
          <button 
            onClick={() => setActiveTab('orders')}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'orders' 
              ? "bg-[#b73538] text-white shadow-lg shadow-red-900/40" 
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden md:inline">Live Queue</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'history' 
              ? "bg-[#b73538] text-white shadow-lg shadow-red-900/40" 
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Clock className="w-4 h-4" />
            <span className="hidden md:inline">Order History</span>
          </button>

          {/* Takeaway Counter Widget */}
          <div className="hidden md:block px-2 py-2 mt-2">
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#b73538]" />
                    <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Takeaways</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-lg",
                    takeawayCount > 0 ? 'bg-[#b73538] text-white animate-pulse' : 'bg-slate-700 text-slate-500'
                  )}>
                    {takeawayCount}
                  </span>
               </div>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('menu')}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'menu' 
              ? "bg-[#b73538] text-white shadow-lg shadow-red-900/40" 
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Coffee className="w-4 h-4" />
            <span className="hidden md:inline">Edit Menu</span>
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'analytics' 
              ? "bg-[#b73538] text-white shadow-lg shadow-red-900/40" 
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="hidden md:inline">Analytics</span>
          </button>
        </div>

        {/* Sidebar Footer */}
        <div className="hidden md:block p-6 mt-auto border-t border-slate-800">
          <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-slate-50/50">
        
        {/* Header - White Glossy Glass */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-6 md:px-10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b73538] mb-1">
                Admin / {activeTab}
              </span>
              <h2 className="text-3xl font-serif italic text-slate-900 leading-none capitalize">
                {activeTab === 'orders' ? 'Live Order Queue' : activeTab === 'menu' ? 'Menu Inventory' : activeTab === 'history' ? 'Order Archives' : 'Business Insights'}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              {/* Live Status Pill */}
              <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-100 rounded-full px-4 py-2 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Store Live</span>
              </div>
              
              <button className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl relative hover:bg-slate-50 transition-colors">
                <Bell size={18} />
                {takeawayCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#b73538] rounded-full border-2 border-white" />
                )}
              </button>
              <button className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
                <Settings size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Content Area - Tab logic preserved */}
        <div className="p-6 md:p-10 flex-1">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'orders' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <OrderManager />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <OrderHistory />
              </div>
            )}
            
            {activeTab === 'menu' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <MenuManager />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <AnalyticsDashboard />
              </div>
            )}
          </div>
        </div>
        
        {/* Footer Branding */}
        <footer className="py-10 px-10 bg-white border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-slate-300 w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Secure Admin Session v2.6</span>
            </div>
            
            <Link href="https://www.getpik.in/" target="_blank" className="group flex flex-col items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-400">Handcrafted By</span>
                <div className="flex items-center gap-3 bg-slate-50 px-6 py-2 rounded-full border border-slate-100 shadow-sm group-hover:border-[#b73538] transition-all">
                    <span className="text-slate-900 font-black text-sm tracking-tight">GetPik</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
            </Link>
        </footer>
      </div>

      {/* Floating Support - Brand Red */}
      <Link href="mailto:info@getpik.in" className="fixed bottom-8 right-8 z-50 bg-[#b73538] text-white p-4 rounded-2xl shadow-xl shadow-red-900/30 hover:scale-110 active:scale-95 transition-all">
          <MessageCircleQuestion className="h-6 w-6" />
          <span className="sr-only">Support</span>
      </Link>
    </div>
  );
}