
import React, { useState, useEffect } from 'react';
import { DailyReport, User } from '../types';
import { calculateWorkHours, getDayOfWeek } from '../utils';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User as UserIcon, Clock } from 'lucide-react';

interface AttendanceCalendarProps {
  currentUser: User;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ currentUser }) => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    const saved = localStorage.getItem('twosome_reports');
    if (saved) setReports(JSON.parse(saved));
  }, []);

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
              <div key={day} className={`bg-white min-h-[120px] p-2 flex flex-col gap-1 transition-all hover:bg-gray-50/50 relative ${isToday ? 'ring-2 ring-red-500 ring-inset z-10' : ''}`}>
                <span className={`text-sm font-black mb-1 ${i % 7 === 0 ? 'text-red-500' : i % 7 === 6 ? 'text-blue-500' : 'text-gray-400'}`}>{day}</span>
                <div className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
                  {dayReports.map(report => {
                    const hours = report.actualStartTime && report.actualEndTime 
                      ? calculateWorkHours(report.actualStartTime, report.actualEndTime, report.hasBreak || false)
                      : 0;
                    return (
                      <div key={report.id} className="p-1.5 rounded-lg bg-red-50 border border-red-100 flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-gray-800">{report.authorNickname}</span>
                          <span className="text-[8px] font-black text-red-600 bg-white px-1 rounded">{hours}h</span>
                        </div>
                        <div className="text-[8px] text-gray-400 font-medium">
                          {report.actualStartTime}~{report.actualEndTime}
                        </div>
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
          <UserIcon size={16}/> {month + 1}월 근무 요약
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from(new Set(reports.filter(r => new Date(r.date).getMonth() === month).map(r => r.authorNickname))).map(name => {
            const userReports = reports.filter(r => r.authorNickname === name && new Date(r.date).getMonth() === month);
            const totalHours = userReports.reduce((acc, curr) => 
              acc + (curr.actualStartTime && curr.actualEndTime ? calculateWorkHours(curr.actualStartTime, curr.actualEndTime, curr.hasBreak || false) : 0), 0);
            
            return (
              <div key={name} className="flex justify-between items-center p-4 bg-white/10 rounded-2xl border border-white/5">
                <span className="font-black">{name}님</span>
                <span className="font-black text-red-500">{totalHours.toFixed(1)}시간</span>
              </div>
            );
          })}
          {reports.filter(r => new Date(r.date).getMonth() === month).length === 0 && (
            <div className="md:col-span-3 text-center text-gray-600 py-4 font-bold">이번 달 기록된 근무가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
};
