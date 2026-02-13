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
        description: "Dasara's chef has started preparing your feast.",
        className: "bg-primary text-white border-none shadow-2xl",
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
        className="flex flex-col bg-orange-50 border-l border-orange-100 w-[90vw] sm:max-w-md p-0 overflow-hidden"
      >
        <SheetHeader className="p-8 border-b border-orange-50 bg-white">
          <SheetTitle className="text-2xl font-bold text-slate-900 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-1">Your Selection</span>
              <span className="font-serif italic">{tableId ? `Table ${tableId}` : 'Takeaway Order'}</span>
            </div>
            <div className="bg-orange-50 p-3 rounded-2xl">
              <ShoppingBag className="text-primary h-5 w-5" />
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                <ShoppingBag size={32} className="text-orange-300" />
              </div>
              <p className="text-orange-400 font-bold uppercase tracking-widest text-[10px]">Your tray is empty</p>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-start gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="relative h-16 w-16 shrink-0 shadow-sm">
                    {item.image ? (
                      <Image 
                        src={item.image} 
                        alt={item.name} 
                        fill 
                        className="rounded-xl object-cover border border-orange-100"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-xl bg-orange-50 border border-orange-100">
                        <ImageIcon className="h-6 w-6 text-orange-200" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="font-bold text-slate-800 text-sm leading-tight truncate">
                      {item.name}
                    </p>
                    <p className="text-primary font-bold text-xs mt-1">
                      {formatCurrency(item.price)}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center bg-white rounded-full border border-orange-100 p-1 shadow-sm">
                        <button 
                          className="w-6 h-6 flex items-center justify-center hover:bg-orange-50 rounded-full transition-colors text-slate-400"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3"/>
                        </button>
                        <span className="w-8 text-center font-bold text-xs text-slate-700 tabular-nums">{item.quantity}</span>
                        <button 
                          className="w-6 h-6 flex items-center justify-center hover:bg-orange-50 rounded-full transition-colors text-slate-400"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3"/>
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors mt-1"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-4 w-4"/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <SheetFooter className="p-8 bg-white border-t border-orange-100 mt-auto shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
            <div className="w-full space-y-6">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Grand Total</span>
                  <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
                    {formatCurrency(cartTotal)}
                  </div>
                </div>
                <div className="h-8 w-[2px] bg-orange-100 rounded-full" />
              </div>
              
              <Button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="w-full h-14 text-xs font-bold uppercase tracking-widest bg-primary text-white hover:bg-orange-600 rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-900/10 active:scale-95"
              >
                {isPlacingOrder ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <>
                    Confirm Dining Order
                    <Plus className="h-4 w-4 bg-white/20 rounded-full p-0.5" />
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