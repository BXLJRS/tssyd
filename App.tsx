
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { User, UserRole, AppData, FixedSchedule } from './types';
import { NoticeBoard } from './components/NoticeBoard';
import { HandoverBoard } from './components/HandoverBoard';
import { ChecklistBoard } from './components/ChecklistBoard';
import { WorkAttendanceUnified } from './components/WorkAttendanceUnified';
import { InventoryManagement } from './components/InventoryManagement';
import { ReservationManagement } from './components/ReservationManagement';
import { RecipeManual } from './components/RecipeManual';
import { OwnerAdmin } from './components/OwnerAdmin';
import { SettingsPage } from './components/SettingsPage';
import { 
  LogOut, Menu, X, Megaphone, ClipboardList, CheckSquare, 
  Package, BookOpen, Home, Cloud, CloudOff, RefreshCw, Settings, Store, Book, Users, Calendar, ShieldCheck
} from 'lucide-react';

const INITIAL_APP_DATA: AppData = {
  users: [],
  notices: [],
  handovers: [],
  inventory: [],
  reservations: [],
  schedules: [],
  reports: [],
  tasks: [],
  template: [],
  recipes: [],
  fixedSchedules: []
};

const DATA_KEYS: Record<keyof AppData, string> = {
  users: 'twosome_users',
  notices: 'twosome_notices',
  handovers: 'twosome_handovers',
  inventory: 'twosome_inventory',
  reservations: 'twosome_reservations',
  schedules: 'twosome_schedules',
  reports: 'twosome_reports',
  tasks: 'twosome_tasks',
  template: 'twosome_tasks_template',
  recipes: 'twosome_recipes',
  fixedSchedules: 'twosome_fixed_schedules'
};

