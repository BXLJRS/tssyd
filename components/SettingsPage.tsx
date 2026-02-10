
import React, { useState } from 'react';
import { User } from '../types';
import { Settings, Store, User as UserIcon, Calendar, ArrowRight, Shield, AlertCircle } from 'lucide-react';

interface SettingsPageProps {
  currentUser: User;
  currentStoreId: string;
  onStoreIdUpdate: (id: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser, currentStoreId, onStoreIdUpdate }) => {
  const [tempId, setTempId] = useState(currentStoreId);
  const [isChanged, setIsChanged] = useState(false);

  const handleUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempId(e.target.value);
    setIsChanged(e.target.value !== currentStoreId);
  };

  const handleSave = () => {
    const cleaned = tempId.trim().toLowerCase().replace(/\s/g, '');
    if (cleaned.length < 4) {
      alert('매장 코드는 최소 4자 이상이어야 합니다.');
      return;
    }
    if (confirm(`매장 코드를 '${cleaned}'(으)로 변경하시겠습니까?\n변경 시 앱이 새로고침되며 해당 매장의 데이터와 동기화됩니다.`)) {
      onStoreIdUpdate(cleaned);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Settings className="text-gray-400" size={24} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">설정</h2>
      </div>

      {/* 사용자 프로필 섹션 */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
           <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl ${currentUser.role === 'OWNER' ? 'bg-red-600 text-white' : 'bg-black text-white'}`}>
             {currentUser.nickname[0]}
           </div>
           <div>
             <div className="flex items-center gap-2">
               <h3 className="text-xl font-black text-gray-900">{currentUser.nickname}</h3>
               <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${currentUser.role === 'OWNER' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-100 text-gray-500'}`}>
                 {currentUser.role}
               </span>
             </div>
             <p className="text-sm font-bold text-gray-400">ID: {currentUser.id}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
            <Calendar className="text-gray-400" size={20} />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">근무 시작일</p>
              <p className="text-sm font-black text-gray-700">{currentUser.startDate || '미지정'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
            <Shield className="text-gray-400" size={20} />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">권한 레벨</p>
              <p className="text-sm font-black text-gray-700">{currentUser.role === 'OWNER' ? '전체 관리자' : '일반 직원'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 매장 코드 수정 섹션 */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <Store className="text-red-600" size={24} />
          <h3 className="text-lg font-black text-gray-900">연결된 매장 관리</h3>
        </div>
        
        <p className="text-sm font-bold text-gray-400 leading-relaxed">
          현재 접속 중인 매장의 고유 코드입니다. 다른 기기에서도 동일한 코드를 입력하면 공지사항, 근무표, 재고 등의 데이터를 실시간으로 공유할 수 있습니다.
        </p>

        <div className="space-y-4">
          <div className="relative">
             <input 
               type="text" 
               className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-lg outline-none focus:border-red-500 transition-all uppercase tracking-wider"
               value={tempId}
               onChange={handleUpdate}
               placeholder="매장 코드 입력"
             />
             <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 uppercase">
               Store ID
             </div>
          </div>

          {isChanged && (
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
              <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={18} />
              <p className="text-[11px] font-bold text-orange-700">
                매장 코드를 변경하면 이전 매장의 데이터는 보이지 않으며, 새로운 매장 코드로 동기화가 시작됩니다. 올바른 코드인지 확인해 주세요.
              </p>
            </div>
          )}

          <button 
            disabled={!isChanged}
            onClick={handleSave}
            className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 ${
              isChanged ? 'bg-black text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            코드 변경 및 저장 <ArrowRight size={20} />
          </button>
        </div>
      </section>

      <footer className="text-center">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Twosome Manager Pro v1.2.0</p>
      </footer>
    </div>
  );
};
