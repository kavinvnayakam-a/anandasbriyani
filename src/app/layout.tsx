import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from '@/context/cart-context'; // Import the provider
import { FirebaseClientProvider } from '@/firebase/client-provider';
import Link from 'next/link';
import { MessageCircleQuestion } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Grillicious',
  description: 'Sizzling flavors, delivered fast.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased font-bold">
        {/* Wrap everything in the Firebase provider */}
        <FirebaseClientProvider>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </FirebaseClientProvider>
        <Link href="mailto:info@getpik.in" className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white p-4 rounded-full shadow-lg border-2 border-[#d4af37] hover:bg-zinc-800 transition-colors">
            <MessageCircleQuestion className="h-6 w-6" />
            <span className="sr-only">Support</span>
        </Link>
      </body>
    </html>
  );
}