const Navigation: React.FC<{ 
  user: User, 
  storeId: string, 
  syncStatus: 'connected' | 'offline' | 'syncing', 
  onLogout: () => void,
  onManualSync: () => void
}> = ({ user, storeId, syncStatus, onLogout, onManualSync }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/notice', label: '공지', icon: Megaphone },
    { path: '/handover', label: '인계', icon: ClipboardList },
    { path: '/checklist', label: '업무', icon: CheckSquare },
    { path: '/work-staff', label: '근무/직원', icon: Users },
    { path: '/inventory', label: '재고', icon: Package },
    { path: '/reservation', label: '예약', icon: Book },
    { path: '/recipe', label: '레시피', icon: BookOpen },
    { path: '/settings', label: '설정', icon: Settings },
  ];

  if (user.role === 'OWNER') {
    navItems.splice(7, 0, { path: '/admin', label: '관리자', icon: ShieldCheck });
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-gray-50 rounded-xl md:hidden">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2 font-black text-xl tracking-tighter cursor-pointer">
            <Store className="text-red-600" size={24} />
            <span className="hidden sm:inline text-gray-900">TWOSOME</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-black transition-all ${
                location.pathname === item.path 
                ? 'text-red-600 bg-red-50' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onManualSync}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 hover:bg-gray-100 transition-colors"
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw size={12} className="text-blue-500 animate-spin" />
            ) : syncStatus === 'connected' ? (
              <Cloud size={12} className="text-green-500" />
            ) : (
              <CloudOff size={12} className="text-gray-400" />
            )}
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{storeId}</span>
          </button>
          <div className="hidden sm:flex items-center gap-2">
             <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded uppercase">{user.role}</span>
             <span className="text-sm font-bold text-gray-700">{user.nickname}</span>
          </div>
          <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-600 transition-colors ml-2">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-64 bg-white shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-2 font-black text-xl">
                <Store className="text-red-600" /> TWOSOME
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-xl"><X size={20}/></button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map(item => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-4 rounded-2xl font-black transition-all ${location.pathname === item.path ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around p-2 z-50 md:hidden pb-safe">
         {navItems.slice(0, 4).map(item => (
           <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 p-2 transition-all ${location.pathname === item.path ? 'text-red-600' : 'text-gray-300'}`}>
             <item.icon size={20} />
             <span className="text-[10px] font-black">{item.label}</span>
           </Link>
         ))}
         <button onClick={onManualSync} className={`flex flex-col items-center gap-1 p-2 ${syncStatus === 'syncing' ? 'text-blue-500' : 'text-gray-300'}`}>
            <RefreshCw size={20} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
            <span className="text-[10px] font-black">동기화</span>
         </button>
         <Link to="/settings" className={`flex flex-col items-center gap-1 p-2 transition-all ${location.pathname === '/settings' ? 'text-red-600' : 'text-gray-300'}`}>
             <Settings size={20} />
             <span className="text-[10px] font-black">설정</span>
         </Link>
      </div>
    </>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [storeId, setStoreId] = useState(localStorage.getItem('twosome_store_id') || '');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'syncing'>('offline');
  const [appData, setAppData] = useState<AppData>(INITIAL_APP_DATA);
  const [tempInputId, setTempInputId] = useState('');
  const isSyncing = useRef(false);
  const hasFirstSyncFinished = useRef(false);

  // 로컬 데이터 로드
  const loadLocalData = useCallback(() => {
    const localData: any = { ...INITIAL_APP_DATA };
    (Object.keys(DATA_KEYS) as (keyof AppData)[]).forEach(key => {
      const saved = localStorage.getItem(DATA_KEYS[key]);
      if (saved) {
        try { localData[key] = JSON.parse(saved); } catch (e) { localData[key] = []; }
      }
    });
    setAppData(localData);
  }, []);

  useEffect(() => {
    const savedSession = localStorage.getItem('twosome_session');
    if (savedSession) {
      try { setCurrentUser(JSON.parse(savedSession)); } catch (e) { localStorage.removeItem('twosome_session'); }
    }
    loadLocalData();
  }, [loadLocalData]);

  // 병합 로직 (타임스탬프 기준)
  const mergeItems = (local: any[], cloud: any[]) => {
    if (!Array.isArray(cloud)) cloud = [];
    if (!Array.isArray(local)) local = [];
    
    // 로컬이 비어있으면 서버 데이터를 100% 신뢰 (신규 기기)
    if (local.length === 0 && cloud.length > 0) return cloud;

    const map = new Map();
    // 서버 데이터를 먼저 넣음
    cloud.forEach(item => { if (item?.id) map.set(item.id, item); });
    // 로컬 데이터를 순회하며 더 최신이거나 서버에 없는 것만 업데이트
    local.forEach(item => {
      if (!item?.id) return;
      const existing = map.get(item.id);
      if (!existing || (item.updatedAt || 0) > (existing.updatedAt || 0)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  };

  // 클라우드 동기화 핵심 함수
  const syncWithCloud = useCallback(async (forcePush = false) => {
    if (!storeId || isSyncing.current) return;
    
    // 잘못된 스토어 ID(예: "1") 감지 시 리셋
    if (storeId.length < 4) {
      localStorage.removeItem('twosome_store_id');
      setStoreId('');
      return;
    }

    isSyncing.current = true;
    setSyncStatus('syncing');

    try {
      // 1. 서버 데이터 GET
      const res = await fetch(`https://kvdb.io/ANvV448oU6Q4H6H3N7j2y2/${storeId}`);
      let cloudData: Partial<AppData> = {};
      
      if (res.ok) {
        const text = await res.text();
        if (text) cloudData = JSON.parse(text);
      }

      // 2. 현재 로컬 데이터 읽기
      const localData: any = {};
      (Object.keys(DATA_KEYS) as (keyof AppData)[]).forEach(key => {
        try {
          localData[key] = JSON.parse(localStorage.getItem(DATA_KEYS[key]) || '[]');
        } catch (e) { localData[key] = []; }
      });

      // 3. 병합
      const mergedData: any = {};
      let hasChangesToLocal = false;
      let hasChangesToServer = false;

      (Object.keys(DATA_KEYS) as (keyof AppData)[]).forEach(key => {
        const cloudItems = cloudData[key] || [];
        const localItems = localData[key] || [];
        const merged = mergeItems(localItems, cloudItems);

        // 로컬에 내 계정 추가 (서버에 나를 등록)
        let finalMerged = merged;
        if (key === 'users' && currentUser) {
          if (!merged.find((u: any) => u.id === currentUser.id)) {
            finalMerged = [...merged, currentUser];
            hasChangesToServer = true;
          }
        }

        if (JSON.stringify(localItems) !== JSON.stringify(finalMerged)) {
          hasChangesToLocal = true;
        }
        if (JSON.stringify(cloudItems) !== JSON.stringify(finalMerged)) {
          hasChangesToServer = true;
        }

        mergedData[key] = finalMerged;
        localStorage.setItem(DATA_KEYS[key], JSON.stringify(finalMerged));
      });

      // 4. 상태 업데이트
      setAppData(mergedData);
      hasFirstSyncFinished.current = true;

      // 5. 서버에 POST (변경사항이 있거나 강제 푸시일 때만)
      if (hasChangesToServer || forcePush) {
        await fetch(`https://kvdb.io/ANvV448oU6Q4H6H3N7j2y2/${storeId}`, {
          method: 'POST',
          body: JSON.stringify(mergedData),
        });
      }
      
      setSyncStatus('connected');
    } catch (e) {
      console.error("Sync Error:", e);
      setSyncStatus('offline');
    } finally {
      isSyncing.current = false;
    }
  }, [storeId, currentUser]);

  // 주기적 동기화
  useEffect(() => {
    if (storeId) {
      syncWithCloud();
      const interval = setInterval(() => syncWithCloud(), 10000); // 10초 주기
      return () => clearInterval(interval);
    }
  }, [storeId, syncWithCloud]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('twosome_session', JSON.stringify(user));
    // 로그인 즉시 동기화하여 내 정보를 서버에 등록
    setTimeout(() => syncWithCloud(true), 500);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('twosome_session');
  };

  const handleConnectStore = () => {
    const cleanedId = tempInputId.trim().toLowerCase().replace(/\s/g, '');
    if (cleanedId.length > 3) {
      // 새로운 매장 연결 시 기존 데이터 삭제 후 새로 받기
      Object.values(DATA_KEYS).forEach(k => localStorage.removeItem(k));
      localStorage.setItem('twosome_store_id', cleanedId);
      setStoreId(cleanedId);
      window.location.reload();
    } else {
      alert('매장 코드를 4자 이상 입력해주세요.');
    }
  };

  const handleStoreIdUpdate = (newId: string) => {
    Object.values(DATA_KEYS).forEach(key => localStorage.removeItem(key));
    if (currentUser) localStorage.setItem('twosome_users', JSON.stringify([currentUser]));
    localStorage.setItem('twosome_store_id', newId);
    setStoreId(newId);
    window.location.reload();
  };

  // 렌더링 로직
  if (!storeId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-red-600 rounded-3xl text-white shadow-xl"><Store size={40} /></div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">매장 연결</h1>
            <p className="text-gray-500 font-bold text-sm leading-relaxed">매장 점주님께 전달받은 고유 코드를 입력하세요.<br/>(예: 1903384)</p>
          </div>
          <input 
            type="text" 
            placeholder="매장 코드를 입력하세요" 
            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-red-500 font-black text-center text-lg uppercase"
            value={tempInputId}
            onChange={e => setTempInputId(e.target.value)}
          />
          <button onClick={handleConnectStore} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform">매장 연결하기</button>
        </div>
      </div>
    );
  }

  // 로그인 전이라도 유저 목록은 서버에서 가져와야 함
  if (!currentUser) return <LoginPage onLogin={handleLogin} onUpdate={() => syncWithCloud(true)} />;

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navigation 
          user={currentUser} 
          storeId={storeId} 
          syncStatus={syncStatus} 
          onLogout={handleLogout} 
          onManualSync={() => syncWithCloud(true)} 
        />
        <main className="flex-1 pt-16 pb-20 px-4 max-w-6xl mx-auto w-full">
          {syncStatus === 'offline' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[10px] font-black flex items-center gap-2">
              <CloudOff size={14}/> 오프라인 상태입니다. 데이터 전송이 지연될 수 있습니다.
            </div>
          )}
          {!hasFirstSyncFinished.current && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl text-center">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
              <p className="text-xs font-black">서버에서 최신 데이터를 불러오는 중입니다...</p>
            </div>
          )}
          <Routes>
            <Route path="/notice" element={<NoticeBoard currentUser={currentUser} externalData={appData.notices} onUpdate={() => syncWithCloud(true)} />} />
            <Route path="/handover" element={<HandoverBoard currentUser={currentUser} externalData={appData.handovers} onUpdate={() => syncWithCloud(true)} />} />
            <Route path="/checklist" element={<ChecklistBoard currentUser={currentUser} externalData={appData.tasks} onUpdate={() => syncWithCloud(true)} />} />
            <Route path="/work-staff" element={<WorkAttendanceUnified currentUser={currentUser} allUsers={appData.users} externalSchedules={appData.schedules} externalReports={appData.reports} externalFixedSchedules={appData.fixedSchedules} onUpdate={() => syncWithCloud(true)} onDeleteUser={(id) => {
              const updatedUsers = appData.users.filter(u => u.id !== id);
              localStorage.setItem('twosome_users', JSON.stringify(updatedUsers));
              syncWithCloud(true);
            }} />} />
            <Route path="/inventory" element={<InventoryManagement currentUser={currentUser} externalData={appData.inventory} onUpdate={() => syncWithCloud(true)} />} />
            <Route path="/reservation" element={<ReservationManagement currentUser={currentUser} externalData={appData.reservations} onUpdate={() => syncWithCloud(true)} />} />
            <Route path="/recipe" element={<RecipeManual currentUser={currentUser} externalData={appData.recipes} onUpdate={() => syncWithCloud(true)} />} />
            <Route path="/settings" element={<SettingsPage currentUser={currentUser} currentStoreId={storeId} onStoreIdUpdate={handleStoreIdUpdate} />} />
            {currentUser.role === 'OWNER' && <Route path="/admin" element={<OwnerAdmin externalReports={appData.reports} externalInventory={appData.inventory} onStoreIdUpdate={handleStoreIdUpdate} />} />}
            <Route path="*" element={<Navigate to="/notice" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

const LoginPage: React.FC<{ onLogin: (user: User) => void, onUpdate: () => void }> = ({ onLogin, onUpdate }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAuth = async () => {
    if (id.length < 4 || pw.length !== 4) {
      alert('아이디 4자 이상, 비밀번호 숫자 4자리여야 합니다.');
      return;
    }
    const users = JSON.parse(localStorage.getItem('twosome_users') || '[]');
    if (isSignUp) {
      if (role === 'OWNER') {
        const allowedOwnerIds = ['kms3191', 'ksk545'];
        if (!allowedOwnerIds.includes(id)) {
          alert('승인된 점주 아이디가 아닙니다.');
          return;
        }
      }
      if (users.find((u: User) => u.id === id)) {
        alert('이미 존재하는 아이디입니다.');
        return;
      }
      const newUser: User = { id, passwordHash: pw, nickname, role, updatedAt: Date.now(), startDate };
      const updatedUsers = [...users, newUser];
      localStorage.setItem('twosome_users', JSON.stringify(updatedUsers));
      onUpdate();
      alert('가입 성공! 로그인해주세요.');
      setIsSignUp(false);
    } else {
      const user = users.find((u: User) => u.id === id && u.passwordHash === pw);
      if (user) {
        onLogin(user);
      } else {
        alert('아이디/비번이 틀렸거나 서버 데이터를 아직 다 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        onUpdate(); // 재시도 시 동기화 트리거
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 pb-safe">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-red-600 rounded-2xl text-white shadow-lg mb-2"><Home size={32} /></div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Twosome Connect</h1>
          <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-widest">Store Management Platform</p>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="아이디 (4자 이상)" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={id} onChange={e => setId(e.target.value.toLowerCase())} />
          <input type="password" placeholder="비밀번호 (숫자 4자리)" maxLength={4} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={pw} onChange={e => setPw(e.target.value.replace(/\D/g, ''))} />
          {isSignUp && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <input type="text" placeholder="본인 성함" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={nickname} onChange={e => setNickname(e.target.value)} />
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 ml-1 uppercase">근무 시작일</label>
                <input type="date" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                <button onClick={() => setRole('STAFF')} className={`flex-1 py-3 rounded-xl font-black transition-all ${role === 'STAFF' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>직원</button>
                <button onClick={() => setRole('OWNER')} className={`flex-1 py-3 rounded-xl font-black transition-all ${role === 'OWNER' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400'}`}>점주</button>
              </div>
            </div>
          )}
          <button onClick={handleAuth} className="w-full py-5 bg-black text-white rounded-2xl font-black text-lg active:scale-95 transition-transform shadow-xl">{isSignUp ? '가입하기' : '로그인'}</button>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-sm font-bold text-gray-400 py-2">{isSignUp ? '이미 계정이 있나요? 로그인' : '처음인가요? 계정 만들기'}</button>
        </div>
      </div>
    </div>
  );
};

export default App;
