"use client"

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MenuManager from "@/components/admin/menu-manager"; 
import OrderManager from "@/components/admin/order-manager"; 
import KotView from "@/components/admin/kot-view";
import AnalyticsDashboard from "@/components/admin/analytics-dashboard";
import OrderHistory from "@/components/admin/order-history"; 
import TodayOrders from "@/components/admin/today-orders";
import SettingsManager from "@/components/admin/settings-manager";
import { useFirestore } from "@/firebase";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { collection, onSnapshot, query } from "firebase/firestore";
import { 
  LogOut, 
  Bell,
  Clock,
  MessageCircleQuestion,
  TrendingUp,
  Settings,
  ShieldCheck,
  ChefHat,
  Store,
  PanelLeft,
  LayoutList,
  Loader2,
  UtensilsCrossed,
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
} from "@/components/ui/sidebar";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/getpik-digital.firebasestorage.app/o/dindigual_anandas_briyani%2FDAB_logo.webp?alt=media&token=2a082303-daa9-4187-89de-bbeefac2ceec";

type TabType = 'counter' | 'packing' | 'today_orders' | 'history' | 'menu' | 'analytics' | 'settings';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('counter');
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [auth, setAuth, isAuthLoaded] = useLocalStorage('dindigul-admin-auth', false);
  const firestore = useFirestore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isAuthLoaded && !auth) {
      router.push("/admin/login");
    }
  }, [auth, isAuthLoaded, router]);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-coin-collect-1915.mp3');
  }, []);

  useEffect(() => {
    if (!firestore || !auth) return;

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
  }, [firestore, auth]);

  const handleSignOut = () => {
    setAuth(false);
    router.push("/admin/login");
  };

  const navItems: { id: TabType; label: string; icon: any; showBadge?: boolean }[] = [
    { id: 'counter', label: 'Counter Feed', icon: Store, showBadge: newOrderCount > 0 },
    { id: 'packing', label: 'Kitchen Packing', icon: ChefHat },
    { id: 'today_orders', label: "Today's Orders", icon: LayoutList },
    { id: 'history', label: 'Order Archives', icon: Clock },
    { id: 'menu', label: 'Menu Config', icon: UtensilsCrossed },
    { id: 'analytics', label: 'Business', icon: TrendingUp },
    { id: 'settings', label: 'Store Settings', icon: Settings },
  ];

  if (!isAuthLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!auth) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-zinc-50 font-sans selection:bg-primary selection:text-white text-zinc-900">
        
        <Sidebar collapsible="icon" className="border-r-0 bg-primary text-white">
          <SidebarHeader className="py-10 px-4 flex flex-col items-center overflow-hidden">
            <div className="relative group flex items-center justify-center">
              {/* Logo Highlight Glow */}
              <div className="absolute -inset-4 bg-white/20 rounded-full blur-2xl opacity-80 animate-pulse group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white rounded-full shadow-2xl overflow-hidden w-28 h-28 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 border-4 border-white/20 flex items-center justify-center transition-all duration-300">
                 <Image src={LOGO_URL} alt="Dindigul Ananda's Briyani" fill className="object-cover" />
              </div>
            </div>
            
            <div className="group-data-[collapsible=icon]:hidden text-center transition-all duration-300">
              <h1 className="text-xl font-black uppercase tracking-[0.2em] text-white mt-8 italic">Ananda's</h1>
              <div className="flex items-center gap-2 mt-2 px-4 py-1.5 bg-black/10 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest">Management</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-6">
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
                      "flex items-center gap-4 px-4 py-7 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all relative w-full h-auto",
                      activeTab === item.id 
                      ? "bg-accent text-white shadow-xl shadow-yellow-400/20" 
                      : "text-white hover:bg-white/10"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 shrink-0 transition-colors text-white")} />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    {item.showBadge && activeTab !== item.id && (
                      <span className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full animate-ping" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 mt-auto">
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/80 hover:text-white transition-all group w-full px-2 py-6"
            >
              <div className="p-2.5 bg-black/10 rounded-xl group-hover:bg-white/20 transition-colors">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="group-data-[collapsible=icon]:hidden">Terminate Session</span>
            </button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="sticky top-0 z-30 bg-white border-b border-zinc-200 px-8 py-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-6">
              <SidebarTrigger className="p-2 hover:bg-zinc-100 rounded-xl transition-all text-primary">
                <PanelLeft size={24} />
              </SidebarTrigger>
              
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-1 leading-none">
                  Console / {activeTab}
                </span>
                <h2 className="text-3xl font-black italic uppercase text-zinc-900 tracking-tighter leading-none mt-1">
                  {activeTab === 'counter' ? 'Counter Feed' : activeTab === 'packing' ? 'Packing KOT' : activeTab === 'menu' ? 'Menu Configuration' : activeTab === 'history' ? 'Order Archives' : activeTab === 'today_orders' ? "Today's Orders" : activeTab === 'settings' ? 'Store Settings' : 'Business Insights'}
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
              
              <button className="p-3 bg-white border border-zinc-200 text-zinc-400 rounded-2xl hover:bg-zinc-50 hover:text-primary transition-all relative">
                <Bell size={20} />
                {newOrderCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                )}
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-zinc-50/50 p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto pb-20">
              {activeTab === 'counter' && <OrderManager />}
              {activeTab === 'packing' && <KotView />}
              {activeTab === 'today_orders' && <TodayOrders />}
              {activeTab === 'history' && <OrderHistory />}
              {activeTab === 'menu' && <MenuManager />}
              {activeTab === 'analytics' && <AnalyticsDashboard />}
              {activeTab === 'settings' && <SettingsManager />}
            </div>

            <footer className="mt-auto py-12 border-t border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-8 opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="text-primary w-6 h-6" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Secure Admin Environment</span>
                    <span className="text-[9px] font-bold text-zinc-300 uppercase">Hardware ID Verified</span>
                  </div>
                </div>
                
                <Link href="https://www.getpik.in/pos" target="_blank" className="group flex flex-col items-center gap-3">
                    <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-zinc-400">Digital Architecture By</span>
                    <div className="flex items-center gap-4 bg-white px-6 py-2 rounded-xl border border-zinc-200 transition-all group-hover:border-primary group-hover:bg-zinc-50 shadow-sm">
                        <span className="text-zinc-900 font-black text-sm tracking-tighter group-hover:text-primary transition-colors">GetPik</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                </Link>
            </footer>
          </main>
        </div>

        <Link href="mailto:info@getpik.in" className="fixed bottom-10 right-10 z-50 bg-primary text-white p-5 rounded-2xl shadow-2xl shadow-primary/20 hover:scale-110 active:scale-95 transition-all hover:bg-zinc-900 group">
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
