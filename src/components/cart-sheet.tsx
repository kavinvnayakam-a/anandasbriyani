"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, Loader2, ImageIcon, CreditCard, Banknote, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, runTransaction } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type CartSheetProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  tableId: string | null;
};

export function CartSheet({ isOpen, onOpenChange, tableId }: CartSheetProps) {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const firestore = useFirestore();

  // Checkout Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Cash' | 'UPI'>('UPI');

  const handleOpenCheckout = () => {
    if (cartItems.length === 0) return;
    setIsCheckoutOpen(true);
  };

  const handlePlaceOrder = async () => {
    if (!customerName || !customerPhone || !firestore) {
      toast({
        title: "Missing Details",
        description: "Please provide your name and phone number.",
        variant: "destructive",
      });
      return;
    }

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
        customerName,
        customerPhone,
        paymentMethod,
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
        description: "RAVOYI kitchen is preparing your treats.",
        className: "bg-[#b8582e] text-white border-none shadow-2xl font-black uppercase",
      });

      clearCart();
      setIsCheckoutOpen(false);
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
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent 
          side="right" 
          className="flex flex-col bg-[#b8582e] border-l border-white/20 w-[90vw] sm:max-w-md p-0 overflow-hidden"
        >
          <SheetHeader className="p-8 border-b border-white/10 bg-black/10 backdrop-blur-md">
            <SheetTitle className="text-2xl font-bold text-white flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-1">Your Selection</span>
                <span className="font-black italic uppercase text-white/90">{tableId || 'Takeaway Order'}</span>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                <ShoppingBag className="text-white h-6 w-6" />
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="w-24 h-24 bg-black/10 rounded-full flex items-center justify-center mb-2 border border-white/10">
                  <ShoppingBag size={40} className="text-white/10" />
                </div>
                <p className="text-white/20 font-black uppercase tracking-[0.4em] text-[10px]">Your tray is empty</p>
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
                          className="rounded-2xl object-cover border border-white/20"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-black/20 border border-white/20">
                          <ImageIcon className="h-8 w-8 text-white/10" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="font-bold text-white text-base leading-tight truncate">
                        {item.name}
                      </p>
                      <p className="text-white/80 font-black text-sm mt-1">
                        {formatCurrency(item.price)}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center bg-black/20 rounded-full border border-white/20 p-1">
                          <button 
                            className="w-8 h-8 flex items-center justify-center hover:bg-white hover:text-[#b8582e] rounded-full transition-all text-white/40"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4"/>
                          </button>
                          <span className="w-10 text-center font-black text-sm text-white tabular-nums">{item.quantity}</span>
                          <button 
                            className="w-8 h-8 flex items-center justify-center hover:bg-white hover:text-[#b8582e] rounded-full transition-all text-white/40"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4"/>
                          </button>
                        </div>
                      </div>
                    </div>

                    <button 
                      className="p-3 text-white/20 hover:text-white transition-colors mt-1"
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
            <SheetFooter className="p-10 bg-black/20 border-t border-white/10 mt-auto">
              <div className="w-full space-y-10">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Total Amount</span>
                    <div className="text-4xl font-black text-white tracking-tighter tabular-nums mt-1">
                      {formatCurrency(cartTotal)}
                    </div>
                  </div>
                  <div className="h-10 w-0.5 bg-white/20 rounded-full" />
                </div>
                
                <Button
                  onClick={handleOpenCheckout}
                  className="w-full h-16 text-[10px] font-black uppercase tracking-[0.3em] bg-white text-[#b8582e] hover:bg-black hover:text-white rounded-full transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 border-none"
                >
                  Confirm Order
                  <ShoppingBag className="h-4 w-4" />
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Details Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="bg-[#b8582e] text-white border-white/20 sm:max-w-[425px] rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Order Details</DialogTitle>
            <DialogDescription className="text-white/60 text-xs font-bold uppercase tracking-widest">
              Please provide your contact information and select a payment method.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Your Name</Label>
              <Input
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className="bg-black/20 border-white/10 text-white rounded-2xl h-12 placeholder:text-white/20 focus:ring-white/30"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter your mobile number"
                className="bg-black/20 border-white/10 text-white rounded-2xl h-12 placeholder:text-white/20 focus:ring-white/30"
              />
            </div>
            
            <div className="grid gap-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Payment Method</Label>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={(v: any) => setPaymentMethod(v)}
                className="grid grid-cols-3 gap-3"
              >
                <Label
                  htmlFor="upi"
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                    paymentMethod === 'UPI' ? "bg-white text-[#b8582e] border-white" : "bg-black/10 border-white/10 text-white/60"
                  )}
                >
                  <RadioGroupItem value="UPI" id="upi" className="sr-only" />
                  <Smartphone className="h-5 w-5" />
                  <span className="text-[9px] font-black uppercase">UPI</span>
                </Label>
                <Label
                  htmlFor="card"
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                    paymentMethod === 'Card' ? "bg-white text-[#b8582e] border-white" : "bg-black/10 border-white/10 text-white/60"
                  )}
                >
                  <RadioGroupItem value="Card" id="card" className="sr-only" />
                  <CreditCard className="h-5 w-5" />
                  <span className="text-[9px] font-black uppercase">Card</span>
                </Label>
                <Label
                  htmlFor="cash"
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                    paymentMethod === 'Cash' ? "bg-white text-[#b8582e] border-white" : "bg-black/10 border-white/10 text-white/60"
                  )}
                >
                  <RadioGroupItem value="Cash" id="cash" className="sr-only" />
                  <Banknote className="h-5 w-5" />
                  <span className="text-[9px] font-black uppercase">Cash</span>
                </Label>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button 
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder || !customerName || !customerPhone}
              className="w-full h-14 bg-white text-[#b8582e] hover:bg-black hover:text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl transition-all active:scale-95 border-none"
            >
              {isPlacingOrder ? <Loader2 className="animate-spin" /> : "Complete Checkout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
