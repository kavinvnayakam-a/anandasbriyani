
"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, Loader2, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, runTransaction } from "firebase/firestore";

type CartSheetProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  tableId: string | null;
};

export function CartSheet({ isOpen, onOpenChange, tableId }: CartSheetProps) {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const firestore = useFirestore();

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || !firestore) return;
    setIsPlacingOrder(true);

    try {
      const today = new Date().toISOString().split('T')[0]; 
      const counterRef = doc(firestore, "daily_stats", today);

      const orderNumber = await runTransaction(firestore, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let newCount = 1;
        if (counterDoc.exists()) {
          newCount = counterDoc.data().count + 1;
          if (newCount > 1000) newCount = 1;
        }
        transaction.set(counterRef, { count: newCount }, { merge: true });
        return newCount.toString().padStart(4, '0');
      });

      const orderData = {
        orderNumber,
        tableId: tableId || "Takeaway",
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        totalPrice: cartTotal,
        status: 'Pending',
        timestamp: serverTimestamp(),
        createdAt: Date.now(),
      };

      const docRef = await addDoc(collection(firestore, "orders"), orderData);

      toast({
        title: `Order #${orderNumber} Confirmed!`,
        description: "ART Cinemas kitchen is preparing your treats.",
        className: "bg-primary text-black border-none shadow-2xl",
      });

      clearCart();
      onOpenChange(false);
      router.push(`/order-status/${docRef.id}`);

    } catch (error) {
      toast({
        title: "Order Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="flex flex-col bg-zinc-950 border-l border-primary/20 w-[90vw] sm:max-w-md p-0 overflow-hidden"
      >
        <SheetHeader className="p-8 border-b border-primary/10 bg-zinc-900/30 backdrop-blur-md">
          <SheetTitle className="text-2xl font-bold text-white flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-1">Your Selection</span>
              <span className="font-black italic uppercase text-white/90">{tableId ? `Seat ${tableId}` : 'Takeaway Order'}</span>
            </div>
            <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20">
              <ShoppingBag className="text-primary h-6 w-6" />
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-2 border border-primary/10">
                <ShoppingBag size={40} className="text-primary/10" />
              </div>
              <p className="text-primary/20 font-black uppercase tracking-[0.4em] text-[10px]">Your tray is empty</p>
            </div>
          ) : (
            <div className="space-y-8 pt-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-start gap-5 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="relative h-20 w-20 shrink-0 shadow-2xl">
                    {item.image ? (
                      <Image 
                        src={item.image} 
                        alt={item.name} 
                        fill 
                        className="rounded-2xl object-cover border border-primary/20"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-zinc-900 border border-primary/20">
                        <ImageIcon className="h-8 w-8 text-primary/10" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="font-bold text-white text-base leading-tight truncate">
                      {item.name}
                    </p>
                    <p className="text-primary font-black text-sm mt-1">
                      {formatCurrency(item.price)}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center bg-zinc-900 rounded-full border border-primary/20 p-1">
                        <button 
                          className="w-8 h-8 flex items-center justify-center hover:bg-primary hover:text-black rounded-full transition-all text-primary/40"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4"/>
                        </button>
                        <span className="w-10 text-center font-black text-sm text-primary tabular-nums">{item.quantity}</span>
                        <button 
                          className="w-8 h-8 flex items-center justify-center hover:bg-primary hover:text-black rounded-full transition-all text-primary/40"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4"/>
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    className="p-3 text-primary/20 hover:text-red-500 transition-colors mt-1"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-5 w-5"/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <SheetFooter className="p-10 bg-zinc-950 border-t border-primary/10 mt-auto shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
            <div className="w-full space-y-10">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">Total Amount</span>
                  <div className="text-4xl font-black text-primary tracking-tighter tabular-nums mt-1">
                    {formatCurrency(cartTotal)}
                  </div>
                </div>
                <div className="h-10 w-0.5 bg-primary/20 rounded-full" />
              </div>
              
              <Button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="w-full h-16 text-[10px] font-black uppercase tracking-[0.3em] bg-primary text-black hover:bg-white rounded-full transition-all flex items-center justify-center gap-4 shadow-2xl shadow-primary/20 active:scale-95"
              >
                {isPlacingOrder ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    Confirm Order
                    <ShoppingBag className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
