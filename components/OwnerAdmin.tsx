
import React, { useState } from 'react';
import { AppData, DailyReport, InventoryItem } from '../types';
import { SHIFT_LABELS } from '../constants';
import { CheckSquare, Package, AlertCircle, ShieldCheck, Cloud, Database, Copy, Check } from 'lucide-react';

interface OwnerAdminProps {
  appData: AppData;
  onUpdate: (key: keyof AppData, updated: any[]) => void;
  onStoreIdUpdate: (id: string) => void;
}

export const OwnerAdmin: React.FC<OwnerAdminProps> = ({ appData, onUpdate, onStoreIdUpdate }) => {
  const [tempStoreId, setTempStoreId] = useState(localStorage.getItem('twosome_store_id') || '');
  const [copied, setCopied] = useState(false);

  const pendingReports = appData.reports.filter(r => !r.isApproved);
  const inventoryAlerts = appData.inventory.filter(i => i.alertEnabled && i.count <= 2);

  const handleExport = () => {
    try {
      const code = btoa(JSON.stringify(appData));
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      alert('데이터 코드가 복사되었습니다!\n이 긴 코드를 엣지(Edge)의 로그인 화면에 있는 [비상용 코드] 버튼에 붙여넣으세요.');
    } catch (e) {
      alert('코드 생성 중 오류가 발생했습니다.');
    }
  };

  const handleStoreIdSave = () => {
    if (!tempStoreId.trim()) return;
    if (confirm(`'${tempStoreId}' 코드로 변경하시겠습니까?`)) {
      onStoreIdUpdate(tempStoreId.trim().toLowerCase());
    }
  };

  const handleApprove = (reportId: string) => {
    const updated = appData.reports.map(r => r.id === reportId ? { ...r, isApproved: true, updatedAt: Date.now() } : r);
    onUpdate('reports', updated);
  };

  return (
    <div className="space-y-8 pb-10">
      <section className="bg-black text-white p-8 rounded-[2.5rem] shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Database className="text-red-500" size={28} />
          <h3 className="text-xl font-black">브라우저 연동 문제 해결 (비상용)</h3>
        </div>
        <p className="text-xs font-bold text-gray-400">엣지나 휴대폰에서 "연결 안됨"이 뜰 경우, 아래 버튼을 눌러 코드를 복사한 뒤 해당 기기의 로그인 화면에서 붙여넣으세요.</p>
        <button 
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 bg-white text-black py-4 rounded-2xl font-black hover:bg-gray-100 transition-all active:scale-95 shadow-xl"
        >
          {copied ? <Check className="text-green-600"/> : <Copy size={18}/>}
          {copied ? '복사 완료!' : '현재 모든 데이터 코드로 복사하기'}
        </button>
      </section>

      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-center gap-3">
          <Cloud className="text-red-600" size={24} />
          <h3 className="text-xl font-black text-gray-900">매장 코드 관리</h3>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-red-500"
            value={tempStoreId}
            onChange={e => setTempStoreId(e.target.value)}
          />
          <button onClick={handleStoreIdSave} className="bg-black text-white px-8 py-4 rounded-2xl font-black active:scale-95 transition-transform shrink-0">변경</button>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
          <div className="bg-red-50 p-5 rounded-3xl text-red-600"><CheckSquare size={32} /></div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase mb-1">미승인 보고</p>
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
