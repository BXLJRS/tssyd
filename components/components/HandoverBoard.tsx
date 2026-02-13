
import React, { useState } from 'react';
import { Handover, User } from '../types';
import { formatDate } from '../utils';
import { ClipboardList, Plus, Trash2, Bold, Palette } from 'lucide-react';

interface HandoverBoardProps {
  currentUser: User;
  // Use passed data instead of local state to ensure sync
  data: Handover[];
  onUpdate: (updated: Handover[]) => void;
}

export const HandoverBoard: React.FC<HandoverBoardProps> = ({ currentUser, data, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    content: '', 
    color: '#000000', 
    isBold: false 
  });

  const handleAdd = () => {
    if (!formData.title || !formData.content) return;
    // Fix: Added missing updatedAt
    const item: Handover = {
      id: Date.now().toString(),
      title: formData.title,
      content: formData.content,
      authorId: currentUser.id,
      authorNickname: currentUser.nickname,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      styles: { color: formData.color, isBold: formData.isBold }
    };
    onUpdate([item, ...data]);
    setFormData({ title: '', content: '', color: '#000000', isBold: false });
    setIsAdding(false);
  };

  const deleteItem = (id: string) => {
    if (confirm('인계사항을 삭제하시겠습니까?')) {
      onUpdate(data.filter(h => h.id !== id));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <ClipboardList className="text-blue-600" /> 인계인수사항
        </h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition shadow-sm"
        >
          <Plus size={18} /> 인계사항 추가
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4">
          <input 
            type="text" 
            placeholder="제목"
            className="w-full p-2 border-b text-lg font-medium outline-none focus:border-blue-500"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
          <textarea 
            placeholder="내용을 입력하세요..."
            style={{ color: formData.color, fontWeight: formData.isBold ? 'bold' : 'normal' }}
            className="w-full p-2 border rounded-md h-32 focus:ring-1 focus:ring-blue-200 outline-none"
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
          />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Palette size={16} />
              <input 
                type="color" 
                value={formData.color} 
                onChange={e => setFormData({ ...formData, color: e.target.value })}
                className="w-8 h-8 rounded-full overflow-hidden border-none p-0 bg-transparent cursor-pointer"
              />
            </div>
            <button 
              onClick={() => setFormData({ ...formData, isBold: !formData.isBold })}
              className={`p-2 rounded border ${formData.isBold ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
            >
              <Bold size={16} />
            </button>
            <div className="flex-1 flex justify-end gap-2">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600">취소</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">등록</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {data.map(item => (
          <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{formatDate(item.createdAt)}</span>
                <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p 
              className="whitespace-pre-wrap leading-relaxed" 
              style={{ color: item.styles?.color, fontWeight: item.styles?.isBold ? 'bold' : 'normal' }}
            >
              {item.content}
            </p>
            <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
              <span>작성자: <span className="text-gray-600 font-medium">{item.authorNickname}</span></span>
            </div>
          </div>
        ))}
        {data.length === 0 && !isAdding && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400">
            표시할 인계사항이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};
