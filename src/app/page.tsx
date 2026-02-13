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
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-orange-50 to-orange-100">
          <div className="relative group">
            <div className="absolute -inset-4 bg-orange-100/50 rounded-full blur-xl animate-pulse" />
            
            <div className="relative bg-white p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-orange-100">
              <Image 
                src="https://firebasestorage.googleapis.com/v0/b/swissdelights-2a272.firebasestorage.app/o/Dasara%20Fine%20Dine.jpg?alt=media&token=b7591bfd-13ee-4d28-b8c0-278f3662c5b7" 
                alt="Dasara Logo" 
                width={120} 
                height={120} 
                className="animate-in fade-in zoom-in duration-700 rounded-full" 
              />
            </div>
          </div>
          <p className="mt-8 text-orange-400 font-medium tracking-widest uppercase text-xs animate-pulse">
            Welcome to Dasara...
          </p>
        </div>
      }
    >
      <CustomerView tableId={tableId} mode={isTakeAway ? 'takeaway' : 'dine-in'} />
    </Suspense>
  );
}