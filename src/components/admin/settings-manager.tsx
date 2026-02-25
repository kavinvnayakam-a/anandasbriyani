"use client"

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table as TableType } from '@/lib/types';
import { Plus, Trash2, Loader2, Armchair } from 'lucide-react';

export default function SettingsManager() {
  const [tables, setTables] = useState<TableType[]>([]);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'tables'), orderBy('tableNumber'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableType)));
    });
    return () => unsubscribe();
  }, [firestore]);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !newTableNumber.trim()) return;
    setIsLoading(true);
    try {
      await addDoc(collection(firestore, 'tables'), {
        tableNumber: newTableNumber.trim(),
      });
      toast({ title: 'Table Added', description: `Table ${newTableNumber} is now available.` });
      setNewTableNumber('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add the table.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!firestore) return;
    const isConfirmed = confirm('Are you sure you want to delete this table? This cannot be undone.');
    if (!isConfirmed) return;

    try {
      await deleteDoc(doc(firestore, 'tables', id));
      toast({ title: 'Table Removed' });
    } catch (error: any) {
      console.error("Error deleting table:", error);
      if (error.code === 'failed-precondition') {
        toast({
          variant: 'destructive',
          title: 'Deletion Failed',
          description: 'This table has active orders and cannot be deleted. Please clear associated orders first.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not remove the table.',
        });
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <Armchair size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-900">Table Management</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Add or remove restaurant tables</p>
          </div>
        </div>

        <form onSubmit={handleAddTable} className="flex gap-4 mb-6">
          <Input
            placeholder="Enter Table Number (e.g., '1', 'A5')"
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(e.target.value)}
            className="h-12 bg-zinc-50 border-zinc-200 rounded-xl font-bold"
            required
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 px-6 bg-zinc-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-primary transition-all"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Plus />}
            <span>Add Table</span>
          </Button>
        </form>

        <div className="space-y-2">
          {tables.map(table => (
            <div key={table.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="font-bold text-zinc-800">Table {table.tableNumber}</span>
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-red-500 hover:bg-red-50 h-8 w-8" onClick={() => handleDeleteTable(table.id)}>
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
          {tables.length === 0 && (
            <p className="text-center text-sm text-zinc-400 py-4">No tables configured yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
