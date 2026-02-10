
import React, { useState, useEffect } from 'react';
import { User, ShiftPart, ChecklistItem, DailyReport } from '../types';
import { SHIFT_LABELS } from '../constants';
import { getTodayDateString, getDayOfWeek } from '../utils';
import { CheckSquare, Square, Plus, Send, Clock, CheckCircle2, AlertCircle, Trash2, Coffee } from 'lucide-react';

interface ChecklistBoardProps {
  currentUser: User;
  onUpdate?: () => void;
}

export const ChecklistBoard: React.FC<ChecklistBoardProps> = ({ currentUser, onUpdate }) => {
  const [activePart, setActivePart] = useState<ShiftPart>('OPEN');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [memo, setMemo] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [newItemPart, setNewItemPart] = useState<ShiftPart | 'COMMON'>('OPEN');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 근무 시간 입력 상태
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hasBreak, setHasBreak] = useState(true);

  const today = getTodayDateString();
  const dayName = getDayOfWeek(today);

  useEffect(() => {
    const saved = localStorage.getItem('twosome_current_tasks');
    const lastReset = localStorage.getItem('twosome_last_reset');
    const now = new Date();
    const todayResetTime = new Date();
    todayResetTime.setHours(8, 0, 0, 0);

    if (now >= todayResetTime && (!lastReset || lastReset !== today)) {
      const template = JSON.parse(localStorage.getItem('twosome_tasks_template') || '[]');
      const resetTasks = template.map((t: ChecklistItem) => ({ ...t, isCompleted: false, notes: '' }));
      setItems(resetTasks);
      localStorage.setItem('twosome_current_tasks', JSON.stringify(resetTasks));
      localStorage.setItem('twosome_last_reset', today);
      localStorage.setItem('twosome_is_submitted_today', 'false');
    } else {
      if (saved) setItems(JSON.parse(saved));
      setIsSubmitted(localStorage.getItem('twosome_is_submitted_today') === 'true');
    }
  }, [today]);

  const save = (updated: ChecklistItem[]) => {
    setItems(updated);
    localStorage.setItem('twosome_current_tasks', JSON.stringify(updated));
    if (currentUser.role === 'OWNER') {
      localStorage.setItem('twosome_tasks_template', JSON.stringify(updated));
    }
    onUpdate?.();
  };

  const toggle = (id: string) => {
    save(items.map(i => i.id === id ? { ...i, isCompleted: !i.isCompleted } : i));
  };

  const updateNote = (id: string, note: string) => {
    save(items.map(i => i.id === id ? { ...i, notes: note } : i));
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    const newItems: ChecklistItem[] = [];
    const baseId = Date.now().toString();
    if (newItemPart === 'COMMON') {
      (['OPEN', 'MIDDLE', 'CLOSE21', 'CLOSE22'] as ShiftPart[]).forEach((p, idx) => {
        newItems.push({ id: `${baseId}-${idx}`, part: p, content: newItemText, isCompleted: false });
      });
    } else {
      newItems.push({ id: baseId, part: newItemPart as ShiftPart, content: newItemText, isCompleted: false });
    }
    const updated = [...items, ...newItems];
    save(updated);
    if (currentUser.role !== 'OWNER') {
      localStorage.setItem('twosome_tasks_template', JSON.stringify(updated));
    }
    setNewItemText('');
    setIsAdding(false);
  };

  const deleteItem = (id: string) => {
    if (currentUser.role !== 'OWNER') return;
    if (confirm('삭제하시겠습니까?')) save(items.filter(i => i.id !== id));
  };

  const submit = () => {
    const partItems = items.filter(i => i.part === activePart);
    if (partItems.length === 0) return;
    
    // 필수 입력 체크
    if (!startTime || !endTime) {
      alert('근무 시작 시간과 종료 시간을 입력해주세요.');
      return;
    }

    if (partItems.some(i => !i.isCompleted && !i.notes?.trim())) {
      alert('체크하지 못한 항목은 사유를 작성해주세요.');
      return;
    }

    const report: DailyReport = { 
      id: Date.now().toString(),
      date: today, 
      part: activePart, 
      items: partItems, 
      memoToOwner: memo, 
      isApproved: false, 
      submittedAt: Date.now(),
      authorId: currentUser.id,
      authorNickname: currentUser.nickname,
      actualStartTime: startTime,
      actualEndTime: endTime,
      hasBreak: hasBreak
    };

    const reports = JSON.parse(localStorage.getItem('twosome_reports') || '[]');
    localStorage.setItem('twosome_reports', JSON.stringify([...reports, report]));
    
    // 호환성을 위해 pending_reports도 업데이트
    const pendingReports = JSON.parse(localStorage.getItem('twosome_pending_reports') || '[]');
    localStorage.setItem('twosome_pending_reports', JSON.stringify([...pendingReports, report]));

    setIsSubmitted(true);
    localStorage.setItem('twosome_is_submitted_today', 'true');
    alert('근무 기록 및 보고가 완료되었습니다.');
    onUpdate?.();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-xl font-black text-gray-900">{today} {dayName}요일</h2>
          <p className="text-xs font-bold text-gray-400">파트 업무 체크리스트</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="p-3 bg-red-600 text-white rounded-2xl shadow-lg active:scale-95 transition-transform"><Plus size={24}/></button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-2 py-1">
        {(['OPEN', 'MIDDLE', 'CLOSE21', 'CLOSE22'] as ShiftPart[]).map(p => (
          <button key={p} onClick={() => setActivePart(p)}
            className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-sm transition-all ${activePart === p ? 'bg-red-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'}`}
          >
            {SHIFT_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 bg-gray-50/50 border-b flex items-center gap-2">
          <Clock size={18} className="text-gray-400" />
          <span className="font-black text-gray-700">{SHIFT_LABELS[activePart]} 필수 체크</span>
        </div>
        <div className="divide-y divide-gray-50">
          {items.filter(i => i.part === activePart).map(item => (
            <div key={item.id} className="p-5 flex items-start gap-4">
              <button onClick={() => toggle(item.id)} className="mt-1 flex-shrink-0">
                {item.isCompleted ? <CheckCircle2 className="text-red-600" size={28} /> : <Square className="text-gray-200" size={28} />}
              </button>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className={`font-bold leading-tight ${item.isCompleted ? 'text-gray-300 line-through' : 'text-gray-800 text-lg'}`}>{item.content}</span>
                  {currentUser.role === 'OWNER' && <button onClick={() => deleteItem(item.id)} className="text-gray-300 p-1"><Trash2 size={16}/></button>}
                </div>
                {!item.isCompleted && (
                  <input type="text" placeholder="사유를 작성하세요 (필수)" className="w-full text-sm p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-red-100" value={item.notes || ''} onChange={e => updateNote(item.id, e.target.value)} />
                )}
              </div>
            </div>
          ))}
          {items.filter(i => i.part === activePart).length === 0 && (
            <div className="p-16 text-center text-gray-400 font-bold">등록된 업무가 없습니다.</div>
          )}
        </div>

        {/* 근무 시간 정보 입력 섹션 */}
        <div className="p-6 bg-red-50/30 border-t border-red-100 space-y-4">
          <h4 className="text-sm font-black text-red-600 flex items-center gap-2">
            <Clock size={16} /> 실제 근무 정보 입력 (필수)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 ml-1">출근 시간</label>
              <input type="time" className="w-full p-3 bg-white border border-gray-100 rounded-xl font-bold" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 ml-1">퇴근 시간</label>
              <input type="time" className="w-full p-3 bg-white border border-gray-100 rounded-xl font-bold" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <button 
            onClick={() => setHasBreak(!hasBreak)}
            className={`w-full p-3 rounded-xl flex items-center justify-between border transition-all ${hasBreak ? 'bg-white border-red-200 text-red-600' : 'bg-white border-gray-100 text-gray-400'}`}
          >
            <span className="font-bold text-sm">30분 휴게 여부</span>
            {hasBreak ? <CheckCircle2 size={18} /> : <Square size={18} />}
          </button>
        </div>

        <div className="p-6 bg-gray-50 border-t space-y-4">
          <textarea placeholder="사장님께 전달할 추가 특이사항..." className="w-full p-4 rounded-2xl border border-gray-100 h-24 text-sm font-medium outline-none shadow-inner" value={memo} onChange={e => setMemo(e.target.value)} />
          <button 
            disabled={isSubmitted || !startTime || !endTime} 
            onClick={submit} 
            className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 ${isSubmitted ? 'bg-green-500 text-white' : (!startTime || !endTime ? 'bg-gray-300 text-white' : 'bg-black text-white')}`}
          >
            {isSubmitted ? '오늘 보고 완료' : '사장님께 보고 및 승인 요청'}
          </button>
          {(!startTime || !endTime) && !isSubmitted && <p className="text-[10px] text-center text-red-500 font-bold">근무 시간을 입력해야 보고할 수 있습니다.</p>}
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[70]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black mb-6 tracking-tight">업무 추가</h3>
            <div className="space-y-5">
              <input type="text" placeholder="할 일 내용" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={newItemText} onChange={e => setNewItemText(e.target.value)} />
              <select className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={newItemPart} onChange={e => setNewItemPart(e.target.value as any)}>
                <option value="COMMON">📢 모든 파트 공통</option>
                <option value="OPEN">☀️ 오픈</option>
                <option value="MIDDLE">🌤️ 미들</option>
                <option value="CLOSE21">🌙 21시 마감</option>
                <option value="CLOSE22">🌑 22시 마감</option>
              </select>
              <div className="flex gap-2 pt-4">
                <button onClick={() => setIsAdding(false)} className="flex-1 py-4 font-black text-gray-400">취소</button>
                <button onClick={addItem} className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl">등록</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
