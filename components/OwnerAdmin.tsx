
import React, { useState, useEffect } from 'react';
import { DailyReport, InventoryItem } from '../types';
import { SHIFT_LABELS } from '../constants';
import { CheckSquare, Package, AlertCircle, ArrowRight, ShieldCheck, Clock, MessageCircle } from 'lucide-react';

export const OwnerAdmin: React.FC = () => {
  const [pendingReports, setPendingReports] = useState<DailyReport[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const loadAdminData = () => {
      // 승인 대기 중인 업무 보고서 로드
      const reports = JSON.parse(localStorage.getItem('twosome_pending_reports') || '[]');
      setPendingReports(reports.filter((r: DailyReport) => !r.isApproved));

      // 알림이 켜져 있고 수량이 2개 이하인 재고 로드
      const inventory = JSON.parse(localStorage.getItem('twosome_inventory') || '[]');
      setInventoryAlerts(inventory.filter((i: InventoryItem) => i.alertEnabled && i.count <= 2));
    };

    loadAdminData();
    const interval = setInterval(loadAdminData, 3000); // 3초마다 갱신
    return () => clearInterval(interval);
  }, []);

  const handleApprove = (date: string, part: string) => {
    if (!confirm('해당 업무 수행 내용을 승인 처리하시겠습니까?')) return;
    
    const all = JSON.parse(localStorage.getItem('twosome_pending_reports') || '[]');
    const updated = all.map((r: DailyReport) => 
      (r.date === date && r.part === part) ? { ...r, isApproved: true } : r
    );
    localStorage.setItem('twosome_pending_reports', JSON.stringify(updated));
    setPendingReports(updated.filter((r: DailyReport) => !r.isApproved));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* 상단 요약 카드 */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6">
          <div className="bg-red-50 p-5 rounded-3xl text-red-600">
            <CheckSquare size={32} />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest">미승인 보고</p>
            <h3 className="text-3xl font-black text-gray-900">{pendingReports.length}<span className="text-lg ml-1">건</span></h3>
          </div>
        </div>
        <div className="flex-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-6">
          <div className="bg-orange-50 p-5 rounded-3xl text-orange-600">
            <Package size={32} />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest">재고 부족 알림</p>
            <h3 className="text-3xl font-black text-gray-900">{inventoryAlerts.length}<span className="text-lg ml-1">건</span></h3>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* 업무 보고 리스트 */}
        <section className="space-y-6">
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-3 px-2">
            <ShieldCheck className="text-red-600" size={24} /> 파트별 근무 승인
          </h3>
          <div className="space-y-4">
            {pendingReports.map((report, idx) => (
              <div key={`${report.date}-${report.part}`} className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 space-y-4 animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold mb-1">
                      <Clock size={12} /> {report.date} 제출됨
                    </div>
                    <h4 className="text-xl font-black text-gray-900">{SHIFT_LABELS[report.part]}</h4>
                  </div>
                  <button 
                    onClick={() => handleApprove(report.date, report.part)}
                    className="bg-black text-white px-5 py-3 rounded-2xl text-sm font-black hover:bg-gray-800 transition-all active:scale-95 flex items-center gap-2"
                  >
                    승인 <ArrowRight size={16} />
                  </button>
                </div>

                {report.memoToOwner && (
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                    <MessageCircle size={18} className="text-blue-500 mt-1 shrink-0" />
                    <p className="text-sm font-bold text-blue-800 leading-relaxed">"{report.memoToOwner}"</p>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">체크리스트 요약</p>
                  <div className="bg-gray-50 rounded-2xl p-4 max-h-40 overflow-y-auto custom-scrollbar space-y-2">
                    {report.items.map(item => (
                      <div key={item.id} className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.isCompleted ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div className="flex-1">
                          <p className={`text-xs font-bold ${item.isCompleted ? 'text-gray-600' : 'text-red-600'}`}>{item.content}</p>
                          {!item.isCompleted && item.notes && (
                            <p className="text-[10px] text-red-400 font-bold mt-0.5">ㄴ 사유: {item.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {pendingReports.length === 0 && (
              <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-gray-100 text-center text-gray-300 font-bold">
                승인 대기 중인 보고서가 없습니다.
              </div>
            )}
          </div>
        </section>

        {/* 긴급 재고 알림 */}
        <section className="space-y-6">
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-3 px-2">
            <AlertCircle className="text-orange-500 animate-pulse" size={24} /> 긴급 재고 알림
          </h3>
          <div className="space-y-3">
            {inventoryAlerts.map((item, idx) => (
              <div key={item.id} className="bg-white p-6 rounded-[1.5rem] border-2 border-orange-50 flex items-center justify-between group hover:border-orange-500 transition-all animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 text-orange-600 p-3 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <Package size={20} />
                  </div>
                  <div>
                    <h5 className="font-black text-gray-900">{item.name}</h5>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black ${item.count === 0 ? 'text-red-600' : 'text-orange-600'}`}>{item.count}개</span>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">현재 수량</p>
                </div>
              </div>
            ))}
            {inventoryAlerts.length === 0 && (
              <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-gray-100 text-center text-gray-300 font-bold">
                부족한 재고가 없습니다.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
