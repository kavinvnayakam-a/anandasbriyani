"use client"

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import MenuManager from "@/components/admin/menu-manager"; 
import OrderManager from "@/components/admin/order-manager"; 
import KotView from "@/components/admin/kot-view";
import AnalyticsDashboard from "@/components/admin/analytics-dashboard";
import OrderHistory from "@/components/admin/order-history"; 
import AiMenuImporter from "@/components/admin/ai-menu-importer";
import { useFirestore } from "@/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { 
  LayoutDashboard, 
  LogOut, 
  Bell,
  Clock,
  MessageCircleQuestion,
  TrendingUp,
  Settings,
  ShieldCheck,
  Sparkles,
  ChefHat,
  ShoppingBag,
  Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/dasara-finedine.firebasestorage.app/o/RAVOYI%20LOGO.pdf.webp?alt=media&token=f09f33b3-b303-400e-bbc4-b5dca418c8af";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'counter' | 'packing' | 'history' | 'menu' | 'analytics' | 'ai-import'>('counter');
  const [newOrderCount, setNewOrderCount] = useState(0);
  const firestore = useFirestore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  }, []);

  useEffect(() => {
    if (!firestore) return;

    const qAllOrders = query(collection(firestore, "orders"));
    let isInitialLoad = true;

    const unsubSound = onSnapshot(qAllOrders, (snapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          audioRef.current?.play().catch(() => {});
          setNewOrderCount(prev => prev + 1);
        }
      });
    });
    
    return () => unsubSound();
  }, [firestore]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white font-sans selection:bg-[#b8582e] selection:text-white text-zinc-900">
      
      {/* SIDEBAR: BRANDED TERRACOTTA */}
      <nav className="w-full md:w-72 bg-[#b8582e] flex md:flex-col z-40 shadow-2xl">
        
        <div className="hidden md:flex flex-col items-center py-12 px-6">
          <div className="relative group mb-6">
            <div className="absolute -inset-2 bg-white/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white p-2 rounded-full shadow-lg overflow-hidden w-24 h-24 border-4 border-white/30">
               <Image src={LOGO_URL} alt="RAVOYI" fill className="object-cover p-1" />
            </div>
          </div>
          <h1 className="text-xl font-black uppercase tracking-[0.2em] text-white">RAVOYI</h1>
          <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-black/10 rounded-full border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Kitchen Management</span>
          </div>
        </div>

        <div className="flex md:flex-col flex-1 gap-2 p-4 md:px-6">
          <button 
            onClick={() => setActiveTab('counter')}
            className={cn(
              "flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all relative",
              activeTab === 'counter' 
              ? "bg-white text-[#b8582e] shadow-xl" 
              : "text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            <Store className="w-5 h-5" />
            <span className="hidden md:inline">Counter Feed</span>
            {newOrderCount > 0 && activeTab !== 'counter' && (
              <span className="absolute top-3 right-3 w-2 h-2 bg-white rounded-full animate-ping" />
            )}
          </button>

          <button 
            onClick={() => setActiveTab('packing')}
            className={cn(
              "flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all relative",
              activeTab === 'packing' 
              ? "bg-white text-[#b8582e] shadow-xl" 
              : "text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            <ChefHat className="w-5 h-5" />
            <span className="hidden md:inline">Kitchen Packing</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all",
              activeTab === 'history' 
              ? "bg-white text-[#b8582e] shadow-xl" 
              : "text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            <Clock className="w-5 h-5" />
            <span className="hidden md:inline">Order Archives</span>
          </button>

          <button 
            onClick={() => setActiveTab('menu')}
            className={cn(
              "flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all",
              activeTab === 'menu' 
              ? "bg-white text-[#b8582e] shadow-xl" 
              : "text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="hidden md:inline">Menu Config</span>
          </button>

          <button 
            onClick={() => setActiveTab('ai-import')}
            className={cn(
              "flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all",
              activeTab === 'ai-import' 
              ? "bg-white text-[#b8582e] shadow-xl" 
              : "text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            <Sparkles className="w-5 h-5" />
            <span className="hidden md:inline">AI Importer</span>
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all",
              activeTab === 'analytics' 
              ? "bg-white text-[#b8582e] shadow-xl" 
              : "text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="hidden md:inline">Business</span>
          </button>
        </div>

        <div className="hidden md:block p-8 mt-auto">
          <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all group">
            <div className="p-2 bg-black/10 rounded-lg group-hover:bg-red-500/20 group-hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </div>
            <span>Terminate Session</span>
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT: CLEAN WHITE */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-zinc-50">
        
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-200 px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#b8582e] mb-2">
                Operations Console / {activeTab}
              </span>
              <h2 className="text-4xl font-black italic uppercase text-zinc-900 tracking-tighter leading-none">
                {activeTab === 'counter' ? 'Counter Feed' : activeTab === 'packing' ? 'Packing KOT' : activeTab === 'menu' ? 'Menu Settings' : activeTab === 'history' ? 'Order Archives' : activeTab === 'ai-import' ? 'AI Digitizer' : 'Business Insights'}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 bg-zinc-100 border border-zinc-200 rounded-2xl px-5 py-3 shadow-inner">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Kitchen Online</span>
              </div>
              
              <button className="p-3 bg-white border border-zinc-200 text-zinc-400 rounded-2xl hover:bg-zinc-50 hover:text-[#b8582e] transition-all">
                <Bell size={20} />
              </button>
            </div>
          </div>
        </header>

        <div className="p-8 flex-1">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'counter' && (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                <OrderManager />
              </div>
            )}

            {activeTab === 'packing' && (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                <KotView />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                <OrderHistory />
              </div>
            )}
            
            {activeTab === 'menu' && (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                <MenuManager />
              </div>
            )}

            {activeTab === 'ai-import' && (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                <AiMenuImporter />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                <AnalyticsDashboard />
              </div>
            )}
          </div>
        </div>
        
        <footer className="py-12 px-8 bg-zinc-100 border-t border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <ShieldCheck className="text-zinc-400 w-6 h-6" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Secure Admin Environment</span>
                <span className="text-[9px] font-bold text-zinc-300 uppercase">Hardware ID Verified</span>
              </div>
            </div>
            
            <Link href="https://www.getpik.in/" target="_blank" className="group flex flex-col items-center gap-3">
                <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-zinc-400">Digital Architecture By</span>
                <div className="flex items-center gap-4 bg-white px-8 py-3 rounded-2xl border border-zinc-200 transition-all group-hover:border-[#b8582e] group-hover:bg-zinc-50 shadow-xl">
                    <span className="text-zinc-900 font-black text-lg tracking-tighter group-hover:text-[#b8582e] transition-colors">GetPik</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
            </Link>
        </footer>
      </div>

      <Link href="mailto:info@getpik.in" className="fixed bottom-10 right-10 z-50 bg-[#b8582e] text-white p-5 rounded-2xl shadow-2xl shadow-[#b8582e]/20 hover:scale-110 active:scale-95 transition-all hover:bg-zinc-900">
          <MessageCircleQuestion className="h-7 w-7" />
          <span className="sr-only">Support</span>
      </Link>
    </div>
  );
}
