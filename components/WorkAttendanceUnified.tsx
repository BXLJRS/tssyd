
import React, { useState, useEffect } from 'react';
import { User, WorkSchedule, DailyReport } from '../types';
import { calculateWorkHours, getTodayDateString, getDayOfWeek } from '../utils';
import { 
  Calendar as CalendarIcon, Users, Clock, Plus, X, 
  ChevronLeft, ChevronRight, CheckCircle, Info, Star, Trash2
} from 'lucide-react';

interface WorkAttendanceUnifiedProps {
  currentUser: User;
  allUsers: User[];
  externalSchedules?: WorkSchedule[];
  externalReports?: DailyReport[];
  onUpdate?: () => void;
}

export const WorkAttendanceUnified: React.FC<WorkAttendanceUnifiedProps> = ({ 
  currentUser, allUsers, externalSchedules = [], externalReports = [], onUpdate 
}) => {
  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'STAFF'>('CALENDAR');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [viewDate, setViewDate] = useState(new Date());
  
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [isAddingActual, setIsAddingActual] = useState(false);
  
  const [planFormData, setPlanFormData] = useState<Partial<WorkSchedule>>({
    startTime: '09:30', endTime: '17:00', hasBreak: true, notes: ''
  });
  const [actualFormData, setActualFormData] = useState({
    userId: '', startTime: '09:30', endTime: '17:00', hasBreak: true
  });

  // 달력 계산
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();
  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);
  const calendarDays = [];
  for (let i = 0; i < startOffset; i++) calendarDays.push(null);
  for (let i = 1; i <= totalDays; i++) calendarDays.push(i);

  const getDayData = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      plans: externalSchedules.filter(s => s.date === dateStr),
      actuals: externalReports.filter(r => r.date === dateStr)
    };
  };

  const handleAddPlan = () => {
    if (!planFormData.userId) return alert('직원을 선택하세요.');
    const targetUser = allUsers.find(u => u.id === planFormData.userId);
    const newPlan: WorkSchedule = {
      id: Date.now().toString(),
      userId: targetUser!.id,
      userName: targetUser!.nickname,
      date: selectedDate,
      startTime: planFormData.startTime!,
      endTime: planFormData.endTime!,
      hasBreak: !!planFormData.hasBreak,
      notes: planFormData.notes,
      updatedAt: Date.now()
    };
    const updated = [...externalSchedules, newPlan];
    localStorage.setItem('twosome_schedules', JSON.stringify(updated));
    onUpdate?.();
    setIsAddingPlan(false);
  };

  const handleAddActual = () => {
    if (!actualFormData.userId) return alert('직원을 선택하세요.');
    const targetUser = allUsers.find(u => u.id === actualFormData.userId);
    const newReport: DailyReport = {
      id: `manual-${Date.now()}`,
      date: selectedDate,
      part: 'COMMON',
      items: [],
      memoToOwner: '점주 직접 입력 기록',
      isApproved: true,
      submittedAt: Date.now(),
      authorId: targetUser!.id,
      authorNickname: targetUser!.nickname,
      actualStartTime: actualFormData.startTime,
      actualEndTime: actualFormData.endTime,
      hasBreak: actualFormData.hasBreak,
      updatedAt: Date.now()
    };
    const updated = [...externalReports, newReport];
    localStorage.setItem('twosome_reports', JSON.stringify(updated));
    onUpdate?.();
    setIsAddingActual(false);
  };

  const deletePlan = (id: string) => {
    if (confirm('이 배정 계획을 삭제할까요?')) {
      const updated = externalSchedules.filter(s => s.id !== id);
      localStorage.setItem('twosome_schedules', JSON.stringify(updated));
      onUpdate?.();
    }
  };

  const deleteActual = (id: string) => {
    if (confirm('이 근무 기록을 삭제할까요?')) {
      const updated = externalReports.filter(r => r.id !== id);
      localStorage.setItem('twosome_reports', JSON.stringify(updated));
      onUpdate?.();
    }
  };

  const dayData = getDayData(parseInt(selectedDate.split('-')[2]));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* 상단 통합 탭 */}
      <div className="flex bg-white p-1.5 rounded-[2rem] shadow-sm border border-gray-100">
        <button 
          onClick={() => setActiveTab('CALENDAR')}
          className={`flex-1 py-4 rounded-[1.5rem] font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'CALENDAR' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
        >
          <CalendarIcon size={20}/> 근무 달력
        </button>
        <button 
          onClick={() => setActiveTab('STAFF')}
          className={`flex-1 py-4 rounded-[1.5rem] font-black flex items-center justify-center gap-2 transition-all ${activeTab === 'STAFF' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
        >
          <Users size={20}/> 직원 명단
        </button>
      </div>

      {activeTab === 'CALENDAR' ? (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* 달력 섹션 */}
          <div className="lg:col-span-7 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="text-xl font-black text-gray-900">{year}년 {month + 1}월</h3>
              <div className="flex gap-2">
                <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-3 bg-gray-50 rounded-xl"><ChevronLeft size={18}/></button>
                <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-3 bg-gray-50 rounded-xl"><ChevronRight size={18}/></button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 text-center mb-4">
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <span key={d} className={`text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-red-500' : 'text-gray-400'}`}>{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = dateStr === selectedDate;
                const { plans, actuals } = getDayData(day);
                
                return (
                  <button 
                    key={day} 
                    onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all relative ${isSelected ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    <span className="text-sm font-black">{day}</span>
                    <div className="flex gap-1 mt-1">
                      {plans.length > 0 && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/40' : 'bg-gray-300'}`} />}
                      {actuals.length > 0 && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-red-400' : 'bg-red-500'}`} />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-[10px] font-black text-gray-400">
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-gray-200 rounded-full" /> 배정 계획 있음</div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-red-500 rounded-full" /> 근무 기록 있음</div>
            </div>
          </div>

          {/* 상세 정보 섹션 */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-black text-gray-900">{selectedDate} 상세</h4>
                {currentUser.role === 'OWNER' && (
                  <div className="flex gap-2">
                    <button onClick={() => setIsAddingPlan(true)} className="p-2 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-black">배정 추가</button>
                    <button onClick={() => setIsAddingActual(true)} className="p-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-black">기록 추가</button>
                  </div>
                )}
              </div>

              {/* 배정 계획 (Plans) */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2">
                  <Clock size={12}/> 근무 배정 (계획)
                </p>
                {dayData.plans.map(s => (
                  <div key={s.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center border border-gray-100 group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs font-black text-gray-300">{s.userName[0]}</div>
                      <div>
                        <div className="text-sm font-black text-gray-800">{s.userName}</div>
                        <div className="text-[10px] font-bold text-gray-400">{s.startTime} ~ {s.endTime}</div>
                      </div>
                    </div>
                    {currentUser.role === 'OWNER' && <button onClick={() => deletePlan(s.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>}
                  </div>
                ))}
                {dayData.plans.length === 0 && <p className="text-center py-4 text-xs font-bold text-gray-300">배정된 계획이 없습니다.</p>}
              </div>

              <div className="h-px bg-gray-100" />

              {/* 실제 기록 (Actuals) */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-red-500 uppercase flex items-center gap-2">
                  <CheckCircle size={12}/> 근무 기록 (확정)
                </p>
                {dayData.actuals.map(r => (
                  <div key={r.id} className="p-4 bg-red-50/30 rounded-2xl flex justify-between items-center border border-red-100 group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-xs font-black text-white">{r.authorNickname[0]}</div>
                      <div>
                        <div className="text-sm font-black text-gray-900">{r.authorNickname}</div>
                        <div className="text-[10px] font-bold text-red-600">{r.actualStartTime} ~ {r.actualEndTime} ({calculateWorkHours(r.actualStartTime!, r.actualEndTime!, r.hasBreak || false)}h)</div>
                      </div>
                    </div>
                    {currentUser.role === 'OWNER' && <button onClick={() => deleteActual(r.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-200 hover:text-red-600"><Trash2 size={16}/></button>}
                  </div>
                ))}
                {dayData.actuals.length === 0 && <p className="text-center py-4 text-xs font-bold text-gray-300">승인된 기록이 없습니다.</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 직원 명단 섹션 */
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 bg-gray-50 border-b flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">전체 직원 목록</h3>
              <p className="text-xs font-bold text-gray-400">현재 등록된 모든 매장 인원 ({allUsers.length}명)</p>
            </div>
            <Users className="text-gray-200" size={32} />
          </div>
          <div className="divide-y divide-gray-50">
            {allUsers.map(u => (
              <div key={u.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${u.role === 'OWNER' ? 'bg-red-600 text-white' : 'bg-white border-2 border-gray-100 text-gray-300'}`}>
                    {u.nickname[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-gray-900">{u.nickname}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${u.role === 'OWNER' ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {u.role === 'OWNER' ? '점주' : '직원'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-400">ID: {u.id}</div>
                  </div>
                </div>
                <div className="text-right">
                   <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Store Member</div>
                   <div className="text-xs font-bold text-gray-400">가입일: {new Date(u.updatedAt || 0).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 모달: 배정 추가 */}
      {isAddingPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[70]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-black">{selectedDate} 배정</h3>
               <button onClick={() => setIsAddingPlan(false)} className="p-2 bg-gray-100 rounded-full"><X size={18}/></button>
            </div>
            <div className="space-y-4">
              <select className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={planFormData.userId} onChange={e => setPlanFormData({...planFormData, userId: e.target.value})}>
                <option value="">직원 선택</option>
                {allUsers.map(u => <option key={u.id} value={u.id}>{u.nickname}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="time" className="p-4 bg-gray-50 border rounded-2xl font-bold" value={planFormData.startTime} onChange={e => setPlanFormData({...planFormData, startTime: e.target.value})} />
                <input type="time" className="p-4 bg-gray-50 border rounded-2xl font-bold" value={planFormData.endTime} onChange={e => setPlanFormData({...planFormData, endTime: e.target.value})} />
              </div>
              <input type="text" placeholder="메모 (선택)" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={planFormData.notes} onChange={e => setPlanFormData({...planFormData, notes: e.target.value})} />
              <button onClick={handleAddPlan} className="w-full py-5 bg-black text-white font-black rounded-2xl shadow-xl">배정 확정</button>
            </div>
          </div>
        </div>
      )}

      {/* 모달: 기록 추가 */}
      {isAddingActual && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[70]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in">
            <div className="flex justify-between items-center mb-6 text-red-600">
               <h3 className="text-xl font-black">{selectedDate} 기록 수동 입력</h3>
               <button onClick={() => setIsAddingActual(false)} className="p-2 bg-red-50 rounded-full"><X size={18}/></button>
            </div>
            <div className="space-y-4">
              <select className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={actualFormData.userId} onChange={e => setActualFormData({...actualFormData, userId: e.target.value})}>
                <option value="">근무자 선택</option>
                {allUsers.map(u => <option key={u.id} value={u.id}>{u.nickname}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="time" className="p-4 bg-gray-50 border rounded-2xl font-bold" value={actualFormData.startTime} onChange={e => setActualFormData({...actualFormData, startTime: e.target.value})} />
                <input type="time" className="p-4 bg-gray-50 border rounded-2xl font-bold" value={actualFormData.endTime} onChange={e => setActualFormData({...actualFormData, endTime: e.target.value})} />
              </div>
              <button onClick={handleAddActual} className="w-full py-5 bg-red-600 text-white font-black rounded-2xl shadow-xl">기록 저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
