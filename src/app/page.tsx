
import CustomerView from '@/components/customer-view';
import { Suspense } from 'react';
import Image from 'next/image';
import TableSelection from '@/components/table-selection';

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/getpik-digital.firebasestorage.app/o/dindigual_anandas_briyani%2FDAB_logo.webp?alt=media&token=2a082303-daa9-4187-89de-bbeefac2ceec";

export default function Home({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {

  const tableId = searchParams?.table as string | undefined;

  if (!tableId) {
    return (
       <Suspense>
         <TableSelection />
       </Suspense>
    );
  }

  return (
    <Suspense 
      fallback={
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          
          <div className="relative flex flex-col items-center">
            {/* Logo Container with Glassmorphism */}
            <div className="relative p-1 rounded-full bg-gradient-to-b from-primary/20 to-transparent">
              <div className="relative bg-black rounded-full p-8 shadow-2xl overflow-hidden">
                {/* Shimmer Effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                
                <Image 
                  src={LOGO_URL} 
                  alt="Dindigul Ananda's Briyani Logo" 
                  width={120} 
                  height={120} 
                  className="opacity-90 object-cover"
                />
              </div>
            </div>

            {/* Typography Section */}
            <div className="mt-12 text-center space-y-3">
              <h1 className="text-white text-2xl font-light tracking-[0.2em] uppercase">
                Dindigul Ananda's <span className="text-primary font-bold">Briyani</span>
              </h1>
              
              {/* Progress Line */}
              <div className="w-48 h-[1px] bg-zinc-800 mx-auto relative overflow-hidden">
                <div className="absolute inset-0 bg-primary animate-[loading_1.5s_ease-in-out_infinite]" />
              </div>
              
              <p className="text-zinc-500 text-[10px] tracking-[0.3em] uppercase animate-pulse">
                Preparing your experience
              </p>
            </div>
          </div>
        </div>
      }
    >
      <CustomerView tableId={tableId} mode={tableId === 'Takeaway' ? 'takeaway' : 'dine-in'} />
    </Suspense>
  );
}
