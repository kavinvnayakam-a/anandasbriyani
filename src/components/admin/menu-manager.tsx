"use client"

import { useState, useEffect } from 'react';
import { useFirestore, useStorage } from '@/firebase';
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp, 
  setDoc 
} from 'firebase/firestore';
import { uploadMenuImage } from '@/lib/upload-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Trash2, 
  Camera, 
  Loader2, 
  Image as ImageIcon, 
  Plus, 
  X, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Coins
} from 'lucide-react';
import { MenuItem } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

export default function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [globalShowImages, setGlobalShowImages] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;

    const unsubItems = onSnapshot(collection(firestore, "menu_items"), (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as MenuItem)));
    });

    const unsubSettings = onSnapshot(doc(firestore, "settings", "menu_config"), (snapshot) => {
      if (snapshot.exists()) {
        setGlobalShowImages(snapshot.data().globalShowImages);
      }
    });

    return () => { unsubItems(); unsubSettings(); };
  }, [firestore]);

  const toggleGlobalImages = async () => {
    if (!firestore) return;
    const settingsRef = doc(firestore, "settings", "menu_config");
    await setDoc(settingsRef, { globalShowImages: !globalShowImages }, { merge: true });
  };

  const toggleImageVisibility = async (item: MenuItem) => {
    if (!firestore) return;
    const itemRef = doc(firestore, "menu_items", item.id);
    await updateDoc(itemRef, { 
      showImage: item.showImage === undefined ? false : !item.showImage 
    });
  };

  const toggleStatus = async (item: MenuItem) => {
    if (!firestore) return;
    const itemRef = doc(firestore, "menu_items", item.id);
    await updateDoc(itemRef, { available: !item.available });
  };

  const handleUpdatePrice = async (itemId: string, newPrice: number) => {
    if (!firestore || isNaN(newPrice) || newPrice < 0) {
      toast({
        variant: "destructive",
        title: "Invalid Price",
        description: "Please enter a valid positive number for the price.",
      });
      // Optionally, reset the input to the old value
      return;
    }
    const itemRef = doc(firestore, "menu_items", itemId);
    try {
      await updateDoc(itemRef, { price: newPrice });
      toast({
        title: "Price Updated",
        description: `The price has been successfully set to ₹${newPrice}.`,
      });
    } catch (err) {
      console.error("Price update failed:", err);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not save the new price.",
      });
    }
  };

  const handleUpdateDescription = async (itemId: string, newDesc: string) => {
    if (!firestore) return;
    const itemRef = doc(firestore, "menu_items", itemId);
    await updateDoc(itemRef, { description: newDesc });
  };

  const handleRemoveImage = async (itemId: string) => {
    if (!firestore) return;
    if (!confirm("Remove this image? The item will stay on the menu.")) return;
    try {
      const itemRef = doc(firestore, "menu_items", itemId);
      await updateDoc(itemRef, { image: "", showImage: false });
      toast({ title: "Image Removed" });
    } catch (err) {
      console.error("Error removing image:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to remove image." });
    }
  };

  const handleUpdateImage = async (itemId: string, newFile: File) => {
    if (!firestore || !storage) return;
    setIsUploading(true);
    try {
      const imageUrl = await uploadMenuImage(storage, newFile);
      if (imageUrl) {
        const itemRef = doc(firestore, "menu_items", itemId);
        await updateDoc(itemRef, { image: imageUrl, showImage: true });
        toast({ title: "Image Updated" });
      }
    } catch (err) {
      console.error("Error updating image:", err);
      toast({ variant: "destructive", title: "Upload Failed", description: "Verify Storage permissions." });
    } finally { setIsUploading(false); }
  };

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !storage) return;
    setIsUploading(true);
    const formData = new FormData(e.currentTarget);
    try {
      let imageUrl = "";
      if (file) {
        imageUrl = await uploadMenuImage(storage, file) || "";
      }
      await addDoc(collection(firestore, "menu_items"), {
        name: formData.get("name"),
        price: Number(formData.get("price")),
        category: formData.get("category"),
        description: formData.get("description"),
        image: imageUrl,
        showImage: imageUrl ? true : false,
        available: true,
        timestamp: serverTimestamp()
      });
      setFile(null);
      (e.target as HTMLFormElement).reset();
      toast({ title: "Item Added", description: "The new treat is live on the menu." });
    } catch (err) {
      console.error("Error adding item:", err);
      toast({ variant: "destructive", title: "Add Failed", description: "Check Storage and Firestore permissions." });
    } finally { setIsUploading(false); }
  };

  return (
    <div className="space-y-8 p-2">
      {/* MASTER IMAGE CONTROL PANEL */}
      <section className="bg-amber-50 border-4 border-stone-800 p-6 rounded-[2rem] shadow-[8px_8px_0_0_#000] flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase italic">Master Image Display</h2>
          <p className="text-xs font-bold text-stone-500 uppercase">Turn off all images on customer website instantly</p>
        </div>
        <Button 
          onClick={toggleGlobalImages}
          className={`h-12 px-8 rounded-2xl font-black uppercase italic border-2 transition-all ${
            globalShowImages 
            ? "bg-emerald-500 text-white border-stone-800 shadow-[4px_4px_0_0_#000] hover:bg-emerald-600 active:translate-y-1" 
            : "bg-stone-200 text-stone-500 border-stone-300"
          }`}
        >
          {globalShowImages ? "All Images: Visible" : "All Images: Hidden"}
        </Button>
      </section>

      {/* ADD ITEM SECTION */}
      <section className="bg-white border-4 border-stone-800 p-6 rounded-[2rem] shadow-[8px_8px_0_0_#000]">
        <h2 className="text-xl font-black uppercase italic mb-6 flex items-center gap-2">
          <Plus className="w-6 h-6" /> Add New Menu Item
        </h2>
        <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
          <Input name="name" placeholder="Item Name" required className="border-2 border-stone-800 rounded-xl" />
          <Input name="price" type="number" placeholder="Price (₹)" required className="border-2 border-stone-800 rounded-xl" />
          <Input name="category" placeholder="Category" required className="border-2 border-stone-800 rounded-xl" />
          
          <Input name="description" placeholder="Short Description" className="border-2 border-stone-800 rounded-xl" />
          
          <div className="relative">
            <label className="flex items-center justify-center w-full h-10 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:bg-stone-50 transition-all">
              <Camera className="w-4 h-4 mr-2" />
              <span className="text-[10px] font-bold uppercase">{file ? "Ready" : "Upload Photo"}</span>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          <Button disabled={isUploading} className="bg-stone-800 text-white hover:bg-amber-500 hover:text-stone-800 font-black uppercase italic h-10 rounded-xl">
            {isUploading ? <Loader2 className="animate-spin" /> : "Save to Cloud"}
          </Button>
        </form>
      </section>

      {/* MENU TABLE */}
      <div className="bg-white border-4 border-stone-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-stone-800 text-white text-[10px] font-black uppercase tracking-[0.2em]">
            <tr>
              <th className="p-6">Item & Image</th>
              <th className="p-6">Description</th>
              <th className="p-6">Visibility</th>
              <th className="p-6">Price</th>
              <th className="p-6">Stock Status</th>
              <th className="p-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-stone-100">
            {items.map((item) => (
              <tr key={item.id} className={`group transition-opacity ${!item.available ? "bg-stone-50 opacity-60" : ""}`}>
                <td className="p-4 flex items-center gap-4">
                  <div className={`relative w-20 h-20 shrink-0 transition-all ${item.showImage === false ? "grayscale opacity-40" : ""}`}>
                    <div className="w-full h-full rounded-2xl bg-stone-100 border-2 border-stone-800 overflow-hidden shadow-sm relative">
                      {item.image ? (
                        <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <ImageIcon size={24} />
                        </div>
                      )}
                      <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 hover:opacity-100 cursor-pointer transition-opacity z-10">
                        <RefreshCw size={20} className={isUploading ? "animate-spin" : ""} />
                        <span className="text-[8px] font-bold uppercase mt-1">Swap</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                          const newFile = e.target.files?.[0];
                          if (newFile) handleUpdateImage(item.id, newFile);
                        }} />
                      </label>
                    </div>
                    {item.image && (
                      <button onClick={(e) => { e.preventDefault(); handleRemoveImage(item.id); }} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full border-2 border-white shadow-lg hover:scale-110 transition-all z-20">
                        <X size={12} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                  <div>
                    <p className="font-black text-stone-800 uppercase italic leading-tight">{item.name}</p>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{item.category}</p>
                  </div>
                </td>

                <td className="p-4">
                  <textarea 
                    defaultValue={item.description}
                    onBlur={(e) => handleUpdateDescription(item.id, e.target.value)}
                    placeholder="Add details..."
                    className="w-full bg-stone-50 text-[10px] font-bold p-2 rounded-xl border-none focus:ring-2 ring-amber-500 resize-none h-16 outline-none"
                  />
                </td>

                <td className="p-4">
                  <button
                    disabled={!item.image}
                    onClick={() => toggleImageVisibility(item)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all font-black text-[9px] uppercase ${
                      !item.image 
                        ? "border-stone-100 text-stone-200 cursor-not-allowed"
                        : item.showImage !== false 
                        ? "border-amber-500 bg-amber-50 text-amber-600 shadow-[2px_2px_0_0_#d97706]" 
                        : "border-stone-300 bg-stone-100 text-stone-500"
                    }`}
                  >
                    {item.showImage !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                    {item.showImage !== false ? "Shown" : "Hidden"}
                  </button>
                </td>

                <td className="p-4">
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                    <Input
                      type="number"
                      defaultValue={item.price}
                      onBlur={(e) => handleUpdatePrice(item.id, Number(e.target.value))}
                      className="w-28 pl-9 font-black text-lg text-white bg-stone-900 border-2 border-stone-700 rounded-xl focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                </td>
                
                <td className="p-4">
                  <button onClick={() => toggleStatus(item)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all border-2 ${item.available ? "bg-emerald-50 border-emerald-500 text-emerald-600" : "bg-rose-50 border-rose-500 text-rose-600"}`}>
                    {item.available ? "In Stock" : "Sold Out"}
                  </button>
                </td>

                <td className="p-4 text-right">
                  <button onClick={async () => { if(confirm("Delete item permanently?")) { if (firestore) await deleteDoc(doc(firestore, "menu_items", item.id)) } }} className="p-3 bg-stone-50 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
