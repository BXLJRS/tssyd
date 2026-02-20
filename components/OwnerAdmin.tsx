
import React, { useState } from 'react';
import { AppData, DailyReport, InventoryItem } from '../types';
import { SHIFT_LABELS } from '../constants';
import { CheckSquare, Package, AlertCircle, ShieldCheck, Cloud, Database, Copy, Check, UploadCloud } from 'lucide-react';

interface OwnerAdminProps {
  appData: AppData;
  onUpdate: (key: keyof AppData, updated: any[]) => void;
  onStoreIdUpdate: (id: string) => void;
  onForceUpload: () => void; // 강제 업로드 함수 추가
}

export const OwnerAdmin: React.FC<OwnerAdminProps> = ({ appData, onUpdate, onStoreIdUpdate, onForceUpload }) => {
  const [copied, setCopied] = useState(false);

  const pendingReports = appData.reports.filter(r => !r.isApproved);
  const inventoryAlerts = appData.inventory.filter(i => i.alertEnabled && i.count <= 2);

  const handleApprove = (reportId: string) => {
    const updated = appData.reports.map(r => r.id === reportId ? { ...r, isApproved: true, updatedAt: Date.now() } : r);
    onUpdate('reports', updated);
  };

  return (
    <div className="space-y-8 pb-10">
      <section className="bg-red-600 text-white p-8 rounded-[2.5rem] shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <UploadCloud size={28} />
          <h3 className="text-xl font-black">전체 데이터 동기화 강제 최적화</h3>
        </div>
        <p className="text-xs font-bold text-red-100">현재 내 기기의 데이터가 가장 정확하다면, 아래 버튼을 눌러 모든 기기의 데이터를 내 데이터로 강제 통일합니다. 실시간 연동이 지연될 때 최후의 수단으로 사용하세요.</p>
        <button 
          onClick={() => { if(confirm('내 기기의 데이터로 전체 시스템을 동기화할까요?\n(다른 기기의 미저장 데이터가 덮어씌워질 수 있습니다)')) onForceUpload(); }}
          className="w-full flex items-center justify-center gap-2 bg-white text-red-600 py-4 rounded-2xl font-black hover:bg-gray-100 active:scale-95 shadow-xl transition-all"
        >
          마스터 데이터 강제 동기화 (Force Sync All)
        </button>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
          <div className="bg-red-50 p-5 rounded-3xl text-red-600"><CheckSquare size={32} /></div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase mb-1">승인 대기</p>
            <h3 className="text-3xl font-black text-gray-900">{pendingReports.length}건</h3>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
          <div className="bg-orange-50 p-5 rounded-3xl text-orange-600"><Package size={32} /></div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase mb-1">재고 부족</p>
            <h3 className="text-3xl font-black text-gray-900">{inventoryAlerts.length}건</h3>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section className="space-y-6">
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-3 px-2">
            <ShieldCheck className="text-red-600" size={24} /> 근무 승인 대기
          </h3>
          <div className="space-y-4">
            {pendingReports.map(report => (
              <div key={report.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-gray-400 text-[10px] font-bold mb-1">{report.date}</div>
                    <h4 className="text-lg font-black text-gray-900">{SHIFT_LABELS[report.part]}</h4>
                    <p className="text-xs font-bold text-red-600 mt-1">{report.authorNickname}님</p>
                  </div>
                  <button onClick={() => handleApprove(report.id)} className="bg-black text-white px-6 py-3 rounded-2xl text-xs font-black">승인</button>
                </div>
              </div>
            ))}
            {pendingReports.length === 0 && <div className="bg-white p-12 rounded-[2.5rem] text-center text-gray-300 font-bold">대기 중인 보고가 없습니다.</div>}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-3 px-2">
            <AlertCircle className="text-orange-500" size={24} /> 재고 부족
          </h3>
          <div className="grid gap-3">
            {inventoryAlerts.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-[2rem] border-2 border-orange-50 flex items-center justify-between">
                <div>
                  <h5 className="font-black text-gray-900">{item.name}</h5>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{item.category}</p>
                </div>
                <span className="text-2xl font-black text-orange-600">{item.count}개</span>
              </div>
            ))}
            {inventoryAlerts.length === 0 && <div className="bg-white p-12 rounded-[2.5rem] text-center text-gray-300 font-bold">부족한 재고가 없습니다.</div>}
          </div>
        </section>
      </div>
    </div>
  );
};
