
"use client"

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, 
  updateDoc, setDoc, addDoc, serverTimestamp, runTransaction 
} from 'firebase/firestore';
import { Order, MenuItem, CartItem } from '@/lib/types';
import { 
  Printer, Settings, Check, Clock, User, Phone, Banknote, Store, X, Save, Plus, Minus, Search, ShoppingBag, CreditCard, Smartphone, Loader2, ReceiptText, ShieldCheck, Wallet, Hash
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn, formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface PrintSettings {
  storeName: string;
  address: string;
  phone: string;
  gstin: string;
  fssai: string;
  footerMessage: string;
  paperWidth: '58mm' | '80mm';
  triggerCashDrawer: boolean;
}

const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  storeName: "RAVOYI Kitchen",
  address: "Authentic Telangana Kitchen, Hyderabad",
  phone: "+91 98765 43210",
  gstin: "36ABCDE1234F1Z5",
  fssai: "12345678901234",
  footerMessage: "Thank you for visiting RAVOYI! Savor the spice.",
  paperWidth: '80mm',
  triggerCashDrawer: false
};

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  // State for cash received on existing orders in the feed
  const [feedCashReceived, setFeedCashReceived] = useState<Record<string, string>>({});

  // New Order State (Manual)
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Cash' | 'UPI'>('Cash');
  const [cashReceived, setCashReceived] = useState("");
  const [menuSearch, setMenuSearch] = useState("");

  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);

  useEffect(() => {
    if (!firestore) return;
    
    const q = query(collection(firestore, "orders"), orderBy("timestamp", "desc"));
    const unsubOrders = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
    });

    const unsubMenu = onSnapshot(collection(firestore, "menu_items"), (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[]);
    });

    const unsubSettings = onSnapshot(doc(firestore, "settings", "print_template"), (d) => {
      if (d.exists()) {
        setPrintSettings({ ...DEFAULT_PRINT_SETTINGS, ...d.data() } as PrintSettings);
      }
    });

    return () => { unsubOrders(); unsubMenu(); unsubSettings(); };
  }, [firestore]);

  const calculateTotals = () => {
    const subtotal = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const total = subtotal + cgst + sgst;
    return { subtotal, cgst, sgst, total };
  };

  const totals = useMemo(() => calculateTotals(), [selectedItems]);
  const changeDue = useMemo(() => {
    const received = Number(cashReceived) || 0;
    return Math.max(0, received - totals.total);
  }, [cashReceived, totals.total]);

  const confirmOrder = async (order: Order) => {
    if (!firestore) return;
    
    const receivedAmount = feedCashReceived[order.id] ? Number(feedCashReceived[order.id]) : order.totalPrice;
    
    if (order.paymentMethod === 'Cash' && receivedAmount < order.totalPrice) {
      toast({ variant: "destructive", title: "Insufficient Cash", description: "Please enter correct amount received." });
      return;
    }

    try {
      const updates: any = { status: "Received" };
      if (order.paymentMethod === 'Cash') {
        updates.cashReceived = receivedAmount;
        updates.changeDue = receivedAmount - order.totalPrice;
      }

      await updateDoc(doc(firestore, "orders", order.id), updates);
      
      const updatedOrder = { ...order, ...updates };
      setPrintingOrder(updatedOrder);
      setShowPrintPreview(true);
      
      if (order.paymentMethod === 'Cash' && printSettings.triggerCashDrawer) {
        toast({ title: "Opening Cash Drawer...", description: "Secure tray released." });
      }
      toast({ title: "Order Confirmed", description: "Preview generated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not confirm order." });
    }
  };

  const executePrint = () => {
    window.print();
    setShowPrintPreview(false);
  };

  const saveSettings = async () => {
    if (!firestore) return;
    await setDoc(doc(firestore, "settings", "print_template"), printSettings);
    setShowSettings(false);
    toast({ title: "Settings Saved", description: "Print template updated." });
  };

  const handleAddItem = (item: MenuItem) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const handleCreateOrder = async () => {
    if (!firestore || selectedItems.length === 0 || !customerName) {
      toast({ variant: "destructive", title: "Incomplete Details", description: "Add items and customer name." });
      return;
    }

    if (paymentMethod === 'Cash' && (Number(cashReceived) < totals.total)) {
      toast({ variant: "destructive", title: "Insufficient Cash", description: "Received amount must be equal or greater than total." });
      return;
    }

    setIsPlacingOrder(true);
    const { subtotal, cgst, sgst, total } = totals;

    try {
      const today = new Date().toISOString().split('T')[0];
      const counterRef = doc(firestore, "daily_stats", today);

      const orderNumber = await runTransaction(firestore, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let newCount = 1;
        if (counterDoc.exists()) {
          newCount = counterDoc.data().count + 1;
        }
        transaction.set(counterRef, { count: newCount }, { merge: true });
        return newCount.toString().padStart(4, '0');
      });

      const orderData = {
        orderNumber,
        tableId: "Takeaway",
        customerName,
        customerPhone: customerPhone || "N/A",
        paymentMethod,
        cashReceived: paymentMethod === 'Cash' ? Number(cashReceived) : null,
        changeDue: paymentMethod === 'Cash' ? changeDue : null,
        items: selectedItems,
        subtotal,
        cgst,
        sgst,
        totalPrice: total,
        status: 'Received',
        timestamp: serverTimestamp(),
        createdAt: Date.now(),
      };

      const docRef = await addDoc(collection(firestore, "orders"), orderData);
      
      toast({ title: `Order #${orderNumber} Created`, description: "Opening preview." });
      
      setSelectedItems([]);
      setCustomerName("");
      setCustomerPhone("");
      setCashReceived("");
      setShowNewOrder(false);
      
      // Use local timestamp for immediate preview
      const finalOrder = { id: docRef.id, ...orderData, timestamp: { seconds: Math.floor(Date.now() / 1000) } } as Order;
      setPrintingOrder(finalOrder);
      setShowPrintPreview(true);

    } catch (error) {
      toast({ variant: "destructive", title: "Order Failed", description: "Could not create manual order." });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const filteredMenu = useMemo(() => {
    return menuItems.filter(item => 
      item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(menuSearch.toLowerCase())
    );
  }, [menuItems, menuSearch]);

  const formatOrderTime = (ts: any) => {
    if (!ts) return "";
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatOrderDate = (ts: any) => {
    if (!ts) return "";
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const pendingOrders = orders.filter(o => o.status === 'Pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-xl">
        <div className="flex items-center gap-6">
           <div className="p-4 bg-[#b8582e]/10 rounded-2xl text-[#b8582e]">
              <Store size={32} />
           </div>
           <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-900">Counter Feed</h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Manage incoming and manual orders</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowNewOrder(true)}
            className="flex items-center gap-3 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black uppercase italic text-xs shadow-xl shadow-zinc-900/20 hover:bg-[#b8582e] transition-all"
          >
            <Plus size={18} /> New Manual Order
          </button>
          <button onClick={() => setShowSettings(true)} className="p-4 bg-white text-zinc-400 rounded-2xl hover:text-[#b8582e] transition-all border border-zinc-200 shadow-sm">
            <Settings size={20}/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pendingOrders.map((order) => {
          const cashInputVal = feedCashReceived[order.id] || "";
          const change = Math.max(0, (Number(cashInputVal) || order.totalPrice) - order.totalPrice);
          const orderSubtotal = order.subtotal || (order.totalPrice / 1.05);
          const orderCgst = order.cgst || ((order.totalPrice - orderSubtotal) / 2);
          const orderSgst = order.sgst || ((order.totalPrice - orderSubtotal) / 2);

          return (
            <div key={order.id} className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 flex flex-col transition-all shadow-lg hover:shadow-2xl hover:border-[#b8582e]/30 group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 flex items-center justify-center">
                    <span className="text-2xl font-black text-[#b8582e] italic leading-none">#{order.orderNumber}</span>
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-none mb-1">Status</p>
                     <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-[9px] font-black uppercase border border-orange-200">Pending</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                   <div className="flex items-center gap-2 text-zinc-400 font-bold text-[10px] uppercase">
                      <Clock size={12}/> {formatOrderTime(order.timestamp)}
                   </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <User size={16} className="text-[#b8582e]" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest leading-none">Customer</span>
                    <span className="text-xs font-bold uppercase italic text-zinc-900">{order.customerName}</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest ml-1 mb-2">Order Items</p>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <span className="text-[#b8582e] font-black italic text-xs">{item.quantity}x</span>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase italic text-zinc-900 truncate max-w-[120px]">{item.name}</span>
                          <span className="text-[8px] font-bold text-zinc-400 uppercase">MRP: ₹{item.price}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-zinc-900">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2">
                  <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest leading-none mb-2">Order Summary</p>
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase">
                    <span>Subtotal</span>
                    <span>₹{orderSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase">
                    <span>CGST (2.5%)</span>
                    <span>₹{orderCgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase">
                    <span>SGST (2.5%)</span>
                    <span>₹{orderSgst.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-[#b8582e]/5 rounded-2xl border border-[#b8582e]/10">
                  <Banknote size={16} className="text-[#b8582e]" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest leading-none">Grand Total</span>
                    <span className="text-lg font-black italic text-[#b8582e] leading-none">₹{order.totalPrice} ({order.paymentMethod})</span>
                  </div>
                </div>

                {order.paymentMethod === 'Cash' && (
                  <div className="p-4 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 space-y-3">
                    <Label className="text-[9px] font-black uppercase text-zinc-400">Reconcile Cash</Label>
                    <div className="flex gap-3">
                      <Input 
                        placeholder="Amount Received" 
                        value={cashInputVal}
                        onChange={(e) => setFeedCashReceived(prev => ({...prev, [order.id]: e.target.value}))}
                        className="bg-white border-zinc-200 h-10 text-xs font-black text-black"
                      />
                      <div className="flex flex-col justify-center">
                        <span className="text-[8px] font-black text-zinc-400 uppercase">Change</span>
                        <span className="text-xs font-black text-emerald-600">₹{change}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => confirmOrder(order)} 
                className="mt-auto w-full py-5 bg-[#b8582e] text-white rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-zinc-900 transition-all active:scale-95"
              >
                <Check size={20}/> Confirm & Print
              </button>
            </div>
          );
        })}
      </div>

      {/* NEW ORDER DIALOG */}
      <Dialog open={showNewOrder} onOpenChange={setShowNewOrder}>
        <DialogContent className="max-w-5xl bg-zinc-50 rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col h-[90vh]">
          <DialogHeader className="p-8 bg-white border-b border-zinc-100">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-zinc-900">Manual Order Entry</DialogTitle>
                <DialogDescription className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Take orders directly at the counter</DialogDescription>
              </div>
              <button onClick={() => setShowNewOrder(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={24} className="text-zinc-400" />
              </button>
            </div>
          </DialogHeader>

          <div className="flex-1 flex overflow-hidden">
            <div className="w-1/2 border-r border-zinc-200 flex flex-col bg-white">
              <div className="p-6 border-b border-zinc-100">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                  <Input 
                    placeholder="Search Menu..." 
                    className="pl-12 h-12 bg-zinc-50 border-none rounded-2xl font-bold text-black"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                  />
                </div>
              </div>
              <ScrollArea className="flex-1 p-6">
                <div className="grid grid-cols-1 gap-3">
                  {filteredMenu.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleAddItem(item)}
                      className="flex items-center justify-between p-4 bg-zinc-50 hover:bg-[#b8582e]/5 border border-zinc-100 rounded-2xl transition-all group"
                    >
                      <div className="text-left">
                        <p className="font-black italic uppercase text-xs text-zinc-900 leading-none mb-1">{item.name}</p>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{item.category}</p>
                      </div>
                      <span className="font-black italic text-[#b8582e]">₹{item.price}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="w-1/2 flex flex-col p-8 space-y-6 bg-zinc-50">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Customer Name</Label>
                    <Input 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Kumar"
                      className="bg-white border-zinc-200 h-12 rounded-xl font-bold text-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Phone Number (Optional)</Label>
                    <Input 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Mobile number"
                      className="bg-white border-zinc-200 h-12 rounded-xl font-bold text-black"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Payment Method</Label>
                  <RadioGroup 
                    value={paymentMethod} 
                    onValueChange={(v: any) => setPaymentMethod(v)}
                    className="grid grid-cols-3 gap-3"
                  >
                    <Label htmlFor="m-upi" className={cn("flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all", paymentMethod === 'UPI' ? "bg-white border-[#b8582e] text-[#b8582e] shadow-lg" : "bg-white/50 border-zinc-100 text-zinc-400")}>
                      <RadioGroupItem value="UPI" id="m-upi" className="sr-only" />
                      <Smartphone size={18} />
                      <span className="text-[9px] font-black uppercase">UPI</span>
                    </Label>
                    <Label htmlFor="m-cash" className={cn("flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all", paymentMethod === 'Cash' ? "bg-white border-[#b8582e] text-[#b8582e] shadow-lg" : "bg-white/50 border-zinc-100 text-zinc-400")}>
                      <RadioGroupItem value="Cash" id="m-cash" className="sr-only" />
                      <Banknote size={18} />
                      <span className="text-[9px] font-black uppercase">Cash</span>
                    </Label>
                    <Label htmlFor="m-card" className={cn("flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 cursor-pointer transition-all", paymentMethod === 'Card' ? "bg-white border-[#b8582e] text-[#b8582e] shadow-lg" : "bg-white/50 border-zinc-100 text-zinc-400")}>
                      <RadioGroupItem value="Card" id="m-card" className="sr-only" />
                      <CreditCard size={18} />
                      <span className="text-[9px] font-black uppercase">Card</span>
                    </Label>
                  </RadioGroup>
                </div>

                {paymentMethod === 'Cash' && (
                  <div className="bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-6 items-center">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Cash Received (₹)</Label>
                        <Input 
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder="0.00"
                          className="bg-zinc-50 border-zinc-100 h-14 text-2xl font-black text-black rounded-2xl focus:ring-[#b8582e]/20"
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Change Due</p>
                        <p className={cn("text-3xl font-black italic tracking-tighter tabular-nums", changeDue > 0 ? "text-emerald-600" : "text-zinc-200")}>
                          ₹{changeDue}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3">Selected Items ({selectedItems.length})</Label>
                <ScrollArea className="flex-1 bg-white rounded-[2rem] border border-zinc-100 p-4">
                  {selectedItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl mb-2">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-bold text-zinc-900 text-xs truncate leading-none mb-1">{item.name}</p>
                        <p className="text-[10px] font-black text-[#b8582e]">₹{item.price * item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 hover:bg-white rounded-lg transition-colors text-zinc-400">
                          {item.quantity > 1 ? <Minus size={14} /> : <X size={14} />}
                        </button>
                        <span className="text-xs font-black w-6 text-center text-zinc-900">{item.quantity}</span>
                        <button onClick={() => handleAddItem(item)} className="p-1.5 hover:bg-white rounded-lg transition-colors text-[#b8582e]">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              <div className="pt-4 border-t border-zinc-200">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Total Amount</span>
                    <span className="text-4xl font-black italic text-zinc-900 tracking-tighter">₹{totals.total}</span>
                  </div>
                  <button 
                    onClick={handleCreateOrder}
                    disabled={isPlacingOrder || selectedItems.length === 0 || (paymentMethod === 'Cash' && Number(cashReceived) < totals.total) || !customerName}
                    className="h-14 px-10 bg-[#b8582e] text-white rounded-2xl font-black uppercase italic text-xs shadow-xl flex items-center gap-3 disabled:bg-zinc-200 disabled:text-zinc-400 transition-all"
                  >
                    {isPlacingOrder ? <Loader2 className="animate-spin" /> : <Check size={20} />}
                    Finalize Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PRINT PREVIEW DIALOG */}
      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="max-w-lg bg-zinc-900 border-zinc-800 p-0 overflow-hidden rounded-[3rem] shadow-2xl">
          <DialogHeader className="p-8 border-b border-zinc-800 flex justify-between items-center bg-black/40">
             <div>
                <DialogTitle className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                   <ReceiptText className="text-[#b8582e]" /> Receipt Preview
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Verify Slips Before Printing</DialogDescription>
             </div>
             <button onClick={() => setShowPrintPreview(false)} className="p-2 text-zinc-500 hover:text-white">
                <X size={20} />
             </button>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] p-10 bg-zinc-950 flex flex-col items-center gap-10">
            {/* 1. Customer Receipt */}
            <div 
              className="bg-white text-black p-8 shadow-2xl font-mono text-[11px] relative" 
              style={{ width: printSettings.paperWidth === '58mm' ? '220px' : '300px' }}
            >
              <div className="text-center border-b border-dashed border-black pb-4 mb-4">
                <h1 className="text-lg font-black uppercase">{printSettings.storeName}</h1>
                <p className="uppercase text-[9px] leading-tight">{printSettings.address}</p>
                <p className="text-[9px]">Tel: {printSettings.phone}</p>
                <p className="text-[9px] font-bold">GST: {printSettings.gstin}</p>
                <p className="text-[9px] font-bold">FSSAI: {printSettings.fssai}</p>
              </div>

              {printingOrder && (
                <>
                  <div className="mb-4 border-b border-dashed border-black pb-2">
                    <div className="flex justify-between font-bold">
                      <span>ORD: #{printingOrder.orderNumber}</span>
                      <span>{formatOrderTime(printingOrder.timestamp)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] mt-1">
                      <span>BILL DATE: {formatOrderDate(printingOrder.timestamp)}</span>
                      <span>{formatOrderTime(printingOrder.timestamp)}</span>
                    </div>
                    <p className="truncate uppercase mt-1">CUST: {printingOrder.customerName}</p>
                  </div>

                  <div className="border-b border-dashed border-black pb-2 mb-2">
                    {printingOrder.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 mb-1">
                        <span className="col-span-2">{item.quantity}x</span>
                        <span className="col-span-7 uppercase truncate">{item.name}</span>
                        <span className="col-span-3 text-right">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-right font-black text-sm mb-4">
                    <div className="flex justify-between text-[9px] opacity-60">
                      <span>SUBTOTAL</span>
                      <span>₹{printingOrder.subtotal?.toFixed(2) || (printingOrder.totalPrice / 1.05).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] opacity-60">
                      <span>CGST (2.5%)</span>
                      <span>₹{printingOrder.cgst?.toFixed(2) || ((printingOrder.totalPrice - (printingOrder.totalPrice / 1.05)) / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] opacity-60">
                      <span>SGST (2.5%)</span>
                      <span>₹{printingOrder.sgst?.toFixed(2) || ((printingOrder.totalPrice - (printingOrder.totalPrice / 1.05)) / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-black pt-2 mt-1">
                      <span>GRAND TOTAL</span>
                      <span>₹{printingOrder.totalPrice}</span>
                    </div>
                    {printingOrder.paymentMethod === 'Cash' && (
                      <div className="text-[9px] mt-2 space-y-1 opacity-60">
                        <div className="flex justify-between">
                          <span>RECEIVED</span>
                          <span>₹{printingOrder.cashReceived || printingOrder.totalPrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CHANGE DUE</span>
                          <span>₹{printingOrder.changeDue || 0}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-center pt-4 border-t border-dashed border-black opacity-60">
                    <p className="italic text-[8px]">{printSettings.footerMessage}</p>
                  </div>
                </>
              )}
            </div>

            {/* Visual Divider / Cut Simulation */}
            <div className="w-full flex items-center gap-4 py-4 px-10">
               <div className="h-px flex-1 bg-zinc-800" />
               <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Auto-Cut Line</span>
               <div className="h-px flex-1 bg-zinc-800" />
            </div>

            {/* 2. Kitchen Token (KOT) */}
            <div 
              className="bg-white text-black p-8 shadow-2xl font-mono text-center border-t-4 border-zinc-200" 
              style={{ width: printSettings.paperWidth === '58mm' ? '220px' : '300px' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2">Collection Token</p>
              <h2 className="text-5xl font-black italic">#{printingOrder?.orderNumber}</h2>
              <div className="mt-4 pt-4 border-t border-dashed border-black">
                 <p className="text-xs font-bold uppercase">{printingOrder?.customerName}</p>
                 <p className="text-[8px] mt-1 opacity-60">RAVOYI KITCHEN</p>
              </div>
            </div>
          </ScrollArea>

          <div className="p-8 bg-zinc-900 flex flex-col gap-4">
             <div className="flex gap-4">
                <button 
                  onClick={() => {
                    toast({ title: "Tray Released", description: "Hardware command sent to drawer." });
                  }}
                  className="flex-1 py-4 bg-zinc-800 text-white rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all"
                >
                  <Wallet size={14} /> Open Tray
                </button>
                <button onClick={() => setShowPrintPreview(false)} className="flex-1 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-black uppercase text-[10px]">Discard</button>
             </div>
             <button onClick={executePrint} className="w-full py-5 bg-[#b8582e] text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-zinc-900 transition-all">
                <Printer size={18} /> Execute Print
             </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SETTINGS DIALOG */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md bg-white rounded-[2rem] p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900">Receipt Configuration</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 uppercase font-bold">Configure headers and hardware triggers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-zinc-400">Store Name</Label>
                <Input value={printSettings.storeName || ""} onChange={(e) => setPrintSettings({...printSettings, storeName: e.target.value})} className="rounded-xl border-2 font-bold text-black" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-zinc-400">GSTIN</Label>
                <Input value={printSettings.gstin || ""} onChange={(e) => setPrintSettings({...printSettings, gstin: e.target.value})} className="rounded-xl border-2 font-bold uppercase text-black" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-zinc-400">FSSAI Number</Label>
                <Input value={printSettings.fssai || ""} onChange={(e) => setPrintSettings({...printSettings, fssai: e.target.value})} className="rounded-xl border-2 font-bold text-black" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-zinc-400">Phone</Label>
                <Input value={printSettings.phone || ""} onChange={(e) => setPrintSettings({...printSettings, phone: e.target.value})} className="rounded-xl border-2 font-bold text-black" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-400">Paper Size</Label>
              <RadioGroup 
                value={printSettings.paperWidth} 
                onValueChange={(v: any) => setPrintSettings({...printSettings, paperWidth: v})}
                className="grid grid-cols-2 gap-4"
              >
                <Label htmlFor="p-58" className={cn("flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer font-bold", printSettings.paperWidth === '58mm' ? "border-[#b8582e] text-[#b8582e] bg-[#b8582e]/5" : "border-zinc-100 text-zinc-400")}>
                  <RadioGroupItem value="58mm" id="p-58" className="sr-only" />
                  58mm (Small)
                </Label>
                <Label htmlFor="p-80" className={cn("flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer font-bold", printSettings.paperWidth === '80mm' ? "border-[#b8582e] text-[#b8582e] bg-[#b8582e]/5" : "border-zinc-100 text-zinc-400")}>
                  <RadioGroupItem value="80mm" id="p-80" className="sr-only" />
                  80mm (Large)
                </Label>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-zinc-400">Footer Message</Label>
              <Textarea value={printSettings.footerMessage || ""} onChange={(e) => setPrintSettings({...printSettings, footerMessage: e.target.value})} className="rounded-xl border-2 font-bold text-black min-h-[80px]" />
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-zinc-900">Trigger Cash Drawer</span>
                  <span className="text-[8px] font-bold text-zinc-400 uppercase">Open tray automatically on cash prints</span>
               </div>
               <Switch 
                checked={printSettings.triggerCashDrawer} 
                onCheckedChange={(checked) => setPrintSettings({...printSettings, triggerCashDrawer: checked})} 
               />
            </div>
          </div>
          <DialogFooter>
            <button onClick={saveSettings} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase flex items-center justify-center gap-2">
              <Save size={18} /> Update Template
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PRINTABLE COMPONENT */}
      <div id="printable-receipt" className="hidden print:block font-mono text-black" style={{ width: printSettings.paperWidth }}>
        {printSettings.triggerCashDrawer && (
          <span className="hidden">{"\x1b\x70\x00\x19\xfa"}</span>
        )}
        
        {/* 1. MAIN RECEIPT */}
        <div className="receipt-section">
          <div className="p-4 text-center border-b border-dashed border-black">
            <h1 className="text-xl font-black uppercase">{printSettings.storeName}</h1>
            <p className="text-[10px]">{printSettings.address}</p>
            <p className="text-[10px]">Tel: {printSettings.phone}</p>
            <p className="text-[10px] font-bold">GST: {printSettings.gstin}</p>
            <p className="text-[10px] font-bold">FSSAI: {printSettings.fssai}</p>
          </div>

          {printingOrder && (
            <>
              <div className="py-2 border-b border-dashed border-black text-[10px]">
                <div className="flex justify-between font-bold">
                  <span>ORDER: #{printingOrder.orderNumber}</span>
                  <span>{formatOrderTime(printingOrder.timestamp)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>BILL DATE: {formatOrderDate(printingOrder.timestamp)}</span>
                  <span>{formatOrderTime(printingOrder.timestamp)}</span>
                </div>
                <p>CUST: {printingOrder.customerName}</p>
              </div>

              <div className="py-2 border-b border-dashed border-black text-[10px]">
                {printingOrder.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1 mb-1">
                    <span className="col-span-2">{item.quantity}x</span>
                    <span className="col-span-7 uppercase">{item.name}</span>
                    <span className="col-span-3 text-right">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="py-4 text-right">
                <div className="text-[9px] mb-1">
                  <p>SUBTOTAL: ₹{printingOrder.subtotal?.toFixed(2) || (printingOrder.totalPrice / 1.05).toFixed(2)}</p>
                  <p>CGST (2.5%): ₹{printingOrder.cgst?.toFixed(2) || ((printingOrder.totalPrice - (printingOrder.totalPrice / 1.05)) / 2).toFixed(2)}</p>
                  <p>SGST (2.5%): ₹{printingOrder.sgst?.toFixed(2) || ((printingOrder.totalPrice - (printingOrder.totalPrice / 1.05)) / 2).toFixed(2)}</p>
                </div>
                <div className="text-lg font-black uppercase border-t border-black pt-1">Total: ₹{printingOrder.totalPrice}</div>
                {printingOrder.paymentMethod === 'Cash' && (
                  <div className="text-[9px] mt-1">
                    <p>Cash Received: ₹{printingOrder.cashReceived || printingOrder.totalPrice}</p>
                    <p>Change Due: ₹{printingOrder.changeDue || 0}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 text-center border-t border-dashed border-black">
                <p className="text-[8px] italic">{printSettings.footerMessage}</p>
              </div>
            </>
          )}
        </div>

        <div className="print-cut-line" style={{ pageBreakAfter: 'always', borderBottom: '1px dashed #000', margin: '20px 0' }} />

        <div className="token-section p-8 text-center">
           <p className="text-[10px] font-bold uppercase mb-4">Collection Token</p>
           <h1 className="text-6xl font-black">#{printingOrder?.orderNumber}</h1>
           <div className="mt-6 pt-4 border-t border-dashed border-black">
              <p className="text-sm font-black uppercase">{printingOrder?.customerName}</p>
              <p className="text-[8px] opacity-60">RAVOYI KITCHEN</p>
           </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; background: white !important; }
          #printable-receipt, #printable-receipt * { visibility: visible; }
          #printable-receipt { position: absolute; left: 0; top: 0; margin: 0; padding: 0; }
          .print-cut-line { display: block; border-bottom: 1px dashed black; height: 1px; width: 100%; }
          @page { margin: 0; size: auto; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
