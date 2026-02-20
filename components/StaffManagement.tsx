
import React from 'react';
import { User } from '../types';
import { Users, UserMinus, Shield, User as UserIcon, Calendar } from 'lucide-react';

interface StaffManagementProps {
  currentUser: User;
  allUsers: User[];
  onUpdate: (updated: User[]) => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ currentUser, allUsers, onUpdate }) => {
  const handleDelete = (id: string, name: string) => {
    if (id === currentUser.id) {
      alert('자기 자신은 삭제할 수 없습니다.');
      return;
    }
    if (window.confirm(`[${name}] 직원을 명부에서 삭제하시겠습니까?\n삭제 후 해당 직원은 로그인이 불가능합니다.`)) {
      onUpdate(allUsers.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-2"><Users className="text-red-600" /> 직원 명부</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Staff Directory</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allUsers.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group transition-all hover:border-red-100">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${user.role === 'OWNER' ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'}`}>
                {user.role === 'OWNER' ? <Shield size={24} /> : <UserIcon size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-gray-900">{user.nickname}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${user.role === 'OWNER' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {user.role}
                  </span>
                </div>
                <div className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-1">
                  ID: {user.id}
                </div>
              </div>
            </div>
            {currentUser.role === 'OWNER' && user.id !== currentUser.id && (
              <button 
                onClick={() => handleDelete(user.id, user.nickname)}
                className="p-3 text-gray-200 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
              >
                <UserMinus size={20} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4">
        <Calendar className="text-blue-600 shrink-0" size={24} />
        <p className="text-sm font-bold text-blue-800 leading-relaxed">
          새로운 직원은 로그인 화면의 [계정 등록] 메뉴를 통해 스스로 가입할 수 있습니다. 
          점주님은 가입된 직원이 실제 우리 직원이 맞는지 여기서 확인하고 관리해 주세요.
        </p>
      </div>
    </div>
  );
};
