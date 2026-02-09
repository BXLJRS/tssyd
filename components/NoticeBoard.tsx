
import React, { useState, useEffect } from 'react';
import { Notice, User } from '../types';
import { formatDate } from '../utils';
import { Megaphone, Pin, Plus, Trash2 } from 'lucide-react';

interface NoticeBoardProps {
  currentUser: User;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({ currentUser }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '', isPinned: false });

  useEffect(() => {
    const saved = localStorage.getItem('twosome_notices');
    if (saved) setNotices(JSON.parse(saved));
  }, []);

  const saveNotices = (updated: Notice[]) => {
    setNotices(updated);
    localStorage.setItem('twosome_notices', JSON.stringify(updated));
  };

  const handleAddNotice = () => {
    if (!newNotice.title || !newNotice.content) return;
    
    const notice: Notice = {
      id: Date.now().toString(),
      title: newNotice.title,
      content: newNotice.content,
      authorId: currentUser.id,
      authorNickname: currentUser.nickname,
      isPinned: currentUser.role === 'OWNER' ? newNotice.isPinned : false,
      createdAt: Date.now()
    };

    saveNotices([notice, ...notices]);
    setNewNotice({ title: '', content: '', isPinned: false });
    setIsAdding(false);
  };

  const deleteNotice = (id: string) => {
    if (confirm('공지사항을 삭제하시겠습니까?')) {
      saveNotices(notices.filter(n => n.id !== id));
    }
  };

  const sortedNotices = [...notices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="text-red-600" /> 공지사항
        </h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition"
        >
          <Plus size={18} /> 작성하기
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4">
          <input 
            type="text" 
            placeholder="제목을 입력하세요"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-red-500 outline-none"
            value={newNotice.title}
            onChange={e => setNewNotice({ ...newNotice, title: e.target.value })}
          />
          <textarea 
            placeholder="내용을 입력하세요"
            className="w-full p-2 border rounded-md h-32 focus:ring-2 focus:ring-red-500 outline-none"
            value={newNotice.content}
            onChange={e => setNewNotice({ ...newNotice, content: e.target.value })}
          />
          <div className="flex justify-between items-center">
            {currentUser.role === 'OWNER' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={newNotice.isPinned}
                  onChange={e => setNewNotice({ ...newNotice, isPinned: e.target.checked })}
                  className="w-4 h-4 accent-red-600"
                />
                <span className="text-sm font-medium">상단 고정</span>
              </label>
            )}
            <div className="flex gap-2">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">취소</button>
              <button onClick={handleAddNotice} className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800">등록</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {sortedNotices.map(notice => (
          <div 
            key={notice.id} 
            className={`p-5 rounded-xl border transition-all ${notice.isPinned ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-white border-gray-100 shadow-sm'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {notice.isPinned && <Pin size={16} className="text-red-600 fill-red-600" />}
                <h3 className={`text-lg font-bold ${notice.isPinned ? 'text-red-900' : 'text-gray-900'}`}>{notice.title}</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{formatDate(notice.createdAt)}</span>
                {(currentUser.role === 'OWNER' || currentUser.id === notice.authorId) && (
                  <button onClick={() => deleteNotice(notice.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{notice.content}</p>
            <div className="mt-3 text-xs font-medium text-gray-400">작성자: {notice.authorNickname}</div>
          </div>
        ))}
        {sortedNotices.length === 0 && !isAdding && (
          <div className="text-center py-12 text-gray-400">등록된 공지사항이 없습니다.</div>
        )}
      </div>
    </div>
  );
};
