import CustomerView from '@/components/customer-view';
import { Suspense } from 'react';
import Image from 'next/image';

// Next.js 15: searchParams is now a Promise
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await the params before accessing properties
  const resolvedParams = await searchParams;
  
  const tableId = typeof resolvedParams.table === 'string' ? resolvedParams.table : null;
  const isTakeAway = resolvedParams.mode === 'takeaway' || (!tableId);

  return (
    <Suspense 
      fallback={
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#e76876]">
          <Image 
            src="https://firebasestorage.googleapis.com/v0/b/swissdelights-2a272.firebasestorage.app/o/Swiss_logo.webp?alt=media&token=70912942-ad4e-4840-9c22-99ab267c42c6" 
            alt="Swiss Delights Logo" 
            width={300} 
            height={75} 
            className="animate-pulse" 
          />
        </div>
      }
    >
      <CustomerView tableId={tableId} mode={isTakeAway ? 'takeaway' : 'dine-in'} />
    </Suspense>
  );
}