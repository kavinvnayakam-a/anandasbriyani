import CustomerView from '@/components/customer-view';
import { Suspense } from 'react';
import Image from 'next/image';

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/dasara-finedine.firebasestorage.app/o/RAVOYI%20LOGO.pdf.webp?alt=media&token=f09f33b3-b303-400e-bbc4-b5dca418c8af";

export default async function Home() {
  return (
    <Suspense 
      fallback={
        <div className="h-screen w-full flex flex-col items-center justify-center bg-black">
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl animate-pulse" />
            
            <div className="relative bg-zinc-900 p-6 rounded-full border border-primary/20">
              <Image 
                src={LOGO_URL} 
                alt="RAVOYI Logo" 
                width={80} 
                height={80} 
                className="animate-in fade-in zoom-in duration-700 rounded-full" 
              />
            </div>
          </div>
          <p className="mt-8 text-primary font-black tracking-[0.4em] uppercase text-[10px] animate-pulse">
            Loading RAVOYI Kitchen...
          </p>
        </div>
      }
    >
      <CustomerView tableId="Takeaway" mode="takeaway" />
    </Suspense>
  );
}