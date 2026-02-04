import CustomerView from '@/components/customer-view';
import { Suspense } from 'react';
import Image from 'next/image';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const tableId = typeof resolvedParams.table === 'string' ? resolvedParams.table : null;
  const isTakeAway = resolvedParams.mode === 'takeaway' || (!tableId);

  return (
    <Suspense 
      fallback={
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100">
          <div className="relative group">
            {/* Soft decorative glow behind logo */}
            <div className="absolute -inset-4 bg-red-100/50 rounded-full blur-xl animate-pulse" />
            
            <div className="relative bg-white p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100">
              <Image 
                src="https://firebasestorage.googleapis.com/v0/b/swissdelights-2a272.firebasestorage.app/o/Swiss_logo.webp?alt=media&token=70912942-ad4e-4840-9c22-99ab267c42c6" 
                alt="Swiss Delight Logo" 
                width={180} 
                height={45} 
                className="animate-in fade-in zoom-in duration-700" 
              />
            </div>
          </div>
          <p className="mt-8 text-slate-400 font-medium tracking-widest uppercase text-xs animate-pulse">
            Preparing your menu...
          </p>
        </div>
      }
    >
      <CustomerView tableId={tableId} mode={isTakeAway ? 'takeaway' : 'dine-in'} />
    </Suspense>
  );
}