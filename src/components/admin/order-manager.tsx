"use client"

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, 
  updateDoc, setDoc, addDoc, serverTimestamp, runTransaction 
} from 'firebase/firestore';
import { Order, MenuItem, CartItem } from '@/lib/types';
import { 
  Printer, Settings, Check, Clock, User, Phone, Banknote, Store, X, Save, Plus, Minus, Search, ShoppingBag, CreditCard, Smartphone, Loader2, ReceiptText, ShieldCheck, Wallet, Hash, Cpu
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
  optimizedFor: string;
}

const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  storeName: "RAVOYI Kitchen",
  address: "Authentic Telangana Kitchen, Hyderabad",
  phone: "+91 98765 43210",
  gstin: "36ABCDE1234F1Z5",
  fssai: "12345678901234",
  footerMessage: "Thank you for visiting RAVOYI! Savor the spice.",
  paperWidth: '80mm',
  triggerCashDrawer: false,
  optimizedFor: "My POS MP301"
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

  const [feedCashReceived, setFeedCashReceived] = useState<Record<string, string>>({});

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
    const total = Math.round(subtotal + cgst + sgst);
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
      
      toast({ title: "Order Confirmed" });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed" });
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
    toast({ title: "Settings Saved" });
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
      toast({ variant: "destructive", title: "Incomplete Details" });
      return;
    }

    if (paymentMethod === 'Cash' && (Number(cashReceived) < totals.total)) {
      toast({ variant: "destructive", title: "Insufficient Cash" });
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
      
      setSelectedItems([]);
      setCustomerName("");
      setCustomerPhone("");
      setCashReceived("");
      setShowNewOrder(false);
      
      const finalOrder = { id: docRef.id, ...orderData, timestamp: { seconds: Math.floor(Date.now() / 1000) } } as Order;
      setPrintingOrder(finalOrder);
      setShowPrintPreview(true);

    } catch (error) {
      toast({ variant: "destructive", title: "Order Failed" });
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
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <span className="text-[#b8582e] font-black italic text-xs">{item.quantity}x</span>
                        <span className="text-[10px] font-bold uppercase italic text-zinc-900 truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-zinc-900">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
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

      <Dialog open={showNewOrder} onOpenChange={setShowNewOrder}>
        <DialogContent className="max-w-6xl bg-zinc-50 rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col h-[90vh]">
          <DialogHeader className="p-6 bg-white border-b border-zinc-100 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900">Manual Order Entry</DialogTitle>
                <DialogDescription className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Take orders directly at the counter</DialogDescription>
              </div>
              <button onClick={() => setShowNewOrder(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={20} className="text-zinc-400" />
              </button>
            </div>
          </DialogHeader>

          <div className="flex-1 flex overflow-hidden">
            <div className="w-1/2 border-r border-zinc-200 flex flex-col bg-white">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                  <Input 
                    placeholder="Search Menu..." 
                    className="pl-12 h-11 bg-white border-zinc-200 rounded-xl font-bold text-black text-sm"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                  />
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="grid grid-cols-1 gap-2">
                  {filteredMenu.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleAddItem(item)}
                      className="flex items-center justify-between p-3.5 bg-zinc-50 hover:bg-[#b8582e]/5 border border-zinc-100 rounded-xl transition-all group"
                    >
                      <div className="text-left">
                        <p className="font-black italic uppercase text-[11px] text-zinc-900 leading-none mb-1">{item.name}</p>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{item.category}</p>
                      </div>
                      <span className="font-black italic text-[#b8582e] text-sm">₹{item.price}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="w-1/2 flex flex-col bg-zinc-50 relative">
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Customer Name</Label>
                      <Input 
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Rahul Kumar"
                        className="bg-white border-zinc-200 h-11 rounded-xl font-bold text-black text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Phone Number (Optional)</Label>
                      <Input 
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Mobile number"
                        className="bg-white border-zinc-200 h-11 rounded-xl font-bold text-black text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Payment Method</Label>
                    <RadioGroup 
                      value={paymentMethod} 
                      onValueChange={(v: any) => setPaymentMethod(v)}
                      className="grid grid-cols-3 gap-2"
                    >
                      <Label htmlFor="m-upi" className={cn("flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all", paymentMethod === 'UPI' ? "bg-white border-[#b8582e] text-[#b8582e] shadow-md" : "bg-white/50 border-zinc-100 text-zinc-400")}>
                        <RadioGroupItem value="UPI" id="m-upi" className="sr-only" />
                        <Smartphone size={16} />
                        <span className="text-[8px] font-black uppercase">UPI</span>
                      </Label>
                      <Label htmlFor="m-cash" className={cn("flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all", paymentMethod === 'Cash' ? "bg-white border-[#b8582e] text-[#b8582e] shadow-md" : "bg-white/50 border-zinc-100 text-zinc-400")}>
                        <RadioGroupItem value="Cash" id="m-cash" className="sr-only" />
                        <Banknote size={16} />
                        <span className="text-[8px] font-black uppercase">Cash</span>
                      </Label>
                      <Label htmlFor="m-card" className={cn("flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all", paymentMethod === 'Card' ? "bg-white border-[#b8582e] text-[#b8582e] shadow-md" : "bg-white/50 border-zinc-100 text-zinc-400")}>
                        <RadioGroupItem value="Card" id="m-card" className="sr-only" />
                        <CreditCard size={16} />
                        <span className="text-[8px] font-black uppercase">Card</span>
                      </Label>
                    </RadioGroup>
                  </div>

                  {paymentMethod === 'Cash' && (
                    <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Cash Received (₹)</Label>
                          <Input 
                            type="number"
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            placeholder="0.00"
                            className="bg-zinc-50 border-zinc-100 h-11 text-xl font-black text-black rounded-xl"
                          />
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1">Change Due</p>
                          <p className={cn("text-2xl font-black italic tracking-tighter tabular-nums", changeDue > 0 ? "text-emerald-600" : "text-zinc-200")}>
                            ₹{changeDue}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Selected Items ({selectedItems.length})</Label>
                    <div className="space-y-2">
                      {selectedItems.length > 0 ? selectedItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-zinc-100 shadow-sm">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="font-bold text-zinc-900 text-[11px] truncate leading-none mb-1">{item.name}</p>
                            <p className="text-[10px] font-black text-[#b8582e]">₹{item.price * item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 hover:bg-zinc-50 rounded-lg transition-colors text-zinc-400">
                              {item.quantity > 1 ? <Minus size={14} /> : <X size={14} />}
                            </button>
                            <span className="text-xs font-black w-6 text-center text-zinc-900">{item.quantity}</span>
                            <button onClick={() => handleAddItem(item)} className="p-1.5 hover:bg-zinc-50 rounded-lg transition-colors text-[#b8582e]">
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      )) : (
                        <div className="py-10 text-center border-2 border-dashed border-zinc-200 rounded-2xl">
                           <ShoppingBag className="mx-auto text-zinc-200 mb-2" size={24} />
                           <p className="text-[9px] font-black uppercase text-zinc-300">Tray is empty</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-6 bg-white border-t border-zinc-200 flex-shrink-0">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400">Total Bill</span>
                    <span className="text-3xl font-black italic text-zinc-900 tracking-tighter">₹{totals.total}</span>
                  </div>
                  <button 
                    onClick={handleCreateOrder}
                    disabled={isPlacingOrder || selectedItems.length === 0 || (paymentMethod === 'Cash' && Number(cashReceived) < totals.total) || !customerName}
                    className="h-12 px-8 bg-[#b8582e] text-white rounded-xl font-black uppercase italic text-[10px] shadow-lg shadow-[#b8582e]/20 flex items-center gap-3 disabled:bg-zinc-200 disabled:text-zinc-400 transition-all hover:bg-zinc-900 active:scale-95"
                  >
                    {isPlacingOrder ? <Loader2 className="animate-spin" /> : <Check size={18} />}
                    Finalize Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            <div 
              className="bg-white text-black p-8 shadow-2xl font-mono text-[14px] relative font-black leading-tight" 
              style={{ width: '300px' }}
            >
              <div className="text-center border-b-2 border-dashed border-black pb-4 mb-4">
                <h1 className="text-2xl font-black uppercase">{printSettings.storeName}</h1>
                <p className="uppercase text-[10px] mt-1">{printSettings.address}</p>
                <p className="text-[10px] mt-1">Tel: {printSettings.phone}</p>
                <div className="flex justify-center gap-4 mt-2 text-[10px] font-bold">
                  <span>GST: {printSettings.gstin}</span>
                  <span>FSSAI: {printSettings.fssai}</span>
                </div>
              </div>

              {printingOrder && (
                <>
                  <div className="mb-4 border-b-2 border-dashed border-black pb-2">
                    <div className="flex justify-between text-lg font-black">
                      <span>ORD: #{printingOrder.orderNumber}</span>
                      <span>{formatOrderTime(printingOrder.timestamp)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] mt-1 uppercase">
                      <span>DATE: {formatOrderDate(printingOrder.timestamp)}</span>
                      <span>{printingOrder.paymentMethod}</span>
                    </div>
                    <p className="truncate uppercase mt-1 border-t border-black/10 pt-1">CUST: {printingOrder.customerName}</p>
                  </div>

                  <div className="border-b-2 border-dashed border-black pb-2 mb-2">
                    <div className="grid grid-cols-12 text-[10px] font-bold uppercase mb-2 border-b border-black/5 pb-1">
                       <span className="col-span-2">Qty</span>
                       <span className="col-span-7">Item</span>
                       <span className="col-span-3 text-right">Price</span>
                    </div>
                    {printingOrder.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 mb-2 leading-tight">
                        <span className="col-span-2 font-black">{item.quantity}x</span>
                        <span className="col-span-7 uppercase truncate">{item.name}</span>
                        <span className="col-span-3 text-right font-black">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-right font-black space-y-1 mb-4">
                    <div className="flex justify-between text-[11px] opacity-80">
                      <span>SUBTOTAL</span>
                      <span>₹{printingOrder.subtotal?.toFixed(2) || (printingOrder.totalPrice / 1.05).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] opacity-80">
                      <span>CGST (2.5%)</span>
                      <span>₹{printingOrder.cgst?.toFixed(2) || ((printingOrder.totalPrice - (printingOrder.totalPrice / 1.05))/2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] opacity-80">
                      <span>SGST (2.5%)</span>
                      <span>₹{printingOrder.sgst?.toFixed(2) || ((printingOrder.totalPrice - (printingOrder.totalPrice / 1.05))/2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t-2 border-black pt-2 mt-1 text-2xl font-black">
                      <span>GRAND TOTAL</span>
                      <span>₹{printingOrder.totalPrice}</span>
                    </div>
                  </div>

                  <div className="text-center pt-4 border-t-2 border-dashed border-black opacity-80">
                    <p className="italic text-[10px] leading-tight uppercase">{printSettings.footerMessage}</p>
                  </div>
                </>
              )}
            </div>

            <div className="w-full flex items-center gap-4 py-4 px-10">
               <div className="h-px flex-1 bg-zinc-800" />
               <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Token Cut</span>
               <div className="h-px flex-1 bg-zinc-800" />
            </div>

            <div 
              className="bg-white text-black p-8 shadow-2xl font-mono text-center border-t-4 border-zinc-200" 
              style={{ width: '300px' }}
            >
              <p className="text-[12px] font-black uppercase tracking-widest mb-2">Collection Token</p>
              <h2 className="text-7xl font-black italic">#{printingOrder?.orderNumber}</h2>
              <div className="mt-6 pt-6 border-t-2 border-dashed border-black">
                 <p className="text-xl font-black uppercase">{printingOrder?.customerName}</p>
                 <p className="text-[10px] mt-2 font-bold opacity-60 uppercase">RAVOYI KITCHEN</p>
              </div>
            </div>
          </ScrollArea>

          <div className="p-8 bg-zinc-900 flex flex-col gap-4">
             <button onClick={executePrint} className="w-full py-5 bg-[#b8582e] text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-zinc-900 transition-all">
                <Printer size={18} /> Execute MP301 Print
             </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md bg-white rounded-[2rem] p-8 border-none shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
               <Cpu className="text-[#b8582e] w-6 h-6" />
               <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900 leading-none">POS Hardware Config</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-zinc-400 uppercase font-bold">Optimized for My POS MP301 Thermal Series</DialogDescription>
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
                  80mm (MP301)
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
                  <span className="text-[8px] font-bold text-zinc-400 uppercase">Hardware Pulse</span>
               </div>
               <Switch 
                checked={printSettings.triggerCashDrawer} 
                onCheckedChange={(checked) => setPrintSettings({...printSettings, triggerCashDrawer: checked})} 
               />
            </div>
          </div>
          <DialogFooter>
            <button onClick={saveSettings} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase flex items-center justify-center gap-2">
              <Save size={18} /> Deploy Hardware Sync
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div id="printable-receipt" className="hidden print:block font-mono text-black font-black" style={{ width: '80mm' }}>
        <div className="receipt-section p-2">
          <div className="text-center border-b-4 border-dashed border-black pb-6 mb-6">
            <h1 className="text-3xl font-black uppercase leading-tight">{printSettings.storeName}</h1>
            <p className="text-[12px] font-black uppercase mt-2">{printSettings.address}</p>
            <p className="text-[12px] font-black mt-1">Tel: {printSettings.phone}</p>
            <div className="flex justify-center gap-4 mt-4 text-[12px] font-black">
              <span>GST: {printSettings.gstin}</span>
              <span>FSSAI: {printSettings.fssai}</span>
            </div>
          </div>

          {printingOrder && (
            <>
              <div className="py-4 border-b-4 border-dashed border-black text-[14px] font-black uppercase">
                <div className="flex justify-between text-2xl mb-2">
                  <span>ORDER: #{printingOrder.orderNumber}</span>
                  <span>{formatOrderTime(printingOrder.timestamp)}</span>
                </div>
                <div className="flex justify-between text-[12px] mb-1">
                  <span>DATE: {formatOrderDate(printingOrder.timestamp)}</span>
                  <span>METHOD: {printingOrder.paymentMethod}</span>
                </div>
                <p className="mt-2 text-lg">CUST: {printingOrder.customerName}</p>
              </div>

              <div className="py-4 border-b-4 border-dashed border-black text-[14px] font-black uppercase">
                <div className="grid grid-cols-12 gap-1 mb-4 border-b-2 border-black pb-2 text-[12px]">
                   <span className="col-span-2">Qty</span>
                   <span className="col-span-7">Item</span>
                   <span className="col-span-3 text-right">Price</span>
                </div>
                {printingOrder.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1 mb-3 leading-tight">
                    <span className="col-span-2 text-xl">{item.quantity}x</span>
                    <span className="col-span-7 text-lg">{item.name}</span>
                    <span className="col-span-3 text-right text-lg">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="py-6 text-right space-y-2 font-black uppercase">
                <div className="text-[14px]">
                  <div className="flex justify-between">
                    <span>SUBTOTAL:</span>
                    <span>₹{printingOrder.subtotal?.toFixed(2) || (printingOrder.totalPrice / 1.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>CGST (2.5%):</span>
                    <span>₹{printingOrder.cgst?.toFixed(2) || ((printingOrder.totalPrice - (printingOrder.totalPrice / 1.05))/2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>SGST (2.5%):</span>
                    <span>₹{printingOrder.sgst?.toFixed(2) || ((printingOrder.totalPrice - (printingOrder.totalPrice / 1.05))/2).toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-4xl font-black border-t-4 border-black pt-4 mt-2 flex justify-between">
                   <span>TOTAL:</span>
                   <span>₹{printingOrder.totalPrice}</span>
                </div>
              </div>

              <div className="pt-6 pb-10 text-center border-t-4 border-dashed border-black">
                <p className="text-[12px] italic font-black uppercase leading-tight">{printSettings.footerMessage}</p>
              </div>
            </>
          )}
        </div>

        <div className="print-cut-line" style={{ pageBreakAfter: 'always', borderBottom: '4px dashed #000', margin: '40px 0' }} />

        <div className="token-section p-10 text-center font-black">
           <p className="text-[16px] font-black uppercase mb-6 tracking-widest">Collection Token</p>
           <h1 className="text-[100px] font-black italic leading-none">#{printingOrder?.orderNumber}</h1>
           <div className="mt-10 pt-10 border-t-4 border-dashed border-black uppercase">
              <p className="text-3xl font-black mb-2">{printingOrder?.customerName}</p>
              <p className="text-[14px] font-black opacity-100">RAVOYI KITCHEN • AUTHENTIC TASTE</p>
           </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-receipt, #printable-receipt * { visibility: visible !important; }
          #printable-receipt { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            display: block !important;
            width: 80mm !important;
          }
          @page { margin: 0 !important; size: auto !important; }
        }
      `}</style>
    </div>
  );
}