import { CartProvider } from '@/context/cart-context';
import Image from 'next/image';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Admin Top Navigation */}
      <nav className="h-16 bg-zinc-900 border-b-4 border-[#d4af37] flex items-center px-8 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Image src="https://firebasestorage.googleapis.com/v0/b/grillicious-backend.firebasestorage.app/o/Grillicious-logo.webp?alt=media&token=efbfa1e4-5a67-417f-aff0-bef82099852a" alt="Grillicious Logo" width={120} height={30} />
          <span className="text-white/40 font-bold text-[10px] uppercase tracking-widest ml-2 border-l border-white/20 pl-4">
            Management Portal
          </span>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white text-[9px] font-black uppercase tracking-widest">System Live</span>
          </div>
        </div>
      </nav>

      <div className="admin-theme">
        {children}
      </div>
    </div>
  );
}
