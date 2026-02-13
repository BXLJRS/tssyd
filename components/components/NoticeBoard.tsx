
import React, { useState } from 'react';
import { Notice, User } from '../types';
import { formatDate } from '../utils';
import { Megaphone, Pin, Plus, Trash2, X } from 'lucide-react';

interface NoticeBoardProps {
  currentUser: User;
  data: Notice[];
  onUpdate: (updated: Notice[]) => void;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({ currentUser, data, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '', isPinned: false });

  const handleAdd = () => {
    if (!newNotice.title || !newNotice.content) return;
    const item: Notice = {
      id: Date.now().toString(),
      ...newNotice,
      authorId: currentUser.id,
      authorNickname: currentUser.nickname,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    onUpdate([item, ...data]);
    setIsAdding(false);
    setNewNotice({ title: '', content: '', isPinned: false });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('이 공지사항을 정말 삭제하시겠습니까? 삭제된 내용은 복구할 수 없습니다.')) {
      onUpdate(data.filter(i => i.id !== id));
    }
  };

  const sorted = [...data].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-2xl font-black flex items-center gap-2"><Megaphone className="text-red-600" /> 공지사항</h2>
        <button onClick={() => setIsAdding(true)} className="p-3 bg-red-600 text-white rounded-2xl shadow-lg"><Plus size={24}/></button>
      </div>

      <div className="space-y-4">
        {sorted.map(n => (
          <div key={n.id} className={`p-6 rounded-[2rem] border transition-all ${n.isPinned ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {n.isPinned && <Pin size={16} className="text-red-600 fill-red-600" />}
                <h3 className="text-lg font-black text-gray-900">{n.title}</h3>
              </div>
              <button onClick={() => handleDelete(n.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><Trash2 size={18}/></button>
            </div>
            <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{n.content}</p>
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] font-black text-gray-400">
              <span>{n.authorNickname} • {formatDate(n.createdAt)}</span>
            </div>
          </div>
        ))}
        {sorted.length === 0 && <div className="py-20 text-center text-gray-300 font-bold">공지사항이 없습니다.</div>}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[60]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black">공지 작성</h3>
            <input type="text" placeholder="제목" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} />
            <textarea placeholder="내용" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold h-32" value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})} />
            {currentUser.role === 'OWNER' && (
              <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-gray-500">
                <input type="checkbox" checked={newNotice.isPinned} onChange={e => setNewNotice({...newNotice, isPinned: e.target.checked})} className="w-5 h-5 accent-red-600" /> 상단 고정
              </label>
            )}
            <div className="flex gap-2">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-4 font-black text-gray-400">취소</button>
              <button onClick={handleAdd} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black">등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
