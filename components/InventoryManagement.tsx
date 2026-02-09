
import React, { useState, useEffect } from 'react';
import { User, InventoryItem, InventoryCategory } from '../types';
import { INITIAL_CATEGORIES } from '../constants';
import { Package, Plus, Minus, Search, Bell, BellOff, Trash2, ChevronRight, Tag } from 'lucide-react';

interface InventoryManagementProps {
  currentUser: User;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({ currentUser }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>(INITIAL_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: INITIAL_CATEGORIES[0], count: 0 });

  useEffect(() => {
    const saved = localStorage.getItem('twosome_inventory');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  const save = (updated: InventoryItem[]) => {
    setItems(updated);
    localStorage.setItem('twosome_inventory', JSON.stringify(updated));
  };

  const updateCount = (id: string, delta: number) => {
    save(items.map(i => i.id === id ? { ...i, count: Math.max(0, i.count + delta) } : i));
  };

  const toggleAlert = (id: string) => {
    save(items.map(i => i.id === id ? { ...i, alertEnabled: !i.alertEnabled } : i));
  };

  const deleteItem = (id: string) => {
    if (currentUser.role !== 'OWNER') return;
    if (confirm('삭제하시겠습니까?')) save(items.filter(i => i.id !== id));
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input type="text" placeholder="재고명 검색..." className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl font-bold outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => setIsAdding(true)} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-transform">
          <Plus size={20} /> 새 재고 등록
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <button onClick={() => toggleAlert(item.id)} className={`p-3 rounded-2xl transition-colors ${item.alertEnabled ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-300'}`}>
              {item.alertEnabled ? <Bell size={20} /> : <BellOff size={20} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-gray-400 uppercase tracking-widest">{item.category}</div>
              <div className="text-lg font-black text-gray-800 truncate">{item.name}</div>
              {item.alertEnabled && item.count <= 2 && <span className="text-[10px] font-black text-red-500 animate-pulse">재고 부족 경고</span>}
            </div>
            <div className="flex items-center bg-gray-50 rounded-2xl p-1 border">
              <button onClick={() => updateCount(item.id, -1)} className="w-10 h-10 flex items-center justify-center text-gray-400 active:scale-90"><Minus size={18}/></button>
              <span className="w-10 text-center font-black text-xl">{item.count}</span>
              <button onClick={() => updateCount(item.id, 1)} className="w-10 h-10 flex items-center justify-center text-red-600 active:scale-90"><Plus size={18}/></button>
            </div>
            {currentUser.role === 'OWNER' && <button onClick={() => deleteItem(item.id)} className="p-2 text-gray-200"><Trash2 size={16}/></button>}
          </div>
        ))}
        {filtered.length === 0 && <div className="py-20 text-center text-gray-300 font-bold border-2 border-dashed border-gray-100 rounded-3xl">등록된 재고가 없습니다.</div>}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[70]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl">
            <h3 className="text-2xl font-black mb-6 tracking-tight">재고 등록</h3>
            <div className="space-y-5">
              <select className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="text" placeholder="품목명" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              <div className="flex gap-2 pt-4">
                <button onClick={() => setIsAdding(false)} className="flex-1 py-4 font-black text-gray-400">취소</button>
                <button onClick={() => {
                  if(!newItem.name) return;
                  save([...items, { id: Date.now().toString(), ...newItem, alertEnabled: false }]);
                  setIsAdding(false);
                  setNewItem({ name: '', category: categories[0], count: 0 });
                }} className="flex-1 py-4 bg-black text-white font-black rounded-2xl shadow-xl">등록</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
