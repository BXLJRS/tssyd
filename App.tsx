
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

// 동기화에 사용할 고정 키 맵 (중요: 모든 컴포넌트와 일치해야 함)
const DATA_KEYS: Record<keyof AppData, string> = {
  users: 'twosome_users',
  notices: 'twosome_notices',
  handovers: 'twosome_handovers',
  inventory: 'twosome_inventory',
  reservations: 'twosome_reservations',
  schedules: 'twosome_schedules',
  reports: 'twosome_reports',
  tasks: 'twosome_tasks', // ChecklistBoard와 일치시킴
  template: 'twosome_tasks_template',
  recipes: 'twosome_recipes'
};

const StoreSetupPage: React.FC<{ onComplete: (id: string) => void }> = ({ onComplete }) => {
  const [code, setCode] = useState('');
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
        <div className="text-center space-y-4">
          <div className="inline-block p-4 bg-red-600 rounded-3xl text-white shadow-xl">
            <Store size={40} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">매장 연결</h1>
          <p className="text-gray-500 font-bold text-sm">기기간 데이터 공유를 위해<br/>약속된 매장 코드를 입력해주세요.</p>
        </div>
        <input 
          type="text" placeholder="예: twosome-gangnam-01" 
          className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-red-500 font-black text-center text-lg uppercase"
          value={code} onChange={e => setCode(e.target.value.toLowerCase().replace(/\s/g, ''))}
        />
        <button 
          onClick={() => code.length > 3 && onComplete(code)}
          className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform disabled:opacity-30"
          disabled={code.length <= 3}
        >
          연결하기
        </button>
        <p className="text-center text-[10px] text-gray-400 font-bold">같은 코드를 입력한 모든 기기는 실시간으로 연동됩니다.</p>
      </div>
    </div>
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
      if (user) {
        onLogin(user);
      } else {
        alert('아이디 또는 비밀번호가 틀렸거나, 아직 서버 동기화 전입니다.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 pb-safe">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-8 border border-gray-100">
        <div className="text-center space-y-2">
          <div className="inline-block p-4 bg-red-600 rounded-2xl text-white shadow-lg mb-2">
            <Home size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Twosome Connect</h1>
          <p className="text-gray-400 font-medium text-xs">매장 통합 관리 로그인</p>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="아이디" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-100 font-bold" value={id} onChange={e => setId(e.target.value.toLowerCase())} />
          <input type="password" placeholder="비밀번호 (4자리)" maxLength={4} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-100 font-bold" value={pw} onChange={e => setPw(e.target.value.replace(/\D/g, ''))} />
          {isSignUp && (
            <div className="space-y-4">
              <input type="text" placeholder="실명 입력" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-100 font-bold" value={nickname} onChange={e => setNickname(e.target.value)} />
              <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                <button onClick={() => setRole('STAFF')} className={`flex-1 py-3 rounded-xl font-black transition-all ${role === 'STAFF' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>직원</button>
                <button onClick={() => setRole('OWNER')} className={`flex-1 py-3 rounded-xl font-black transition-all ${role === 'OWNER' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400'}`}>점주</button>
              </div>
            </div>
          )}
          <button onClick={handleAuth} className="w-full py-5 bg-black text-white rounded-2xl font-black text-lg active:scale-95 transition-transform shadow-xl">
            {isSignUp ? '가입하기' : '로그인'}
          </button>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-sm font-bold text-gray-400 py-2">
            {isSignUp ? '이미 계정이 있나요? 로그인' : '처음 방문하셨나요? 계정 생성'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Navigation: React.FC<{ user: User, storeId: string, syncStatus: 'connected' | 'offline' | 'syncing', onLogout: () => void }> = ({ user, storeId, syncStatus, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const mainLinks = [
    { path: '/notice', label: '공지', icon: <Megaphone size={18} /> },
    { path: '/checklist', label: '업무', icon: <CheckSquare size={18} /> },
    { path: '/recipe', label: '레시피', icon: <Book size={18} /> },
    { path: '/inventory', label: '재고', icon: <Package size={18} /> },
    { path: '/attendance', label: '근무표', icon: <Calendar size={18} /> },
  ];

  return (
    <>
      <header className="fixed top-0 inset-x-0 h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-red-600 tracking-tighter">TWOSOME</h1>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${syncStatus === 'connected' ? 'bg-green-100 text-green-600' : syncStatus === 'syncing' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
            {syncStatus === 'connected' ? <Cloud size={10} /> : syncStatus === 'syncing' ? <RefreshCw size={10} className="animate-spin" /> : <CloudOff size={10} />}
            {storeId}
          </div>
        </div>
        <button onClick={() => setIsOpen(true)} className="p-2 text-gray-800 md:hidden"><Menu size={24} /></button>
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          {mainLinks.map(link => (
            <Link key={link.path} to={link.path} className={`text-sm font-bold ${location.pathname === link.path ? 'text-red-600' : 'text-gray-500'}`}>{link.label}</Link>
          ))}
          {user.role === 'OWNER' && <Link to="/admin" className={`text-sm font-bold ${location.pathname === '/admin' ? 'text-red-600' : 'text-black'}`}>관리자</Link>}
          <button onClick={onLogout} className="text-sm font-bold text-gray-400"><LogOut size={18} /></button>
        </div>
      </header>

      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t flex justify-around items-center h-16 pb-safe z-40 px-1 shadow-lg">
        {mainLinks.map(link => (
          <Link key={link.path} to={link.path} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${location.pathname === link.path ? 'text-red-600' : 'text-gray-400'}`}>
            {React.cloneElement(link.icon as React.ReactElement<any>, { size: 20 })}
            <span className="text-[9px] font-black mt-1 leading-none">{link.label}</span>
          </Link>
        ))}
        <Link to={user.role === 'OWNER' ? "/admin" : "/reservation"} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${location.pathname === '/admin' || location.pathname === '/reservation' ? 'text-red-600' : 'text-gray-400'}`}>
          {user.role === 'OWNER' ? <ShieldAlert size={20} /> : <BookOpen size={20} />}
          <span className="text-[9px] font-black mt-1 leading-none">{user.role === 'OWNER' ? '관리' : '예약'}</span>
        </Link>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-300">
          <div className="absolute right-0 inset-y-0 w-3/4 bg-white shadow-2xl p-8 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-10">
              <div className="font-black text-gray-900">전체 메뉴</div>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="space-y-4 flex-1">
              <Link to="/recipe" onClick={() => setIsOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl font-black bg-red-50 text-red-600"><Book size={20} /> 레시피북</Link>
              <Link to="/checklist" onClick={() => setIsOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl font-black bg-gray-50 text-gray-600"><CheckSquare size={20} /> 업무 체크리스트</Link>
              <Link to="/inventory" onClick={() => setIsOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl font-black bg-gray-50 text-gray-600"><Package size={20} /> 재고 관리</Link>
              <Link to="/attendance" onClick={() => setIsOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl font-black bg-gray-50 text-gray-600"><Calendar size={20} /> 실시간 근무표</Link>
              <Link to="/handover" onClick={() => setIsOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl font-black bg-gray-50 text-gray-600"><ClipboardList size={20} /> 인계인수</Link>
              <Link to="/reservation" onClick={() => setIsOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl font-black bg-gray-50 text-gray-600"><BookOpen size={20} /> 예약관리</Link>
              {user.role === 'OWNER' && <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl font-black bg-black text-white"><ShieldAlert size={20} /> 점주 관리 센터</Link>}
            </div>
            <div className="mt-auto pt-6 border-t flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-gray-800">{user.nickname}</div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">{user.role}</div>
              </div>
              <button onClick={onLogout} className="text-red-600 font-black text-sm">로그아웃</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [storeId, setStoreId] = useState(localStorage.getItem('twosome_store_id') || '');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'syncing'>('offline');
  const [appData, setAppData] = useState<AppData>(INITIAL_APP_DATA);

  // 중앙 리셋 로직 (오전 8시)
  const checkAndResetTasks = useCallback((currentTasks: ChecklistItem[]) => {
    const lastReset = localStorage.getItem('twosome_last_reset');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const resetTime = new Date();
    resetTime.setHours(8, 0, 0, 0);

    if (now >= resetTime && lastReset !== todayStr) {
      console.log("Central Reset Triggered");
      const template = JSON.parse(localStorage.getItem(DATA_KEYS.template) || '[]');
      const resetTasks = template.map((t: ChecklistItem) => ({ ...t, isCompleted: false, notes: '' }));
      localStorage.setItem('twosome_last_reset', todayStr);
      localStorage.setItem('twosome_is_submitted_today', 'false');
      return resetTasks;
    }
    return currentTasks;
  }, []);

  const loadLocalData = useCallback(() => {
    const localData: any = { ...INITIAL_APP_DATA };
    (Object.keys(DATA_KEYS) as (keyof AppData)[]).forEach(key => {
      const saved = localStorage.getItem(DATA_KEYS[key]);
      if (saved) localData[key] = JSON.parse(saved);
    });
    
    // 리셋 체크 후 상태 업데이트
    localData.tasks = checkAndResetTasks(localData.tasks);
    localStorage.setItem(DATA_KEYS.tasks, JSON.stringify(localData.tasks));
    
    setAppData(localData);
  }, [checkAndResetTasks]);

  useEffect(() => {
    const savedSession = localStorage.getItem('twosome_session');
    if (savedSession) setCurrentUser(JSON.parse(savedSession));
    loadLocalData();
  }, [loadLocalData]);

  const syncWithCloud = useCallback(async () => {
    if (!storeId) return;
    setSyncStatus('syncing');
    try {
      // 1. 클라우드에서 최신 데이터 가져오기
      const res = await fetch(`https://kvdb.io/ANvV448oU6Q4H6H3N7j2y2/${storeId}`);
      let cloudData: Partial<AppData> = {};
      if (res.ok) {
        cloudData = await res.json();
      }

      // 2. 현재 내 기기의 최신 로컬 데이터 가져오기
      const localData: any = {};
      (Object.keys(DATA_KEYS) as (keyof AppData)[]).forEach(key => {
        localData[key] = JSON.parse(localStorage.getItem(DATA_KEYS[key]) || '[]');
      });

      // 3. 병합 (Merge) - ID 기준
      const mergedData: any = {};
      let hasChanges = false;

      (Object.keys(DATA_KEYS) as (keyof AppData)[]).forEach(key => {
        const cloudItems = cloudData[key] || [];
        const localItems = localData[key] || [];

        // 로컬 데이터를 먼저 넣고 클라우드 데이터 중 없는 것만 추가 (로컬 변경 우선)
        // 단, 업무 체크 리스트처럼 상태가 중요한 것은 ID 기준으로 가장 최신 것을 병합
        const merged = [...localItems, ...cloudItems].filter((v, i, a) => 
          a.findIndex(t => (t as any).id === (v as any).id) === i
        );

        if (JSON.stringify(localData[key]) !== JSON.stringify(merged)) {
          hasChanges = true;
        }
        mergedData[key] = merged;
        localStorage.setItem(DATA_KEYS[key], JSON.stringify(merged));
      });

      // 4. 상태 업데이트
      if (hasChanges) {
        setAppData(mergedData);
      }

      // 5. 서버에 푸시
      await fetch(`https://kvdb.io/ANvV448oU6Q4H6H3N7j2y2/${storeId}`, {
        method: 'POST',
        body: JSON.stringify(mergedData),
      });
      
      setSyncStatus('connected');
    } catch (e) {
      console.error("Sync Error:", e);
      setSyncStatus('offline');
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      syncWithCloud();
      const interval = setInterval(syncWithCloud, 10000);
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

  if (!storeId) return <StoreSetupPage onComplete={(id) => {setStoreId(id); localStorage.setItem('twosome_store_id', id);}} />;
  if (!currentUser) return <LoginPage onLogin={handleLogin} onUpdate={syncWithCloud} />;

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navigation user={currentUser} storeId={storeId} syncStatus={syncStatus} onLogout={handleLogout} />
        <main className="flex-1 pt-16 pb-20 px-4 max-w-4xl mx-auto w-full">
          <Routes>
            <Route path="/notice" element={<NoticeBoard currentUser={currentUser} externalData={appData.notices} onUpdate={syncWithCloud} />} />
            <Route path="/handover" element={<HandoverBoard currentUser={currentUser} externalData={appData.handovers} onUpdate={syncWithCloud} />} />
            <Route path="/checklist" element={<ChecklistBoard currentUser={currentUser} externalData={appData.tasks} onUpdate={syncWithCloud} />} />
            <Route path="/attendance" element={<AttendanceCalendar currentUser={currentUser} allUsers={appData.users} externalData={appData.reports} onUpdate={syncWithCloud} />} />
            <Route path="/reservation" element={<ReservationManagement currentUser={currentUser} externalData={appData.reservations} onUpdate={syncWithCloud} />} />
            <Route path="/work" element={<WorkManagement currentUser={currentUser} allUsers={appData.users} externalData={appData.schedules} onUpdate={syncWithCloud} />} />
            <Route path="/inventory" element={<InventoryManagement currentUser={currentUser} externalData={appData.inventory} onUpdate={syncWithCloud} />} />
            <Route path="/recipe" element={<RecipeManual currentUser={currentUser} externalData={appData.recipes} onUpdate={syncWithCloud} />} />
            {currentUser.role === 'OWNER' && <Route path="/admin" element={<OwnerAdmin onStoreIdUpdate={(id) => {setStoreId(id); localStorage.setItem('twosome_store_id', id);}} />} />}
            <Route path="*" element={<Navigate to="/notice" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
