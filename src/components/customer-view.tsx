"use client"

import { useState } from 'react';
import { useSessionTimer } from '@/hooks/use-session-timer';
import { useCart } from '@/hooks/use-cart';
import { menuItems } from '@/lib/menu-data';
import { Header } from '@/components/header';
import { MenuItemCard } from '@/components/menu-item-card';
import { CartSheet } from '@/components/cart-sheet';
import { CartIcon } from '@/components/cart-icon';
import TableSelection from './table-selection';

export default function CustomerView({ tableId }: { tableId: string | null }) {
  const { clearCart, addToCart } = useCart();
  const [isCartOpen, setCartOpen] = useState(false);

  useSessionTimer(() => {
    clearCart();
  });

  if (!tableId) {
    return <TableSelection />;
  }

  return (
    <>
      <Header tableId={tableId} onCartClick={() => setCartOpen(true)} />
      <main className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {menuItems.map((item) => (
            <MenuItemCard key={item.id} item={item} onAddToCart={addToCart} />
          ))}
        </div>
      </main>
      <CartSheet isOpen={isCartOpen} onOpenChange={setCartOpen} tableId={tableId} />
      {/* Floating Cart Button for mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
          <CartIcon onOpen={() => setCartOpen(true)} />
      </div>
    </>
  );
}
