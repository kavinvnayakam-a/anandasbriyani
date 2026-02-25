import CustomerView from '@/components/customer-view';
import { Suspense } from 'react';
import Image from 'next/image';

const LOGO_URL = "https://picsum.photos/seed/dindigul/200/200";

export default async function Home() {
  return (
    <Suspense 
      fallback={
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#050505] overflow-hidden">
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
                  className="opacity-90 grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
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
      <CustomerView tableId="Takeaway" mode="takeaway" />
    </Suspense>
  );
}
