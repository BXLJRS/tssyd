
import React, { useState } from 'react';
import { DailyReport, User } from '../types';
import { calculateWorkHours, getDayOfWeek } from '../utils';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User as UserIcon, Clock, Plus, X } from 'lucide-react';

interface AttendanceCalendarProps {
  currentUser: User;
  allUsers: User[];
  reports: DailyReport[];
  onUpdate: (updated: DailyReport[]) => void;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ currentUser, allUsers, reports, onUpdate }) => {
  const [viewDate, setViewDate] = useState(new Date());
  
  // 수동 입력 모달 상태
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [manualEntry, setManualEntry] = useState({
    userId: '',
    startTime: '09:30',
    endTime: '17:00',
    hasBreak: true
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();
  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);

  const calendarDays = [];
  for (let i = 0; i < startOffset; i++) calendarDays.push(null);
  for (let i = 1; i <= totalDays; i++) calendarDays.push(i);

  const getReportsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return reports.filter(r => r.date === dateStr);
  };

  const handleDayClick = (day: number) => {
    if (currentUser.role !== 'OWNER') return;
    setSelectedDay(day);
    setIsAddingManual(true);
  };

  const addManualRecord = () => {
    if (!selectedDay || !manualEntry.userId) {
      alert('직원을 선택해주세요.');
      return;
    }

    const targetUser = allUsers.find(u => u.id === manualEntry.userId);
    if (!targetUser) return;

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    
    // Fix: Added missing updatedAt
    const newReport: DailyReport = {
      id: `manual-${Date.now()}`,
      date: dateStr,
      part: 'COMMON', // 수동 입력은 공통 파트로 처리
      items: [],
      memoToOwner: '점주 직접 입력 기록',
      isApproved: true,
      submittedAt: Date.now(),
      authorId: targetUser.id,
      authorNickname: targetUser.nickname,
      actualStartTime: manualEntry.startTime,
      actualEndTime: manualEntry.endTime,
      hasBreak: manualEntry.hasBreak,
      updatedAt: Date.now()
    };

    onUpdate([...reports, newReport]);
    setIsAddingManual(false);
    setManualEntry({ userId: '', startTime: '09:30', endTime: '17:00', hasBreak: true });
    alert('기록이 추가되었습니다.');
  };

  const deleteReport = (id: string) => {
    if (currentUser.role !== 'OWNER') return;
    if (confirm('이 근무 기록을 삭제하시겠습니까?')) {
      onUpdate(reports.filter(r => r.id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-red-600 text-white p-4 rounded-2xl shadow-xl"><CalendarIcon size={28}/></div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">근무표 (확정 기록)</h2>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Store Work Attendance History</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
          <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-3 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ChevronLeft size={20}/></button>
          <span className="font-black text-lg px-2">{year}년 {month + 1}월</span>
          <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-3 hover:bg-white hover:shadow-sm rounded-xl transition-all"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {currentUser.role === 'OWNER' && (
          <div className="mb-4 px-2 py-3 bg-red-50 rounded-2xl flex items-center gap-2 text-red-600">
            <Plus size={16} />
            <span className="text-xs font-black">점주님은 날짜를 클릭하여 과거 근무 기록을 직접 입력할 수 있습니다.</span>
          </div>
        )}
        <div className="grid grid-cols-7 border-b border-gray-50 pb-4 mb-4">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} className={`text-center text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-400'}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-50 border border-gray-50">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="bg-white aspect-square" />;
            
            const dayReports = getReportsForDay(day);
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

            return (
              <div 
                key={day} 
                onClick={() => handleDayClick(day)}
                className={`bg-white min-h-[120px] p-2 flex flex-col gap-1 transition-all relative group ${currentUser.role === 'OWNER' ? 'cursor-pointer hover:bg-red-50/30' : ''} ${isToday ? 'ring-2 ring-red-500 ring-inset z-10' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-black mb-1 ${i % 7 === 0 ? 'text-red-500' : i % 7 === 6 ? 'text-blue-500' : 'text-gray-400'}`}>{day}</span>
                  {currentUser.role === 'OWNER' && <Plus size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
                  {dayReports.map(report => {
                    const hours = report.actualStartTime && report.actualEndTime 
                      ? calculateWorkHours(report.actualStartTime, report.actualEndTime, report.hasBreak || false)
                      : 0;
                    return (
                      <div key={report.id} className="group/item p-1.5 rounded-lg bg-red-50 border border-red-100 flex flex-col gap-0.5 relative">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-gray-800">{report.authorNickname}</span>
                          <span className="text-[8px] font-black text-red-600 bg-white px-1 rounded">{hours}h</span>
                        </div>
                        <div className="text-[8px] text-gray-400 font-medium">
                          {report.actualStartTime}~{report.actualEndTime}
                        </div>
                        {currentUser.role === 'OWNER' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteReport(report.id); }}
                            className="absolute -top-1 -right-1 bg-white text-gray-400 hover:text-red-500 rounded-full shadow-sm p-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 월간 요약 카드 */}
      <div className="bg-black text-white p-8 rounded-[2.5rem] shadow-xl">
        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
          <UserIcon size={16}/> {month + 1}월 근무 요약 (확정 기록 기준)
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from(new Set(reports.filter(r => new Date(r.date).getMonth() === month && new Date(r.date).getFullYear() === year).map(r => r.authorNickname))).map(name => {
            const userReports = reports.filter(r => r.authorNickname === name && new Date(r.date).getMonth() === month && new Date(r.date).getFullYear() === year);
            const totalHours = userReports.reduce((acc, curr) => 
              acc + (curr.actualStartTime && curr.actualEndTime ? calculateWorkHours(curr.actualStartTime, curr.actualEndTime, curr.hasBreak || false) : 0), 0);
            
            return (
              <div key={name} className="flex justify-between items-center p-4 bg-white/10 rounded-2xl border border-white/5">
                <span className="font-black">{name}님</span>
                <span className="font-black text-red-500">{totalHours.toFixed(1)}시간</span>
              </div>
            );
          })}
          {reports.filter(r => new Date(r.date).getMonth() === month && new Date(r.date).getFullYear() === year).length === 0 && (
            <div className="md:col-span-3 text-center text-gray-600 py-4 font-bold">기록된 근무가 없습니다.</div>
          )}
        </div>
      </div>

      {/* 수동 입력 모달 */}
      {isAddingManual && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[70]">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black tracking-tight">{year}년 {month + 1}월 {selectedDay}일 기록</h3>
              <button onClick={() => setIsAddingManual(false)} className="p-2 bg-gray-100 rounded-full"><X size={18}/></button>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">근무자 선택</label>
                <select 
                  className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none" 
                  value={manualEntry.userId} 
                  onChange={e => setManualEntry({...manualEntry, userId: e.target.value})}
                >
                  <option value="">근무자 선택</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.nickname} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 ml-1 uppercase">시작 시간</label>
                  <input type="time" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={manualEntry.startTime} onChange={e => setManualEntry({...manualEntry, startTime: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 ml-1 uppercase">종료 시간</label>
                  <input type="time" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={manualEntry.endTime} onChange={e => setManualEntry({...manualEntry, endTime: e.target.value})} />
                </div>
              </div>
              <button 
                onClick={() => setManualEntry({...manualEntry, hasBreak: !manualEntry.hasBreak})}
                className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${manualEntry.hasBreak ? 'bg-red-50 border-red-100 text-red-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
              >
                <span className="font-bold text-sm">30분 휴게 적용</span>
                <Clock size={18} />
              </button>
              <button onClick={addManualRecord} className="w-full py-5 bg-black text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all mt-4">기록 저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
