"use client"

import { useState } from "react";
import MenuManager from "@/components/admin/menu-manager"; 
import OrderManager from "@/components/admin/order-manager"; 
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  LogOut, 
  Circle, 
  Clock, 
  CheckCircle2 
} from "lucide-react";
import Image from 'next/image';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-[#d4af37] selection:text-zinc-900">
      {/* SIDEBAR NAVIGATION */}
      <nav className="fixed bottom-0 w-full bg-zinc-900 text-white p-4 flex justify-around md:top-0 md:left-0 md:w-64 md:h-screen md:flex-col md:justify-start md:gap-8 md:p-8 z-50 border-t-4 border-[#d4af37] md:border-t-0 md:border-r-4">
        <div className="hidden md:block mb-10">
          <Image src="https://firebasestorage.googleapis.com/v0/b/grillicious-backend.firebasestorage.app/o/Grillicious-logo.webp?alt=media&token=efbfa1e4-5a67-417f-aff0-bef82099852a" alt="Grillicious Logo" width={200} height={50} />
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Control Center</p>
        </div>

        {/* Live Orders Tab Button */}
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-4 font-black uppercase italic transition-all group ${
            activeTab === 'orders' ? 'text-[#d4af37]' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className={`p-2 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-[#d4af37] text-zinc-900' : 'bg-zinc-800'}`}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="hidden md:inline tracking-tight">Live Kitchen</span>
        </button>

        {/* Menu Management Tab Button */}
        <button 
          onClick={() => setActiveTab('menu')}
          className={`flex items-center gap-4 font-black uppercase italic transition-all group ${
            activeTab === 'menu' ? 'text-[#d4af37]' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className={`p-2 rounded-xl transition-all ${activeTab === 'menu' ? 'bg-[#d4af37] text-zinc-900' : 'bg-zinc-800'}`}>
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <span className="hidden md:inline tracking-tight">Edit Menu</span>
        </button>

        {/* Bottom Section */}
        <div className="md:mt-auto hidden md:block border-t border-zinc-800 pt-8">
          <div className="mb-6 space-y-2">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase text-zinc-500">
              <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" /> System Online
            </div>
          </div>
          <button className="flex items-center gap-4 font-black uppercase italic text-rose-500 hover:bg-rose-500/10 w-full p-2 rounded-xl transition-all">
            <LogOut className="w-5 h-5" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="pb-32 md:pb-10 md:ml-64 p-4 md:p-10 transition-all">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d4af37]">
              Dashboard / {activeTab === 'orders' ? 'Kitchen' : 'Inventory'}
            </span>
            <h2 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter text-zinc-900 leading-none mt-2">
              {activeTab === 'orders' ? 'Live Orders' : 'Menu Manager'}
            </h2>
          </div>

          {/* Table Legend - Only shows on Orders Tab */}
          {activeTab === 'orders' && (
            <div className="flex gap-4 bg-white p-3 rounded-2xl border-2 border-zinc-200 shadow-sm">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                <div className="w-3 h-3 rounded-full bg-emerald-500" /> Occupied
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400">
                <div className="w-3 h-3 rounded-full bg-zinc-200" /> Available
              </div>
            </div>
          )}
        </header>

        {/* DYNAMIC CONTENT RENDERING */}
        <div className="relative min-h-[60vh]">
          {activeTab === 'orders' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
               {/* Your existing table-wise logic is called here */}
               <OrderManager />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
              <MenuManager />
            </div>
          )}
        </div>
      </main>

      {/* Mobile-only Logout (Floating) */}
      <button className="md:hidden fixed top-4 right-4 bg-white p-2 rounded-full border-2 border-zinc-900 shadow-lg z-50">
        <LogOut className="w-5 h-5 text-rose-500" />
      </button>
    </div>
  );
}
