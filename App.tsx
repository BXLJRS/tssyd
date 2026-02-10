
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { User, UserRole, DailyReport, InventoryItem, AppData, Notice, Handover, ChecklistItem, WorkSchedule, Reservation, Recipe } from './types';
import { NoticeBoard } from './components/NoticeBoard';
import { HandoverBoard } from './components/HandoverBoard';
import { ChecklistBoard } from './components/ChecklistBoard';
import { WorkManagement } from './components/WorkManagement';
import { AttendanceCalendar } from './components/AttendanceCalendar';
import { InventoryManagement } from './components/InventoryManagement';
import { ReservationManagement } from './components/ReservationManagement';
import { RecipeManual } from './components/RecipeManual';
import { OwnerAdmin } from './components/OwnerAdmin';
import { 
  LogOut, Menu, X, Megaphone, ClipboardList, CheckSquare, 
  Calendar, Package, ShieldAlert, BookOpen, Home, Bell, 
  Info, Cloud, CloudOff, RefreshCw, Settings, Store, Clock, Book
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
  recipes: []
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
  recipes: 'twosome_recipes'
};

const Navigation: React.FC<{ 
  user: User, 
  storeId: string, 
  syncStatus: 'connected' | 'offline' | 'syncing', 
  onLogout: () => void 
}> = ({ user, storeId, syncStatus, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/notice', label: '공지', icon: Megaphone },
    { path: '/handover', label: '인계', icon: ClipboardList },
    { path: '/checklist', label: '업무', icon: CheckSquare },
    { path: '/attendance', label: '기록', icon: Calendar },
    { path: '/work', label: '배정', icon: Clock },
    { path: '/inventory', label: '재고', icon: Package },
    { path: '/reservation', label: '예약', icon: Book },
    { path: '/recipe', label: '레시피', icon: BookOpen },
  ];

  if (user.role === 'OWNER') {
    navItems.push({ path: '/admin', label: '관리자', icon: Settings });
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-50 shadow-sm">
        {/* 왼쪽: 로고 및 모바일 메뉴 버튼 */}
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-gray-50 rounded-xl md:hidden">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2 font-black text-xl tracking-tighter cursor-pointer">
            <Store className="text-red-600" size={24} />
            <span className="hidden sm:inline text-gray-900">TWOSOME</span>
          </div>
        </div>

        {/* 중앙: PC 전용 메뉴 리스트 (수정 핵심 포인트) */}
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

        {/* 오른쪽: 상태 및 사용자 정보 */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
            {syncStatus === 'syncing' ? (
              <RefreshCw size={12} className="text-blue-500 animate-spin" />
            ) : syncStatus === 'connected' ? (
              <Cloud size={12} className="text-green-500" />
            ) : (
              <CloudOff size={12} className="text-gray-400" />
            )}
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{storeId}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
             <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded uppercase">{user.role}</span>
             <span className="text-sm font-bold text-gray-700">{user.nickname}</span>
          </div>
          <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-600 transition-colors ml-2">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* 모바일 사이드바 Drawer */}
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

      {/* 모바일 하단 탭바 (md 이상에서 숨김) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around p-2 z-50 md:hidden pb-safe">
         {navItems.slice(0, 4).map(item => (
           <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 p-2 transition-all ${location.pathname === item.path ? 'text-red-600' : 'text-gray-300'}`}>
             <item.icon size={20} />
             <span className="text-[10px] font-black">{item.label}</span>
           </Link>
         ))}
      </div>
    </>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [storeId, setStoreId] = useState(localStorage.getItem('twosome_store_id') || '');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'syncing'>('offline');
  const [appData, setAppData] = useState<AppData>(INITIAL_APP_DATA);
  const isSyncing = useRef(false);

  // 로컬 데이터 로드
  const loadLocalData = useCallback(() => {
    const localData: any = { ...INITIAL_APP_DATA };
    (Object.keys(DATA_KEYS) as (keyof AppData)[]).forEach(key => {
      const saved = localStorage.getItem(DATA_KEYS[key]);
      if (saved) localData[key] = JSON.parse(saved);
    });
    setAppData(localData);
  }, []);

  useEffect(() => {
    const savedSession = localStorage.getItem('twosome_session');
    if (savedSession) setCurrentUser(JSON.parse(savedSession));
    loadLocalData();
  }, [loadLocalData]);

  const mergeData = (local: any[], cloud: any[]) => {
    const map = new Map();
    cloud.forEach(item => map.set(item.id, item));
    local.forEach(item => {
      const existing = map.get(item.id);
      if (!existing || (item.updatedAt || 0) > (existing.updatedAt || 0)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  };

  const syncWithCloud = useCallback(async (forcePush = false) => {
    if (!storeId || isSyncing.current) return;
    isSyncing.current = true;
    setSyncStatus('syncing');

    try {
      const res = await fetch(`https://kvdb.io/ANvV448oU6Q4H6H3N7j2y2/${storeId}`);
      let cloudData: Partial<AppData> = {};
      if (res.ok) {
        cloudData = await res.json();
      }

      const localData: any = {};
      (Object.keys(DATA_KEYS) as (keyof AppData)[]).forEach(key => {
        localData[key] = JSON.parse(localStorage.getItem(DATA_KEYS[key]) || '[]');
      });

      const mergedData: any = {};
      let hasChanges = false;

      (Object.keys(DATA_KEYS) as (keyof AppData)[]).forEach(key => {
        const cloudItems = cloudData[key] || [];
        const localItems = localData[key] || [];
        const merged = mergeData(localItems, cloudItems);

        if (JSON.stringify(localItems) !== JSON.stringify(merged) || forcePush) {
          hasChanges = true;
        }
        mergedData[key] = merged;
        localStorage.setItem(DATA_KEYS[key], JSON.stringify(merged));
      });

      if (hasChanges || forcePush) {
        setAppData(mergedData);
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
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      syncWithCloud();
      const interval = setInterval(() => syncWithCloud(), 8000);
      return () => clearInterval(interval);
    }
  }, [storeId, syncWithCloud]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('twosome_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('twosome_session');
  };

  if (!storeId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-red-600 rounded-3xl text-white shadow-xl"><Store size={40} /></div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">매장 연결</h1>
            <p className="text-gray-500 font-bold text-sm">동기화를 위해 매장 코드를 입력하세요.</p>
          </div>
          <input 
            type="text" placeholder="예: twosome-manager-01" 
            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-red-500 font-black text-center text-lg uppercase"
            onChange={e => setStoreId(e.target.value.toLowerCase().replace(/\s/g, ''))}
          />
          <button 
            onClick={() => { if(storeId.length > 3) { localStorage.setItem('twosome_store_id', storeId); window.location.reload(); } }}
            className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform"
          >연결하기</button>
        </div>
      </div>
    );
  }

  if (!currentUser) return <LoginPage onLogin={handleLogin} onUpdate={() => syncWithCloud(true)} />;

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navigation user={currentUser} storeId={storeId} syncStatus={syncStatus} onLogout={handleLogout} />
        <main className="flex-1 pt-16 pb-20 px-4 max-w-6xl mx-auto w-full">
          <Routes>
            <Route path="/notice" element={<NoticeBoard currentUser={currentUser} externalData={appData.notices} onUpdate={() => syncWithCloud(true)} />} />
            <Route path="/handover" element={<HandoverBoard currentUser={currentUser} externalData={appData.handovers} onUpdate={() => syncWithCloud(true)} />} />
            <Route path="/checklist" element={<ChecklistBoard currentUser={currentUser} externalData={appData.tasks} onUpdate={() => syncWithCloud(true)} />} />
            <Route path="/attendance" element={<AttendanceCalendar currentUser={currentUser} allUsers={appData.users} externalData={appData.reports} onUpdate={() => syncWithCloud(true)} />} />
            <Route path="/reservation" element={<ReservationManagement currentUser={currentUser} externalData={appData.reservations} onUpdate={() => syncWithCloud(true)} />} />
            <Route path="/work" element={<WorkManagement currentUser={currentUser} allUsers={appData.users} externalData={appData.schedules} onUpdate={() => syncWithCloud(true)} />} />
            <Route path="/inventory" element={<InventoryManagement currentUser={currentUser} externalData={appData.inventory} onUpdate={() => syncWithCloud(true)} />} />
            <Route path="/recipe" element={<RecipeManual currentUser={currentUser} externalData={appData.recipes} onUpdate={() => syncWithCloud(true)} />} />
            {currentUser.role === 'OWNER' && <Route path="/admin" element={<OwnerAdmin onStoreIdUpdate={(id) => { setStoreId(id); localStorage.setItem('twosome_store_id', id); syncWithCloud(true); }} />} />}
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

  const handleAuth = async () => {
    if (id.length < 4 || pw.length !== 4) {
      alert('아이디 4자 이상, 비밀번호 숫자 4자리여야 합니다.');
      return;
    }
    const users = JSON.parse(localStorage.getItem(DATA_KEYS.users) || '[]');
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
      const newUser: User = { id, passwordHash: pw, nickname, role };
      const updatedUsers = [...users, newUser];
      localStorage.setItem(DATA_KEYS.users, JSON.stringify(updatedUsers));
      onUpdate();
      alert('가입 성공! 로그인해주세요.');
      setIsSignUp(false);
    } else {
      const user = users.find((u: User) => u.id === id && u.passwordHash === pw);
      if (user) onLogin(user);
      else alert('로그인 정보를 확인해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 pb-safe">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-red-600 rounded-2xl text-white shadow-lg mb-2"><Home size={32} /></div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Twosome Connect</h1>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="아이디" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={id} onChange={e => setId(e.target.value.toLowerCase())} />
          <input type="password" placeholder="비밀번호 (4자리)" maxLength={4} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={pw} onChange={e => setPw(e.target.value.replace(/\D/g, ''))} />
          {isSignUp && (
            <div className="space-y-4">
              <input type="text" placeholder="이름" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={nickname} onChange={e => setNickname(e.target.value)} />
              <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                <button onClick={() => setRole('STAFF')} className={`flex-1 py-3 rounded-xl font-black ${role === 'STAFF' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>직원</button>
                <button onClick={() => setRole('OWNER')} className={`flex-1 py-3 rounded-xl font-black ${role === 'OWNER' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400'}`}>점주</button>
              </div>
            </div>
          )}
          <button onClick={handleAuth} className="w-full py-5 bg-black text-white rounded-2xl font-black text-lg active:scale-95 transition-transform shadow-xl">{isSignUp ? '가입하기' : '로그인'}</button>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-sm font-bold text-gray-400 py-2">{isSignUp ? '로그인하러 가기' : '계정 생성하기'}</button>
        </div>
      </div>
    </div>
  );
};

export default App;
