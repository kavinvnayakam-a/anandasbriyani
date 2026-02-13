"use client"

import { useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { importMenu, type ImportMenuOutput } from "@/ai/flows/import-menu-flow";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Sparkles, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AiMenuImporter() {
  const [inputText, setInputText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedItems, setParsedItems] = useState<ImportMenuOutput['items']>([]);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleParse = async () => {
    if (!inputText.trim()) return;
    setIsParsing(true);
    try {
      const result = await importMenu(inputText);
      setParsedItems(result.items);
      toast({ title: "AI Parsing Complete", description: `Found ${result.items.length} potential items.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Parsing Failed", description: "AI couldn't read that text clearly." });
    } finally {
      setIsParsing(false);
    }
  };

  const removeItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    if (!firestore || parsedItems.length === 0) return;
    setIsSaving(true);
    try {
      const menuRef = collection(firestore, "menu_items");
      for (const item of parsedItems) {
        await addDoc(menuRef, {
          ...item,
          image: "",
          showImage: false,
          available: true,
          timestamp: serverTimestamp(),
        });
      }
      toast({ title: "Import Successful", description: `Added ${parsedItems.length} items to Dasara Menu.` });
      setParsedItems([]);
      setInputText("");
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: "Could not push items to the cloud." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <Card className="border-4 border-slate-900 rounded-[2.5rem] shadow-[8px_8px_0_0_#000] overflow-hidden">
        <CardHeader className="bg-slate-900 text-white p-8">
          <div className="flex items-center gap-3">
            <Sparkles className="text-primary animate-pulse" />
            <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">AI Text Importer</CardTitle>
          </div>
          <CardDescription className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
            Paste your raw menu text below
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <Textarea 
            placeholder="e.g. Chicken Biryani 250, Veg Pulao - 180..." 
            className="min-h-[300px] border-4 border-slate-100 rounded-[2rem] p-6 text-sm font-medium focus:border-primary transition-all outline-none resize-none"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <Button 
            onClick={handleParse} 
            disabled={isParsing || !inputText.trim()}
            className="w-full h-16 bg-primary hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none transition-all"
          >
            {isParsing ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {isParsing ? "AI is Thinking..." : "Analyze Menu Text"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {parsedItems.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-black italic uppercase text-slate-900">Detected Items ({parsedItems.length})</h3>
              <Button 
                onClick={handleSaveAll} 
                disabled={isSaving}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl px-6"
              >
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Confirm & Save
              </Button>
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
              {parsedItems.map((item, idx) => (
                <div key={idx} className="bg-white border-2 border-slate-900 p-5 rounded-3xl shadow-[4px_4px_0_0_#000] flex justify-between items-center group animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="space-y-1">
                    <p className="font-black italic text-slate-900 uppercase">{item.name}</p>
                    <div className="flex gap-2">
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-lg font-black uppercase">{item.category}</span>
                      <span className="text-[10px] font-bold text-slate-400">₹{item.price}</span>
                    </div>
                  </div>
                  <button onClick={() => removeItem(idx)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem] text-center text-slate-300">
            <Sparkles size={48} className="mb-4 opacity-20" />
            <p className="font-black italic uppercase tracking-widest text-sm">Waiting for Analysis</p>
            <p className="text-[10px] font-bold mt-2 max-w-[200px]">Paste menu text on the left to structured your data with AI</p>
          </div>
        )}
      </div>
    </div>
  );
}
