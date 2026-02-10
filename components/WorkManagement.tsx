
import React, { useState, useEffect } from 'react';
import { User, WorkSchedule } from '../types';
import { calculateWorkHours, getTodayDateString, getDayOfWeek } from '../utils';
import { Calendar as CalendarIcon, Clock, Star, Users, Plus, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface WorkManagementProps {
  currentUser: User;
  allUsers: User[];
  // Added externalData to fix TypeScript error in App.tsx and enable cloud sync
  externalData?: WorkSchedule[];
  onUpdate?: () => void;
}

export const WorkManagement: React.FC<WorkManagementProps> = ({ currentUser, allUsers, externalData = [], onUpdate }) => {
  // Initialized state with externalData for cloud synchronization
  const [schedules, setSchedules] = useState<WorkSchedule[]>(externalData);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [isEditing, setIsEditing] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); 
  const [currentEdit, setCurrentEdit] = useState<Partial<WorkSchedule>>({
    startTime: '09:30',
    endTime: '17:00',
    hasBreak: true,
    notes: ''
  });

  // Synchronize local state when external data changes (e.g., after cloud sync)
  useEffect(() => {
    if (externalData && externalData.length > 0) {
      setSchedules(externalData);
    }
  }, [externalData]);

  useEffect(() => {
    const saved = localStorage.getItem('twosome_schedules');
    if (saved && (!externalData || externalData.length === 0)) setSchedules(JSON.parse(saved));
  }, [externalData]);

  const saveSchedules = (updated: WorkSchedule[]) => {
    setSchedules(updated);
    localStorage.setItem('twosome_schedules', JSON.stringify(updated));
    // Trigger cloud sync if provided
    onUpdate?.();
  };

  const handleAddSchedule = () => {
    if (!currentEdit.userId || !currentEdit.startTime || !currentEdit.endTime) {
      alert('직원과 시간을 정확히 선택해 주세요.');
      return;
    }
    const user = allUsers.find(u => u.id === currentEdit.userId);
    if (!user) return;

    const newSchedule: WorkSchedule = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.nickname,
      date: selectedDate,
      startTime: currentEdit.startTime,
      endTime: currentEdit.endTime,
      hasBreak: !!currentEdit.hasBreak,
      notes: currentEdit.notes
    };
    saveSchedules([...schedules, newSchedule]);
    setIsEditing(false);
    setCurrentEdit({ startTime: '09:30', endTime: '17:00', hasBreak: true, notes: '' });
  };

  const deleteSchedule = (id: string) => {
    if (currentUser.role !== 'OWNER') return;
    if (confirm('해당 근무 스케줄을 삭제할까요?')) {
      saveSchedules(schedules.filter(s => s.id !== id));
    }
  };

  // 월간 달력 생성
  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);

  const calendarDays = [];
  for (let i = 0; i < startOffset; i++) calendarDays.push(null);
  for (let i = 1; i <= totalDays; i++) calendarDays.push(i);

  // 선택된 날짜의 해당 주(월~일) 달력 생성
  const getWeekDates = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0:일, 1:월 ...
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 월요일 기준
    const monday = new Date(date.setDate(diff));
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i - 1); // 일요일부터 표시하고 싶다면 조정 가능. 여기선 월~일.
      return d.toISOString().split('T')[0];
    });
  };

  const weekDates = getWeekDates(selectedDate);
  const daySchedules = schedules.filter(s => s.date === selectedDate);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* 헤더 */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-black text-white p-4 rounded-2xl shadow-xl"><CalendarIcon size={28}/></div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">{selectedDate} ({getDayOfWeek(selectedDate)})</h2>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Store Work Management</p>
          </div>
        </div>
        {currentUser.role === 'OWNER' && (
          <button onClick={() => setIsEditing(true)} className="w-full md:w-auto bg-red-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
            <Plus size={20}/> 근무 계획 추가
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* 왼쪽: 월간 달력 및 주간 요약 */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-800">{year}년 {month + 1}월</h3>
              <div className="flex gap-2">
                <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-2 hover:bg-gray-50 rounded-full"><ChevronLeft/></button>
                <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-2 hover:bg-gray-50 rounded-full"><ChevronRight/></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <div key={d} className={`text-[10px] font-black uppercase tracking-widest mb-2 ${i === 0 ? 'text-red-500' : 'text-gray-400'}`}>{d}</div>
              ))}
              {calendarDays.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = dateStr === selectedDate;
                const hasWork = schedules.some(s => s.date === dateStr);
                return (
                  <button key={day} onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all relative ${isSelected ? 'bg-black text-white shadow-lg scale-105 z-10' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                  >
                    <span className="text-sm font-black">{day}</span>
                    {hasWork && !isSelected && <div className="absolute bottom-2 w-1.5 h-1.5 bg-red-500 rounded-full" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 주간 달력 간단 표출 */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-2">선택 주간 요약</h4>
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map(date => {
                const isSelected = date === selectedDate;
                const hasWork = schedules.some(s => s.date === date);
                return (
                  <button key={date} onClick={() => setSelectedDate(date)}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${isSelected ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-50 text-gray-400'}`}
                  >
                    <span className="text-[10px] font-black">{getDayOfWeek(date)}</span>
                    <span className="text-xs font-black">{date.split('-')[2]}</span>
                    {hasWork && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-red-600' : 'bg-gray-300'}`} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 오른쪽: 상세 정보 */}
        <div className="lg:col-span-5 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-l-4 border-red-600 pl-3">배정 인원 및 시간표</h3>
          <div className="space-y-4">
            {daySchedules.map(s => (
              <div key={s.id} className="group relative p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-red-200 transition-all">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-black text-gray-400 border border-gray-200">{s.userName.slice(0, 1)}</div>
                    <div>
                      <div className="font-black text-gray-800 flex items-center gap-2">{s.userName} {s.notes && <Star size={14} className="text-yellow-400 fill-yellow-400"/>}</div>
                      <div className="text-xs text-gray-400 font-bold flex items-center gap-1"><Clock size={12}/> {s.startTime} ~ {s.endTime}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-gray-900">{calculateWorkHours(s.startTime, s.endTime, s.hasBreak)}시간</div>
                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{s.hasBreak ? '30분 휴게 자동차감' : '휴게 없음'}</div>
                  </div>
                </div>
                {s.notes && <div className="mt-4 p-4 bg-white border border-yellow-50 text-yellow-800 rounded-xl text-xs font-bold leading-relaxed">✨ {s.notes}</div>}
                {currentUser.role === 'OWNER' && (
                  <button onClick={() => deleteSchedule(s.id)} className="absolute -top-2 -right-2 w-8 h-8 bg-white text-gray-300 hover:text-red-500 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><X size={16} /></button>
                )}
              </div>
            ))}
            {daySchedules.length === 0 && (
              <div className="text-center py-24 flex flex-col items-center gap-4 border-2 border-dashed border-gray-100 rounded-3xl">
                <Users size={48} className="text-gray-100" />
                <p className="text-gray-300 font-bold">배정된 인원이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-fade-in-up">
            <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">근무자 배정</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">직원 선택</label>
                <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-2 border border-gray-50 p-2 rounded-2xl">
                  {allUsers.map(u => (
                    <button key={u.id} onClick={() => setCurrentEdit({...currentEdit, userId: u.id})}
                      className={`w-full p-4 rounded-xl text-left font-black transition-all flex justify-between items-center ${currentEdit.userId === u.id ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                      <span>{u.nickname}</span>
                      <span className="text-[10px] opacity-60 uppercase">{u.role}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">시작</label>
                  <input type="time" className="w-full p-4 bg-gray-50 border rounded-2xl font-black outline-none focus:ring-2 focus:ring-red-100" value={currentEdit.startTime} onChange={e => setCurrentEdit({...currentEdit, startTime: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">종료</label>
                  <input type="time" className="w-full p-4 bg-gray-50 border rounded-2xl font-black outline-none focus:ring-2 focus:ring-red-100" value={currentEdit.endTime} onChange={e => setCurrentEdit({...currentEdit, endTime: e.target.value})} />
                </div>
              </div>
              <button onClick={() => setCurrentEdit({...currentEdit, hasBreak: !currentEdit.hasBreak})}
                className={`w-full p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${currentEdit.hasBreak ? 'bg-red-50 border-red-100 text-red-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
              >
                <span className="font-black text-sm">30분 법정 휴게 포함</span>
                <Clock size={20} className={currentEdit.hasBreak ? 'opacity-100' : 'opacity-20'} />
              </button>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">특이사항 (입력 시 별표 표시)</label>
                <input type="text" placeholder="예: 케이크 대량 예약일" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none font-bold" value={currentEdit.notes} onChange={e => setCurrentEdit({...currentEdit, notes: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-6">
                <button onClick={() => setIsEditing(false)} className="flex-1 py-5 font-black text-gray-400">취소</button>
                <button onClick={handleAddSchedule} className="flex-1 py-5 bg-black text-white font-black rounded-3xl shadow-xl">배정 확정</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
