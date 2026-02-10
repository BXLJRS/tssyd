
import React, { useState, useEffect } from 'react';
import { DailyReport, InventoryItem } from '../types';
import { SHIFT_LABELS } from '../constants';
import { CheckSquare, Package, AlertCircle, ArrowRight, ShieldCheck, Clock, MessageCircle, Cloud, HelpCircle } from 'lucide-react';

interface OwnerAdminProps {
  onStoreIdUpdate: (id: string) => void;
}

export const OwnerAdmin: React.FC<OwnerAdminProps> = ({ onStoreIdUpdate }) => {
  const [pendingReports, setPendingReports] = useState<DailyReport[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryItem[]>([]);
  const [tempStoreId, setTempStoreId] = useState(localStorage.getItem('twosome_store_id') || '');

  useEffect(() => {
    const loadAdminData = () => {
      const reports = JSON.parse(localStorage.getItem('twosome_pending_reports') || '[]');
      setPendingReports(reports.filter((r: DailyReport) => !r.isApproved));
      const inventory = JSON.parse(localStorage.getItem('twosome_inventory') || '[]');
      setInventoryAlerts(inventory.filter((i: InventoryItem) => i.alertEnabled && i.count <= 2));
    };
    loadAdminData();
  }, []);

  const handleStoreIdSave = () => {
    if (!tempStoreId.trim()) {
      alert('매장 코드를 입력해주세요.');
      return;
    }
    if (confirm(`'${tempStoreId}' 코드를 사용하시겠습니까? 다른 기기에서도 같은 코드를 입력하면 데이터가 공유됩니다.`)) {
      onStoreIdUpdate(tempStoreId.trim());
      alert('매장 코드가 설정되었습니다. 잠시 후 동기화가 시작됩니다.');
    }
  };

  const handleApprove = (date: string, part: string) => {
    const all = JSON.parse(localStorage.getItem('twosome_pending_reports') || '[]');
    const updated = all.map((r: DailyReport) => (r.date === date && r.part === part) ? { ...r, isApproved: true } : r);
    localStorage.setItem('twosome_pending_reports', JSON.stringify(updated));
    setPendingReports(updated.filter((r: DailyReport) => !r.isApproved));
  };

  return (
    <div className="space-y-8 pb-10">
      {/* 클라우드 동기화 설정 섹션 */}
      <section className="bg-black text-white p-8 rounded-[2.5rem] shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Cloud className="text-red-500" size={28} />
          <h3 className="text-xl font-black">매장 클라우드 동기화 (기기간 공유)</h3>
        </div>
        <p className="text-gray-400 text-sm font-medium">다른 휴대폰에서도 똑같이 글을 보고 쓰려면, 아래에 **동일한 매장 코드**를 입력하세요.</p>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="예: twosome-seoul-01" 
            className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-red-500"
            value={tempStoreId}
            onChange={e => setTempStoreId(e.target.value)}
          />
          <button onClick={handleStoreIdSave} className="bg-red-600 px-8 py-4 rounded-2xl font-black active:scale-95 transition-transform">설정</button>
        </div>
        <div className="flex items-start gap-2 text-[11px] text-gray-500">
          <HelpCircle size={14} className="mt-0.5 shrink-0" />
          <span>코드를 설정하면 10초마다 자동으로 데이터를 주고받습니다. 점주님 두 분과 직원들 모두 같은 코드를 입력해야 합니다.</span>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="flex-1 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="bg-red-50 p-4 rounded-2xl text-red-600"><CheckSquare size={24} /></div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">미승인 보고</p>
            <h3 className="text-2xl font-black text-gray-900">{pendingReports.length}건</h3>
          </div>
        </div>
        <div className="flex-1 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="bg-orange-50 p-4 rounded-2xl text-orange-600"><Package size={24} /></div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">재고 부족</p>
            <h3 className="text-2xl font-black text-gray-900">{inventoryAlerts.length}건</h3>
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
              <div key={`${report.date}-${report.part}`} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-gray-400 text-[10px] font-bold mb-1">{report.date} 파트 보고</div>
                    <h4 className="text-lg font-black text-gray-900">{SHIFT_LABELS[report.part]}</h4>
                  </div>
                  <button onClick={() => handleApprove(report.date, report.part)} className="bg-black text-white px-4 py-2 rounded-xl text-xs font-black">승인</button>
                </div>
                {report.memoToOwner && <div className="bg-blue-50 p-3 rounded-xl text-xs font-bold text-blue-800 italic">"{report.memoToOwner}"</div>}
              </div>
            ))}
            {pendingReports.length === 0 && <div className="bg-white p-12 rounded-[2rem] border-2 border-dashed border-gray-100 text-center text-gray-300 font-bold">대기 중인 보고가 없습니다.</div>}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-3 px-2">
            <AlertCircle className="text-orange-500 animate-pulse" size={24} /> 재고 알림
          </h3>
          <div className="space-y-3">
            {inventoryAlerts.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-orange-100 flex items-center justify-between">
                <div>
                  <h5 className="font-black text-gray-900 text-sm">{item.name}</h5>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{item.category}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-orange-600">{item.count}개</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
