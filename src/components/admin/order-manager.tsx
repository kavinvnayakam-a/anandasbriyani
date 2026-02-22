"use client"

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, 
  updateDoc, setDoc, addDoc, serverTimestamp, runTransaction 
} from 'firebase/firestore';
import { Order, MenuItem, CartItem } from '@/lib/types';
import { 
  Printer, Settings, Check, Clock, User, Phone, Banknote, Store, X, Save, Plus, Minus, Search, ShoppingBag, CreditCard, Smartphone, Loader2, ReceiptText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn, formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

interface PrintSettings {
  storeName: string;
  address: string;
  phone: string;
  gstin: string;
  footerMessage: string;
  paperWidth: '58mm' | '80mm';
}

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

  // New Order State
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Cash' | 'UPI'>('Cash');
  const [menuSearch, setMenuSearch] = useState("");

  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    storeName: "RAVOYI Kitchen",
    address: "Authentic Telangana Kitchen, Hyderabad",
    phone: "+91 98765 43210",
    gstin: "36ABCDE1234F1Z5",
    footerMessage: "Thank you for visiting RAVOYI! Savor the spice.",
    paperWidth: '80mm'
  });

  useEffect(() => {
    if (!firestore) return;
    
    // Fetch Orders
    const q = query(collection(firestore, "orders"), orderBy("timestamp", "desc"));
    const unsubOrders = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
    });

    // Fetch Menu Items for new orders
    const unsubMenu = onSnapshot(collection(firestore, "menu_items"), (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[]);
    });

    // Fetch Print Settings
    const unsubSettings = onSnapshot(doc(firestore, "settings", "print_template"), (d) => {
      if (d.exists()) setPrintSettings(d.data() as PrintSettings);
    });

    return () => { unsubOrders(); unsubMenu(); unsubSettings(); };
  }, [firestore]);

  const confirmOrder = async (order: Order) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, "orders", order.id), { status: "Received" });
      setPrintingOrder(order);
      setShowPrintPreview(true);
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

  const calculateTotals = () => {
    const subtotal = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const total = subtotal + cgst + sgst;
    return { subtotal, cgst, sgst, total };
  };

  const handleCreateOrder = async () => {
    if (!firestore || selectedItems.length === 0 || !customerName || !customerPhone) {
      toast({ variant: "destructive", title: "Incomplete Details", description: "Add items and customer info." });
      return;
    }

    setIsPlacingOrder(true);
    const { subtotal, cgst, sgst, total } = calculateTotals();

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
        customerPhone,
        paymentMethod,
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
      
      // Reset State
      setSelectedItems([]);
      setCustomerName("");
      setCustomerPhone("");
      setShowNewOrder(false);
      
      // Open Preview
      const finalOrder = { id: docRef.id, ...orderData } as Order;
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
        {pendingOrders.map((order) => (
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

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <User size={16} className="text-[#b8582e]" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest leading-none">Customer</span>
                  <span className="text-xs font-bold uppercase italic text-zinc-900">{order.customerName}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <Phone size={16} className="text-[#b8582e]" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest leading-none">Contact</span>
                  <span className="text-xs font-bold text-zinc-900">{order.customerPhone}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#b8582e]/5 rounded-2xl border border-[#b8582e]/10">
                <Banknote size={16} className="text-[#b8582e]" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest leading-none">Total (Incl. 5% GST)</span>
                  <span className="text-lg font-black italic text-[#b8582e] leading-none">₹{order.totalPrice} ({order.paymentMethod})</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => confirmOrder(order)} 
              className="mt-auto w-full py-5 bg-[#b8582e] text-white rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-zinc-900 transition-all active:scale-95"
            >
              <Check size={20}/> Confirm & Print Slip
            </button>
          </div>
        ))}

        {pendingOrders.length === 0 && (
          <div className="col-span-full h-80 flex flex-col items-center justify-center bg-zinc-50 border-4 border-dashed border-zinc-200 rounded-[3rem] text-zinc-300">
             <Store size={48} className="mb-4 opacity-20" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Counter Clear</p>
          </div>
        )}
      </div>

      {/* NEW ORDER DIALOG */}
      <Dialog open={showNewOrder} onOpenChange={setShowNewOrder}>
        <DialogContent className="max-w-4xl bg-zinc-50 rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col h-[90vh]">
          <DialogHeader className="p-8 bg-white border-b border-zinc-100">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-zinc-900">Manual Order Entry</DialogTitle>
                <DialogDescription className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Add items to create a new counter ticket</DialogDescription>
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
                      <div className="flex items-center gap-4">
                        <span className="font-black italic text-[#b8582e]">₹{item.price}</span>
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-[#b8582e] group-hover:text-white transition-colors">
                          <Plus size={16} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="w-1/2 flex flex-col p-8 space-y-8 bg-zinc-50">
              <div className="space-y-6">
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
                    <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Phone Number</Label>
                    <Input 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="10-digit mobile"
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
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3">Selected Items ({selectedItems.length})</Label>
                <ScrollArea className="flex-1 bg-white rounded-[2rem] border border-zinc-100 p-4">
                  {selectedItems.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-zinc-300">
                      <ShoppingBag size={32} className="mb-2 opacity-20" />
                      <p className="text-[9px] font-black uppercase tracking-widest">Tray is Empty</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="font-bold text-zinc-900 text-xs truncate leading-none mb-1">{item.name}</p>
                            <p className="text-[10px] font-black text-[#b8582e]">₹{item.price * item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 hover:bg-white rounded-lg transition-colors text-zinc-400">
                              {item.quantity > 1 ? <Minus size={14} /> : <X size={14} />}
                            </button>
                            <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                            <button onClick={() => handleAddItem(item)} className="p-1.5 hover:bg-white rounded-lg transition-colors text-[#b8582e]">
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-200">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Total Amount</span>
                    <span className="text-4xl font-black italic text-zinc-900 tracking-tighter">₹{calculateTotals().total}</span>
                  </div>
                  <button 
                    onClick={handleCreateOrder}
                    disabled={isPlacingOrder || selectedItems.length === 0 || !customerName || !customerPhone}
                    className="h-14 px-10 bg-[#b8582e] text-white rounded-2xl font-black uppercase italic text-xs shadow-xl shadow-[#b8582e]/20 hover:bg-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
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
                <DialogDescription className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Verification Before Printing</DialogDescription>
             </div>
             <button onClick={() => setShowPrintPreview(false)} className="p-2 text-zinc-500 hover:text-white">
                <X size={20} />
             </button>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] p-10 bg-zinc-950 flex justify-center">
            {/* Virtual Thermal Paper */}
            <div 
              className="bg-white text-black p-8 shadow-2xl font-mono text-[11px] animate-in fade-in slide-in-from-top-full duration-1000" 
              style={{ width: printSettings.paperWidth === '58mm' ? '220px' : '300px' }}
            >
              <div className="text-center border-b border-dashed border-black pb-4 mb-4">
                <h1 className="text-lg font-black uppercase">{printSettings.storeName}</h1>
                <p className="uppercase text-[9px] leading-tight">{printSettings.address}</p>
                <p className="text-[9px]">Tel: {printSettings.phone}</p>
                <p className="text-[9px] font-bold">GST: {printSettings.gstin}</p>
              </div>

              {printingOrder && (
                <>
                  <div className="mb-4 border-b border-dashed border-black pb-2">
                    <div className="flex justify-between font-bold">
                      <span>ORD: #{printingOrder.orderNumber}</span>
                      <span>{formatOrderTime(printingOrder.timestamp)}</span>
                    </div>
                    <p className="truncate uppercase mt-1">CUST: {printingOrder.customerName}</p>
                  </div>

                  <div className="border-b border-dashed border-black pb-2 mb-2">
                    <div className="grid grid-cols-12 font-bold mb-1 border-b border-black pb-1">
                      <span className="col-span-2">QTY</span>
                      <span className="col-span-7">ITEM</span>
                      <span className="col-span-3 text-right">AMT</span>
                    </div>
                    {printingOrder.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 mb-1">
                        <span className="col-span-2">{item.quantity}</span>
                        <span className="col-span-7 uppercase truncate">{item.name}</span>
                        <span className="col-span-3 text-right">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-right space-y-1 mb-4">
                    <div className="flex justify-between">
                      <span>SUBTOTAL</span>
                      <span>₹{printingOrder.subtotal?.toFixed(0) || (printingOrder.totalPrice / 1.05).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CGST (2.5%)</span>
                      <span>₹{printingOrder.cgst?.toFixed(0) || (printingOrder.totalPrice * 0.025 / 1.05).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST (2.5%)</span>
                      <span>₹{printingOrder.sgst?.toFixed(0) || (printingOrder.totalPrice * 0.025 / 1.05).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between border-t border-black pt-2 mt-2 font-black text-sm">
                      <span>GRAND TOTAL</span>
                      <span>₹{printingOrder.totalPrice}</span>
                    </div>
                  </div>

                  <div className="text-center pt-4 border-t border-dashed border-black opacity-60">
                    <p className="italic text-[8px] whitespace-pre-wrap">{printSettings.footerMessage}</p>
                    <p className="mt-2 font-black uppercase">Token #{printingOrder.orderNumber}</p>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          <div className="p-8 bg-zinc-900 flex gap-4">
             <button 
               onClick={() => setShowPrintPreview(false)}
               className="flex-1 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-black uppercase text-xs hover:bg-zinc-700 transition-all"
             >
                Discard
             </button>
             <button 
               onClick={executePrint}
               className="flex-[2] py-4 bg-[#b8582e] text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-white hover:text-black transition-all group"
             >
                <Printer size={18} className="group-hover:animate-bounce" /> Execute Print
             </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SETTINGS DIALOG */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md bg-white rounded-[2rem] p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Receipt Configuration</DialogTitle>
            <DialogDescription className="sr-only">Configure thermal printer receipt template</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Store Name</Label>
              <Input 
                value={printSettings.storeName} 
                onChange={(e) => setPrintSettings({...printSettings, storeName: e.target.value})}
                className="rounded-xl border-2 font-bold text-black"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">GSTIN Number</Label>
              <Input 
                value={printSettings.gstin} 
                onChange={(e) => setPrintSettings({...printSettings, gstin: e.target.value})}
                className="rounded-xl border-2 font-bold uppercase text-black"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Support Phone</Label>
              <Input 
                value={printSettings.phone} 
                onChange={(e) => setPrintSettings({...printSettings, phone: e.target.value})}
                className="rounded-xl border-2 font-bold text-black"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Address</Label>
              <Input 
                value={printSettings.address} 
                onChange={(e) => setPrintSettings({...printSettings, address: e.target.value})}
                className="rounded-xl border-2 font-bold text-black"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Footer Message</Label>
              <Textarea 
                value={printSettings.footerMessage} 
                onChange={(e) => setPrintSettings({...printSettings, footerMessage: e.target.value})}
                className="rounded-xl border-2 font-bold text-black resize-none min-h-[80px]"
                placeholder="Message printed at bottom of slip"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Paper Width</Label>
              <div className="flex gap-2">
                {['58mm', '80mm'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setPrintSettings({...printSettings, paperWidth: size as any})}
                    className={cn(
                      "flex-1 py-3 rounded-xl border-2 font-black uppercase text-xs transition-all",
                      printSettings.paperWidth === size ? "bg-[#b8582e] text-white border-[#b8582e]" : "bg-zinc-50 border-zinc-200 text-zinc-400"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <button 
              onClick={saveSettings}
              className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase flex items-center justify-center gap-2 hover:bg-[#b8582e] transition-all"
            >
              <Save size={18} /> Update Template
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HIDDEN PRINTABLE COMPONENT */}
      <div id="printable-receipt" className="hidden print:block font-mono text-black" style={{ width: printSettings.paperWidth }}>
        <div className="p-4 text-center border-b border-dashed border-black">
          <h1 className="text-xl font-black uppercase">{printSettings.storeName}</h1>
          <p className="text-[10px] uppercase">{printSettings.address}</p>
          <p className="text-[10px]">Tel: {printSettings.phone}</p>
          <p className="text-[10px] font-bold">GST: {printSettings.gstin}</p>
        </div>

        {printingOrder && (
          <>
            <div className="py-2 border-b border-dashed border-black text-[10px]">
              <div className="flex justify-between font-bold">
                <span>ORDER: #{printingOrder.orderNumber}</span>
                <span>{formatOrderTime(printingOrder.timestamp)}</span>
              </div>
              <p>CUSTOMER: {printingOrder.customerName}</p>
              <p>PHONE: {printingOrder.customerPhone}</p>
            </div>

            <div className="py-2 border-b border-dashed border-black text-[10px]">
              <div className="grid grid-cols-12 gap-1 font-bold mb-1 border-b border-dashed border-black pb-1">
                <span className="col-span-1">#</span>
                <span className="col-span-7">ITEM</span>
                <span className="col-span-4 text-right">PRICE</span>
              </div>
              {printingOrder.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1 mb-1">
                  <span className="col-span-1">{item.quantity}</span>
                  <span className="col-span-7 uppercase">{item.name}</span>
                  <span className="col-span-4 text-right">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="py-2 text-right text-[10px] border-b border-dashed border-black">
               <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{printingOrder.subtotal?.toFixed(0) || (printingOrder.totalPrice / 1.05).toFixed(0)}</span>
               </div>
               <div className="flex justify-between">
                  <span>CGST @ 2.5%:</span>
                  <span>₹{printingOrder.cgst?.toFixed(0) || (printingOrder.totalPrice * 0.025 / 1.05).toFixed(0)}</span>
               </div>
               <div className="flex justify-between">
                  <span>SGST @ 2.5%:</span>
                  <span>₹{printingOrder.sgst?.toFixed(0) || (printingOrder.totalPrice * 0.025 / 1.05).toFixed(0)}</span>
               </div>
            </div>

            <div className="py-4 text-right">
              <div className="text-lg font-black uppercase">Grand Total: ₹{printingOrder.totalPrice}</div>
              <p className="text-[10px]">Paid via: {printingOrder.paymentMethod}</p>
            </div>

            <div className="pt-4 text-center border-t border-dashed border-black">
              <p className="text-[8px] italic whitespace-pre-wrap">{printSettings.footerMessage}</p>
              <p className="text-[8px] mt-2 font-bold">ORDER TOKEN: #{printingOrder.orderNumber}</p>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
            background: white !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>
    </div>
  );
}
