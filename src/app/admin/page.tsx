"use client"

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import MenuManager from "@/components/admin/menu-manager"; 
import OrderManager from "@/components/admin/order-manager"; 
import AnalyticsDashboard from "@/components/admin/analytics-dashboard";
import OrderHistory from "@/components/admin/order-history"; 
import AiMenuImporter from "@/components/admin/ai-menu-importer";
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
  ShieldCheck,
  Database,
  Sparkles,
  Film
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { pushLocalMenuToFirestore } from "@/lib/sync-menu";
import Image from "next/image";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/dasara-finedine.firebasestorage.app/o/Art%20Cinemas%20Logo.jpeg?alt=media&token=0e8ee706-4ba1-458d-b2b9-d85434f8f2ba";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'history' | 'menu' | 'analytics' | 'ai-import'>('orders');
  const [takeawayCount, setTakeawayCount] = useState(0);
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio object with a coin drop sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  }, []);

  useEffect(() => {
    if (!firestore) return;

    // Listener for takeaway count badge
    const qTakeaway = query(
      collection(firestore, "orders"), 
      where("tableId", "==", "Takeaway")
    );
    
    const unsubTakeaway = onSnapshot(qTakeaway, (snapshot) => {
      setTakeawayCount(snapshot.size);
    });

    // Global listener for new orders to play sound
    const qAllOrders = query(collection(firestore, "orders"));
    let isInitialLoad = true;

    const unsubSound = onSnapshot(qAllOrders, (snapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          // Play sound when a new order is detected
          audioRef.current?.play().catch(() => {
            // Browsers may block audio until the user interacts with the page
            console.log("Audio notification pending user interaction");
          });
          
          // Show a quick toast for the new order
          toast({
            title: "New Order Received!",
            description: `Order #${change.doc.data().orderNumber || 'New'} has arrived.`,
            className: "bg-primary text-white border-none",
          });
        }
      });
    });
    
    return () => {
      unsubTakeaway();
      unsubSound();
    };
  }, [firestore, toast]);

  const handleMenuSync = async () => {
    if (!firestore) {
       toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Firestore not initialized.",
      });
      return;
    }
    if (!confirm("Overwrite cloud menu with local ART Cinemas data?")) {
      return;
    }
    setIsSyncing(true);
    const result = await pushLocalMenuToFirestore(firestore);
    setIsSyncing(false);

    if (result.success) {
      toast({
        title: "Sync Successful",
        description: `Uploaded ${result.count} items.`,
        className: "bg-emerald-600 text-white border-b-4 border-zinc-900",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: result.error,
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#FDFDFD] font-sans selection:bg-primary selection:text-white">
      
      <nav className="w-full md:w-64 bg-slate-900 text-white flex md:flex-col z-40 shadow-2xl">
        
        <div className="hidden md:flex flex-col items-center py-10 border-b border-slate-800">
          <div className="bg-white p-1 rounded-full mb-4 shadow-lg overflow-hidden w-16 h-16 relative border-2 border-primary">
             <Image src={LOGO_URL} alt="ART Cinemas" fill className="object-cover" />
          </div>
          <h1 className="text-sm font-black uppercase tracking-[0.3em] text-white">ART Cinemas</h1>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Admin Dashboard</p>
        </div>

        <div className="flex md:flex-col flex-1 justify-around md:justify-start gap-1 p-4 md:p-3 mt-4">
          <button 
            onClick={() => setActiveTab('orders')}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'orders' 
              ? "bg-primary text-white shadow-lg shadow-orange-900/40" 
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
              ? "bg-primary text-white shadow-lg shadow-orange-900/40" 
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Clock className="w-4 h-4" />
            <span className="hidden md:inline">History</span>
          </button>

          <button 
            onClick={() => setActiveTab('menu')}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'menu' 
              ? "bg-primary text-white shadow-lg shadow-orange-900/40" 
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Film className="w-4 h-4" />
            <span className="hidden md:inline">Cinema Menu</span>
          </button>

          <button 
            onClick={() => setActiveTab('ai-import')}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden",
              activeTab === 'ai-import' 
              ? "bg-primary text-white shadow-lg shadow-orange-900/40" 
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden md:inline">AI Importer</span>
            <div className="absolute top-0 right-0 bg-red-500 text-[6px] px-1 py-0.5 font-black uppercase">New</div>
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'analytics' 
              ? "bg-primary text-white shadow-lg shadow-orange-900/40" 
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="hidden md:inline">Analytics</span>
          </button>
        </div>

        <div className="hidden md:block p-6 mt-auto border-t border-slate-800">
          <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-slate-50/50">
        
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-6 md:px-10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">
                ART Cinemas / {activeTab}
              </span>
              <h2 className="text-3xl font-serif italic text-slate-900 leading-none capitalize">
                {activeTab === 'orders' ? 'Live Tickets' : activeTab === 'menu' ? 'Cinema Menu' : activeTab === 'history' ? 'Archives' : activeTab === 'ai-import' ? 'AI Menu Generation' : 'Business Insights'}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-100 rounded-full px-4 py-2 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live</span>
              </div>
              
              <Button 
                variant="default"
                size="sm" 
                disabled={isSyncing}
                onClick={handleMenuSync} 
                className="bg-primary hover:bg-red-700 text-white border-none text-[10px] font-black uppercase shadow-lg shadow-orange-900/40 transition-colors"
              >
                <Database className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}/> 
                {isSyncing ? 'Syncing...' : 'Sync Local Data'}
              </Button>

              <button className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl relative hover:bg-slate-50 transition-colors">
                <Bell size={18} />
                {takeawayCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white" />
                )}
              </button>
              <button className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
                <Settings size={18} />
              </button>
            </div>
          </div>
        </header>

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

            {activeTab === 'ai-import' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <AiMenuImporter />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <AnalyticsDashboard />
              </div>
            )}
          </div>
        </div>
        
        <footer className="py-10 px-10 bg-white border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-slate-300 w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ART Cinemas Admin Session</span>
            </div>
            
            <Link href="https://www.getpik.in/" target="_blank" className="group flex flex-col items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-400">Handcrafted By</span>
                <div className="flex items-center gap-3 bg-slate-50 px-6 py-2 rounded-full border border-slate-100 shadow-sm group-hover:border-primary transition-all">
                    <span className="text-slate-900 font-black text-sm tracking-tight">GetPik</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
            </Link>
        </footer>
      </div>

      <Link href="mailto:info@getpik.in" className="fixed bottom-8 right-8 z-50 bg-primary text-white p-4 rounded-2xl shadow-xl shadow-orange-900/30 hover:scale-110 active:scale-95 transition-all hover:bg-red-700">
          <MessageCircleQuestion className="h-6 w-6" />
          <span className="sr-only">Support</span>
      </Link>
    </div>
  );
}
