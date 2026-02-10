
import React, { useState, useEffect } from 'react';
import { Reservation, User } from '../types';
import { Plus, Search, Calendar, Phone, User as UserIcon, Trash2, CheckCircle, Clock, Check } from 'lucide-react';

interface ReservationManagementProps {
  currentUser: User;
  // Added onUpdate prop to fix TypeScript error in App.tsx
  onUpdate?: () => void;
}

export const ReservationManagement: React.FC<ReservationManagementProps> = ({ currentUser, onUpdate }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ customerName: '', phoneNumber: '', date: new Date().toISOString().split('T')[0], time: '12:00', item: '', notes: '' });

  useEffect(() => {
    const saved = localStorage.getItem('twosome_reservations');
    if (saved) setReservations(JSON.parse(saved));
  }, []);

  const saveReservations = (updated: Reservation[]) => {
    setReservations(updated);
    localStorage.setItem('twosome_reservations', JSON.stringify(updated));
    // Trigger cloud sync if provided
    onUpdate?.();
  };

  const handleAdd = () => {
    if (!formData.customerName || !formData.item) {
      alert('필수 정보를 입력해 주세요.');
      return;
    }
    const newRes: Reservation = { id: Date.now().toString(), ...formData, isCompleted: false, createdAt: Date.now() };
    saveReservations([newRes, ...reservations]);
    setIsAdding(false);
    setFormData({ customerName: '', phoneNumber: '', date: new Date().toISOString().split('T')[0], time: '12:00', item: '', notes: '' });
  };

  const toggleComplete = (id: string) => {
    saveReservations(reservations.map(r => r.id === id ? { ...r, isCompleted: !r.isCompleted } : r));
  };

  const deleteRes = (id: string) => {
    if (confirm('예약을 취소/삭제할까요?')) {
      saveReservations(reservations.filter(r => r.id !== id));
    }
  };

  // 정렬 로직: 완료된 항목은 아래로, 미완료 항목은 시간순으로
  const filtered = reservations.filter(r => 
    r.customerName.includes(searchTerm) || r.item.includes(searchTerm) || r.phoneNumber.includes(searchTerm)
  ).sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime();
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="예약자명, 품목, 연락처 검색..." className="w-full pl-14 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-100 font-bold transition-all"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => setIsAdding(true)} className="w-full md:w-auto bg-red-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2">
          <Plus size={20} /> 예약 등록
        </button>
      </div>

      <div className="space-y-4">
        {filtered.map(res => (
          <div key={res.id} className={`bg-white p-6 rounded-[2rem] shadow-sm border-2 transition-all duration-300 ${res.isCompleted ? 'border-gray-100 opacity-60 bg-gray-50 scale-98' : 'border-white hover:border-red-200 hover:-translate-y-1'}`}>
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  {res.isCompleted ? (
                    <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1"><Check size={12}/> 수령 완료</span>
                  ) : (
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase animate-pulse">픽업 대기</span>
                  )}
                  <h3 className={`text-xl font-black ${res.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{res.item}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-bold">
                  <div className="flex items-center gap-2 text-gray-600"><UserIcon size={16} className="text-red-400"/> {res.customerName}님</div>
                  <div className="flex items-center gap-2 text-gray-600"><Phone size={16} className="text-red-400"/> {res.phoneNumber || '미입력'}</div>
                  <div className="flex items-center gap-2 text-gray-600"><Calendar size={16} className="text-red-400"/> {res.date}</div>
                  <div className="flex items-center gap-2 text-red-600 font-black"><Clock size={16}/> {res.time} 수령</div>
                </div>
                {res.notes && <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs text-gray-500 italic font-medium">💡 요청사항: {res.notes}</div>}
              </div>
              <div className="flex md:flex-col gap-2 min-w-[140px]">
                <button onClick={() => toggleComplete(res.id)}
                  className={`flex-1 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${res.isCompleted ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-green-600 text-white shadow-lg shadow-green-100 hover:bg-green-700'}`}
                >
                  <CheckCircle size={20}/> {res.isCompleted ? '미수령 처리' : '수령 확인'}
                </button>
                <button onClick={() => deleteRes(res.id)} className="p-4 bg-gray-50 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors"><Trash2 size={20}/></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 text-gray-400 font-bold">검색 결과가 없거나 예약이 없습니다.</div>}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-fade-in-up">
            <h3 className="text-2xl font-black mb-8">신규 예약 등록</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-xs font-black text-gray-400 block mb-2 uppercase">품목</label>
                <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-red-100" value={formData.item} onChange={e => setFormData({ ...formData, item: e.target.value })} placeholder="예: 스초생 1호" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 block mb-2 uppercase">고객명</label>
                <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-red-100" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 block mb-2 uppercase">연락처</label>
                <input type="text" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-red-100" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} placeholder="010-0000-0000" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 block mb-2 uppercase">날짜</label>
                <input type="date" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-red-100" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 block mb-2 uppercase">시간</label>
                <input type="time" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-red-100" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-black text-gray-400 block mb-2 uppercase">기타 메모</label>
                <textarea className="w-full p-4 bg-gray-50 border rounded-2xl outline-none h-24 focus:ring-2 focus:ring-red-100 resize-none" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="초 개수, 레터링 등" />
              </div>
            </div>
            <div className="flex gap-3 mt-10">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-5 font-black text-gray-500 hover:bg-gray-50 rounded-3xl transition-colors">닫기</button>
              <button onClick={handleAdd} className="flex-1 py-5 bg-red-600 text-white font-black rounded-3xl shadow-xl active:scale-95 transition-all">예약 저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
