
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
  Store,
  PanelLeft,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from "@/components/ui/sidebar";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/dasara-finedine.firebasestorage.app/o/RAVOYI%20LOGO.pdf.webp?alt=media&token=f09f33b3-b303-400e-bbc4-b5dca418c8af";

type TabType = 'counter' | 'packing' | 'history' | 'menu' | 'analytics' | 'ai-import';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('counter');
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

  const navItems: { id: TabType; label: string; icon: any; showBadge?: boolean }[] = [
    { id: 'counter', label: 'Counter Feed', icon: Store, showBadge: newOrderCount > 0 },
    { id: 'packing', label: 'Kitchen Packing', icon: ChefHat },
    { id: 'history', label: 'Order Archives', icon: Clock },
    { id: 'menu', label: 'Menu Config', icon: Settings },
    { id: 'ai-import', label: 'AI Importer', icon: Sparkles },
    { id: 'analytics', label: 'Business', icon: TrendingUp },
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-zinc-50 font-sans selection:bg-[#b8582e] selection:text-white text-zinc-900">
        
        {/* COLLAPSIBLE SIDEBAR */}
        <Sidebar collapsible="icon" className="border-r-0 bg-[#b8582e] text-white">
          <SidebarHeader className="py-10 px-4 flex flex-col items-center overflow-hidden">
            <div className="relative group flex items-center justify-center">
              {/* Highlighted Logo Circle */}
              <div className="absolute -inset-2 bg-white/20 rounded-full blur-xl opacity-80 animate-pulse group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white rounded-full shadow-2xl overflow-hidden w-20 h-20 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 border-2 border-white/30 flex items-center justify-center transition-all duration-300">
                 <Image src={LOGO_URL} alt="RAVOYI" fill className="object-cover p-0" />
              </div>
            </div>
            
            <div className="group-data-[collapsible=icon]:hidden text-center transition-all duration-300">
              <h1 className="text-xl font-black uppercase tracking-[0.2em] text-white mt-6">RAVOYI</h1>
              <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-black/10 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest">Management</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-4">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id} className="mb-2">
                  <SidebarMenuButton 
                    onClick={() => {
                      setActiveTab(item.id);
                      if (item.id === 'counter') setNewOrderCount(0);
                    }}
                    isActive={activeTab === item.id}
                    className={cn(
                      "flex items-center gap-4 px-4 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all relative w-full h-auto",
                      activeTab === item.id 
                      ? "bg-white text-[#b8582e] shadow-xl hover:bg-white/95" 
                      : "text-white hover:bg-white/10"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", activeTab === item.id ? "text-[#b8582e]" : "text-white")} />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    {item.showBadge && activeTab !== item.id && (
                      <span className="absolute top-3 right-3 w-2 h-2 bg-white rounded-full animate-ping" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 mt-auto">
            <button className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/80 hover:text-white transition-all group w-full px-2 py-4">
              <div className="p-2 bg-black/10 rounded-xl group-hover:bg-red-500/20 group-hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="group-data-[collapsible=icon]:hidden">Terminate</span>
            </button>
          </SidebarFooter>
        </Sidebar>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          
          <header className="sticky top-0 z-30 bg-white border-b border-zinc-200 px-8 py-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-6">
              <SidebarTrigger className="p-2 hover:bg-zinc-100 rounded-xl transition-all text-[#b8582e]">
                <PanelLeft size={24} />
              </SidebarTrigger>
              
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#b8582e] mb-1">
                  Console / {activeTab}
                </span>
                <h2 className="text-3xl font-black italic uppercase text-zinc-900 tracking-tighter leading-none">
                  {activeTab === 'counter' ? 'Counter Feed' : activeTab === 'packing' ? 'Packing KOT' : activeTab === 'menu' ? 'Menu Settings' : activeTab === 'history' ? 'Order Archives' : activeTab === 'ai-import' ? 'AI Digitizer' : 'Business Insights'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">System Online</span>
              </div>
              
              <button className="p-3 bg-white border border-zinc-200 text-zinc-400 rounded-2xl hover:bg-zinc-50 hover:text-[#b8582e] transition-all relative">
                <Bell size={20} />
                {newOrderCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#b8582e] rounded-full" />
                )}
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-zinc-50/50 p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto pb-20">
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

            {/* Redesigned Footer Inside Scroll Area */}
            <footer className="mt-auto py-12 border-t border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-8 opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="text-[#b8582e] w-6 h-6" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Secure Admin Environment</span>
                    <span className="text-[9px] font-bold text-zinc-300 uppercase">Hardware ID Verified</span>
                  </div>
                </div>
                
                <Link href="https://www.getpik.in/" target="_blank" className="group flex flex-col items-center gap-3">
                    <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-zinc-400">Digital Architecture By</span>
                    <div className="flex items-center gap-4 bg-white px-6 py-2 rounded-xl border border-zinc-200 transition-all group-hover:border-[#b8582e] group-hover:bg-zinc-50 shadow-sm">
                        <span className="text-zinc-900 font-black text-sm tracking-tighter group-hover:text-[#b8582e] transition-colors">GetPik</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                </Link>
            </footer>
          </main>
        </div>

        {/* Floating Support Button */}
        <Link href="mailto:info@getpik.in" className="fixed bottom-10 right-10 z-50 bg-[#b8582e] text-white p-5 rounded-2xl shadow-2xl shadow-[#b8582e]/20 hover:scale-110 active:scale-95 transition-all hover:bg-zinc-900 group">
            <MessageCircleQuestion className="h-7 w-7" />
            <span className="absolute right-full mr-4 bg-zinc-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
              Contact Tech Support
            </span>
        </Link>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </SidebarProvider>
  );
}
