
"use client"

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, 
  updateDoc, setDoc, addDoc, serverTimestamp, runTransaction 
} from 'firebase/firestore';
import { Order, MenuItem, CartItem, Table as TableType } from '@/lib/types';
import { 
  Printer, Settings, Check, Clock, User, Phone, Banknote, Store, X, Save, Plus, Minus, Search, ShoppingBag, CreditCard, Smartphone, Loader2, ReceiptText, ShieldCheck, Wallet, Hash, Cpu, Ticket
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


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
  storeName: "Dindigul Ananda's Briyani",
  address: "Authentic Dindigul Briyani, Hyderabad - 500074",
  phone: "+91 98765 43210",
  gstin: "36ABCDE1234F1Z5",
  fssai: "12345678901234",
  footerMessage: "Thank you for visiting Dindigul Ananda's Briyani!",
  paperWidth: '80mm',
  triggerCashDrawer: false,
  optimizedFor: "Restsol RTP-81"
};

export default function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableType[]>([]);
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
  const [manualOrderTableId, setManualOrderTableId] = useState('Takeaway');

  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [tempSettings, setTempSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);

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
        const settings = { ...DEFAULT_PRINT_SETTINGS, ...d.data() } as PrintSettings;
        setPrintSettings(settings);
        setTempSettings(settings);
      }
    });

    const unsubTables = onSnapshot(query(collection(firestore, "tables"), orderBy("tableNumber")), (snapshot) => {
        setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as TableType));
    });

    return () => { unsubOrders(); unsubMenu(); unsubSettings(); unsubTables(); };
  }, [firestore]);

  const calculateTotals = (items: CartItem[]) => {
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cgst = subtotal * 0.025;
    const sgst = subtotal * 0.025;
    const rawTotal = subtotal + cgst + sgst;
    const total = Math.round(rawTotal);
    const roundOff = total - rawTotal;
    return { subtotal, cgst, sgst, total, roundOff };
  };

  const totals = useMemo(() => calculateTotals(selectedItems), [selectedItems]);
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
    await setDoc(doc(firestore, "settings", "print_template"), tempSettings);
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
    const { subtotal, cgst, sgst, total, roundOff } = totals;

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
        tableId: manualOrderTableId,
        customerName,
        customerPhone: customerPhone || "N/A",
        paymentMethod,
        cashReceived: paymentMethod === 'Cash' ? Number(cashReceived) : null,
        changeDue: paymentMethod === 'Cash' ? changeDue : null,
        items: selectedItems,
        subtotal,
        cgst,
        sgst,
        roundOff,
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
      setManualOrderTableId('Takeaway');
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
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  
  const formatOrderDate = (ts: any) => {
    if (!ts) return "";
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const pendingOrders = orders.filter(o => o.status === 'Pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-xl">
        <div className="flex items-center gap-6">
           <div className="p-4 bg-primary/10 rounded-2xl text-primary">
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
            className="flex items-center gap-3 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black uppercase italic text-xs shadow-xl shadow-zinc-900/20 hover:bg-primary transition-all"
          >
            <Plus size={18} /> New Manual Order
          </button>
          <button onClick={() => setShowSettings(true)} className="p-4 bg-white text-zinc-400 rounded-2xl hover:text-primary transition-all border border-zinc-200 shadow-sm">
            <Settings size={20}/>
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-xl font-black uppercase italic text-zinc-900 tracking-tight flex items-center gap-3">
          <Ticket className="text-primary"/>
          Incoming Customer Orders
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pendingOrders.length > 0 ? pendingOrders.map((order) => {
          const cashInputVal = feedCashReceived[order.id] || "";
          const change = Math.max(0, (Number(cashInputVal) || order.totalPrice) - order.totalPrice);

          return (
            <div key={order.id} className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 flex flex-col transition-all shadow-lg hover:shadow-2xl hover:border-primary/30 group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 flex items-center justify-center">
                    <span className="text-2xl font-black text-primary italic leading-none">#{order.orderNumber}</span>
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
                  <User size={16} className="text-primary" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest leading-none">Customer</span>
                    <span className="text-xs font-bold uppercase italic text-zinc-900">{order.customerName}</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <span className="text-primary font-black italic text-xs">{item.quantity}x</span>
                        <span className="text-[10px] font-bold uppercase italic text-zinc-900 truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-zinc-900">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <Banknote size={16} className="text-primary" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest leading-none">Grand Total</span>
                    <span className="text-lg font-black italic text-primary leading-none">₹{order.totalPrice} ({order.paymentMethod})</span>
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
                className="mt-auto w-full py-5 bg-primary text-white rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-zinc-900 transition-all active:scale-95"
              >
                <Check size={20}/> Confirm & Print
              </button>
            </div>
          );
        }) : (
          <div className="col-span-full h-64 flex flex-col items-center justify-center bg-zinc-50 border-4 border-dashed border-zinc-100 rounded-[2.5rem] text-zinc-200">
             <div className="opacity-40"><Ticket size={48}/></div>
             <p className="text-[10px] font-black uppercase tracking-widest mt-4">No Incoming Orders</p>
          </div>
        )}
      </div>

      <Dialog open={showNewOrder} onOpenChange={setShowNewOrder}>
        <DialogContent className="max-w-7xl bg-zinc-50 rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden flex flex-col h-[90vh]">
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
            <div className="w-3/5 border-r border-zinc-200 flex flex-col bg-white">
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
                <div className="grid grid-cols-2 gap-3">
                  {filteredMenu.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleAddItem(item)}
                      className="flex flex-col text-left p-4 bg-zinc-50 hover:bg-primary/5 border border-zinc-100 rounded-2xl transition-all group shadow-sm hover:shadow-lg hover:border-primary/20"
                    >
                      <p className="font-black italic uppercase text-sm text-zinc-900 leading-none mb-1">{item.name}</p>
                      <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-3">{item.category}</p>
                      <p className="mt-auto font-black italic text-primary text-lg">₹{item.price}</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="w-2/5 flex flex-col bg-zinc-50 relative">
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
                  
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Table / Order Type</Label>
                    <Select value={manualOrderTableId} onValueChange={setManualOrderTableId}>
                      <SelectTrigger className="bg-white border-zinc-200 h-11 rounded-xl font-bold text-black text-sm">
                        <SelectValue placeholder="Select a table" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Takeaway">Takeaway</SelectItem>
                        {tables.map(table => (
                          <SelectItem key={table.id} value={table.id}>Table {table.tableNumber}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Payment Method</Label>
                    <RadioGroup 
                      value={paymentMethod} 
                      onValueChange={(v: any) => setPaymentMethod(v)}
                      className="grid grid-cols-3 gap-2"
                    >
                      <Label htmlFor="m-upi" className={cn("flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all", paymentMethod === 'UPI' ? "bg-white border-primary text-primary shadow-md" : "bg-white/50 border-zinc-100 text-zinc-400")}>
                        <RadioGroupItem value="UPI" id="m-upi" className="sr-only" />
                        <Smartphone size={16} />
                        <span className="text-[8px] font-black uppercase">UPI</span>
                      </Label>
                      <Label htmlFor="m-cash" className={cn("flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all", paymentMethod === 'Cash' ? "bg-white border-primary text-primary shadow-md" : "bg-white/50 border-zinc-100 text-zinc-400")}>
                        <RadioGroupItem value="Cash" id="m-cash" className="sr-only" />
                        <Banknote size={16} />
                        <span className="text-[8px] font-black uppercase">Cash</span>
                      </Label>
                      <Label htmlFor="m-card" className={cn("flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all", paymentMethod === 'Card' ? "bg-white border-primary text-primary shadow-md" : "bg-white/50 border-zinc-100 text-zinc-400")}>
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
                    <Label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Selected Items ({selectedItems.reduce((acc, item) => acc + item.quantity, 0)})</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                      {selectedItems.length > 0 ? selectedItems.map((item, idx) => (
                        <div key={idx} className="flex items-center p-2 bg-white rounded-xl border border-zinc-100 shadow-sm">
                          {item.image && (
                            <Image src={item.image} alt={item.name} width={40} height={40} className="rounded-lg object-cover" />
                          )}
                          <div className="flex-1 min-w-0 px-3">
                            <p className="font-bold text-zinc-900 text-[11px] truncate leading-none mb-1">{item.name}</p>
                            <p className="text-[10px] font-black text-primary">₹{item.price * item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-zinc-100 rounded-full p-1">
                            <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 bg-white hover:bg-zinc-200 rounded-full transition-colors text-zinc-500">
                              {item.quantity > 1 ? <Minus size={12} /> : <X size={12} />}
                            </button>
                            <span className="text-xs font-black w-6 text-center text-zinc-900">{item.quantity}</span>
                            <button onClick={() => handleAddItem(item)} className="p-1.5 bg-white hover:bg-zinc-200 rounded-full transition-colors text-primary">
                              <Plus size={12} />
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
                    className="h-12 px-8 bg-primary text-white rounded-xl font-black uppercase italic text-[10px] shadow-lg shadow-primary/20 flex items-center gap-3 disabled:bg-zinc-200 disabled:text-zinc-400 transition-all hover:bg-zinc-900 active:scale-95"
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
      
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-2xl bg-zinc-900 border-zinc-800 text-white rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic flex items-center gap-3"><Settings className="text-primary"/>POS Hardware Config</DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
              Calibrate thermal printer and cash drawer settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4 max-h-[60vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeName" className="text-[10px] font-black uppercase text-zinc-400">Store Name</Label>
                <Input id="storeName" value={tempSettings.storeName} onChange={(e) => setTempSettings(s => ({...s, storeName: e.target.value}))} className="bg-zinc-950 border-zinc-800" />
              </div>
              <div>
                <Label htmlFor="optimizedFor" className="text-[10px] font-black uppercase text-zinc-400">Optimized For</Label>
                <Input id="optimizedFor" value={tempSettings.optimizedFor} onChange={(e) => setTempSettings(s => ({...s, optimizedFor: e.target.value}))} className="bg-zinc-950 border-zinc-800" />
              </div>
            </div>
            <div>
              <Label htmlFor="address" className="text-[10px] font-black uppercase text-zinc-400">Store Address</Label>
              <Input id="address" value={tempSettings.address} onChange={(e) => setTempSettings(s => ({...s, address: e.target.value}))} className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="phone" className="text-[10px] font-black uppercase text-zinc-400">Phone</Label>
                <Input id="phone" value={tempSettings.phone} onChange={(e) => setTempSettings(s => ({...s, phone: e.target.value}))} className="bg-zinc-950 border-zinc-800" />
              </div>
              <div>
                <Label htmlFor="gstin" className="text-[10px] font-black uppercase text-zinc-400">GSTIN</Label>
                <Input id="gstin" value={tempSettings.gstin} onChange={(e) => setTempSettings(s => ({...s, gstin: e.target.value}))} className="bg-zinc-950 border-zinc-800" />
              </div>
              <div>
                <Label htmlFor="fssai" className="text-[10px] font-black uppercase text-zinc-400">FSSAI</Label>
                <Input id="fssai" value={tempSettings.fssai} onChange={(e) => setTempSettings(s => ({...s, fssai: e.target.value}))} className="bg-zinc-950 border-zinc-800" />
              </div>
            </div>
            <div>
              <Label htmlFor="footerMessage" className="text-[10px] font-black uppercase text-zinc-400">Footer Message</Label>
              <Input id="footerMessage" value={tempSettings.footerMessage} onChange={(e) => setTempSettings(s => ({...s, footerMessage: e.target.value}))} className="bg-zinc-950 border-zinc-800" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveSettings} className="bg-primary text-white hover:bg-zinc-900 font-black uppercase text-xs tracking-widest py-3 px-6 h-auto">
              <Save className="mr-2 h-4 w-4"/>Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="max-w-lg bg-zinc-900 border-zinc-800 p-0 overflow-hidden rounded-[3rem] shadow-2xl">
          <DialogHeader className="p-8 border-b border-zinc-800 flex justify-between items-center bg-black/40">
             <div>
                <DialogTitle className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                   <ReceiptText className="text-primary" /> Receipt Preview
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Verify Slips Before Printing</DialogDescription>
             </div>
             <button onClick={() => setShowPrintPreview(false)} className="p-2 text-zinc-500 hover:text-white">
                <X size={20} />
             </button>
          </DialogHeader>
          
          <div className="p-10 bg-zinc-950 flex flex-col items-center gap-10 no-print">
            <div 
              className="bg-white text-black p-6 shadow-2xl font-mono text-[12px] relative font-black leading-snug" 
              style={{ width: '300px' }}
            >
             <div className="text-center mb-2">
                <h2 className="text-lg font-black uppercase">{printSettings.storeName}</h2>
                <p className="text-[10px] uppercase font-bold leading-tight">{printSettings.address}</p>
                <p className="text-[10px] font-bold">PH: {printSettings.phone}</p>
                <p className="text-[10px] font-bold">GSTIN: {printSettings.gstin}</p>
                <p className="text-[10px] font-bold">FSSAI: {printSettings.fssai}</p>
              </div>

              <div className="border-y-2 border-dashed border-black py-1 my-2 text-[10px]">
                <div className="flex justify-between">
                  <span>Date: {formatOrderDate(printingOrder?.timestamp)}</span>
                  <span>Time: {formatOrderTime(printingOrder?.timestamp)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Token No.: {printingOrder?.orderNumber}</span>
                  <span className="font-black">{printingOrder?.tableId === 'Takeaway' ? 'Takeaway' : `Table: ${tables.find(t => t.id === printingOrder?.tableId)?.tableNumber}`}</span>
                </div>
                 <div className="flex justify-between mt-1 pt-1 border-t border-black/10">
                  <span className="uppercase">Cust: {printingOrder?.customerName}</span>
                </div>
              </div>

              <div className="mb-2">
                <div className="grid grid-cols-12 font-black border-b-2 border-dashed border-black pb-1 mb-1 text-[10px]">
                  <span className="col-span-6">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Rate</span>
                  <span className="col-span-2 text-right">Amt</span>
                </div>
                {printingOrder?.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-[10px] leading-tight font-bold">
                    <span className="col-span-6 uppercase truncate pr-1">{item.name}</span>
                    <span className="col-span-2 text-center">{item.quantity}</span>
                    <span className="col-span-2 text-right">{item.price.toFixed(2)}</span>
                    <span className="col-span-2 text-right">{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-black pt-2 space-y-1 text-right text-[10px] font-bold">
                <div className="flex justify-between"><span>Sub Total</span> <span>{formatCurrency(printingOrder?.subtotal || 0)}</span></div>
                <div className="flex justify-between"><span>CGST @ 2.5%</span> <span>{formatCurrency(printingOrder?.cgst || 0)}</span></div>
                <div className="flex justify-between"><span>SGST @ 2.5%</span> <span>{formatCurrency(printingOrder?.sgst || 0)}</span></div>
                {(printingOrder?.roundOff || 0) !== 0 && (
                  <div className="flex justify-between"><span>Round off</span> <span>{printingOrder?.roundOff?.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between items-center text-lg font-black border-t-2 border-black pt-1 mt-1">
                  <span>TOTAL</span>
                  <span>{formatCurrency(printingOrder?.totalPrice || 0)}</span>
                </div>
                 {printingOrder?.paymentMethod === 'Cash' && printingOrder.cashReceived != null && (
                  <div className="pt-2 mt-2 border-t-2 border-dashed border-black/40 text-xs">
                    <div className="flex justify-between"><span>CASH RECEIVED</span> <span>{formatCurrency(printingOrder.cashReceived || 0)}</span></div>
                    <div className="flex justify-between"><span>CHANGE DUE</span> <span>{formatCurrency(printingOrder.changeDue || 0)}</span></div>
                  </div>
                )}
              </div>

              <div className="text-center mt-4 border-t-2 border-dashed border-black pt-2">
                <p className="text-[10px] font-bold uppercase italic">{printSettings.footerMessage}</p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-zinc-900">
             <button onClick={executePrint} className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-zinc-900 transition-all">
                <Printer size={18} /> Execute {printSettings.optimizedFor} Print
             </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div id="printable-receipt" className="hidden">
        {printingOrder && (
          <>
            <div className='font-mono text-black font-black w-[80mm] p-0 m-0' style={{breakAfter: 'page'}}>
                <div className="text-center mb-2">
                    <h1 className="text-lg font-black uppercase leading-tight">{printSettings.storeName}</h1>
                    <p className="text-[10px] uppercase font-bold leading-tight">{printSettings.address}</p>
                    <p className="text-[10px] font-bold leading-tight">PH: {printSettings.phone}</p>
                    <p className="text-[10px] font-bold leading-tight">GSTIN: {printSettings.gstin}</p>
                    <p className="text-[10px] font-bold leading-tight">FSSAI: {printSettings.fssai}</p>
                </div>
                <div className="border-y-2 border-dashed border-black py-1 my-2 text-[10px]">
                    <div className="flex justify-between">
                        <span>Date: {formatOrderDate(printingOrder.timestamp)}</span>
                        <span>Time: {formatOrderTime(printingOrder.timestamp)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Token No.: {printingOrder.orderNumber}</span>
                        <span className="font-black">{printingOrder?.tableId === 'Takeaway' ? 'Takeaway' : `Table: ${tables.find(t => t.id === printingOrder?.tableId)?.tableNumber}`}</span>
                    </div>
                    <div className="flex justify-between mt-1 pt-1 border-t border-black/10">
                        <span className="uppercase">Cust: {printingOrder.customerName}</span>
                    </div>
                </div>
                <div className="mb-2">
                    <div className="grid grid-cols-12 font-black border-b-2 border-dashed border-black pb-1 mb-1 text-[10px]">
                        <span className="col-span-5">Item</span>
                        <span className="col-span-2 text-center">Qty</span>
                        <span className="col-span-2 text-right">Rate</span>
                        <span className="col-span-3 text-right">Amount</span>
                    </div>
                    {printingOrder.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 text-[10px] leading-tight font-bold">
                            <span className="col-span-5 uppercase truncate pr-1">{item.name}</span>
                            <span className="col-span-2 text-center">{item.quantity}</span>
                            <span className="col-span-2 text-right">{item.price.toFixed(2)}</span>
                            <span className="col-span-3 text-right">{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t-2 border-dashed border-black pt-2 space-y-1 text-right text-[10px] font-bold">
                    <div className="flex justify-between"><span>Sub Total</span> <span>{printingOrder.subtotal?.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>CGST @ 2.5%</span> <span>{printingOrder.cgst?.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>SGST @ 2.5%</span> <span>{printingOrder.sgst?.toFixed(2)}</span></div>
                    {(printingOrder.roundOff || 0) !== 0 && (
                        <div className="flex justify-between"><span>Round off</span> <span>{printingOrder.roundOff?.toFixed(2)}</span></div>
                    )}
                    <div className="flex justify-between items-center text-lg font-black border-t-2 border-black pt-1 mt-1">
                        <span>TOTAL</span>
                        <span>{formatCurrency(printingOrder.totalPrice)}</span>
                    </div>
                     {printingOrder.paymentMethod === 'Cash' && printingOrder.cashReceived != null && (
                        <div className="pt-2 mt-2 border-t-2 border-dashed border-black/40 text-xs">
                          <div className="flex justify-between"><span>CASH RECEIVED</span> <span>{formatCurrency(printingOrder.cashReceived)}</span></div>
                          <div className="flex justify-between"><span>CHANGE DUE</span> <span>{formatCurrency(printingOrder.changeDue || 0)}</span></div>
                        </div>
                    )}
                </div>
                <div className="text-center mt-4 border-t-2 border-dashed border-black pt-2">
                    <p className="text-[10px] font-bold uppercase italic">{printSettings.footerMessage}</p>
                </div>
            </div>
            
            <div className="kot-section p-4 text-center font-black" style={{breakBefore: 'page'}}>
               <p className="text-xl font-black uppercase mb-4 tracking-widest">KITCHEN ORDER</p>
               <h1 className="text-8xl font-black italic leading-none m-0">#{printingOrder.orderNumber}</h1>
               <div className="mt-8 pt-8 border-t-4 border-dashed border-black uppercase">
                  <p className="text-3xl font-black mb-4">
                    {printingOrder.tableId === 'Takeaway' ? printingOrder.customerName : `TABLE: ${tables.find(t => t.id === printingOrder.tableId)?.tableNumber || printingOrder.tableId}`}
                  </p>
                  <div className="space-y-2 text-left">
                    {printingOrder.items.map((item, idx) => (
                       <p key={idx} className="text-2xl font-black">
                         {item.quantity}x {item.name}
                       </p>
                    ))}
                  </div>
                  <p className="text-sm font-bold opacity-80 mt-8">Dindigul Ananda's Briyani</p>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
