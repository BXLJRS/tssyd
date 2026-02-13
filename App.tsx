
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { User, UserRole, AppData, Notice, Handover, InventoryItem, Reservation, WorkSchedule, DailyReport, ChecklistItem, Recipe } from './types';
import { NoticeBoard } from './components/NoticeBoard';
import { HandoverBoard } from './components/HandoverBoard';
import { ChecklistBoard } from './components/ChecklistBoard';
import { AttendanceCalendar } from './components/AttendanceCalendar';
import { InventoryManagement } from './components/InventoryManagement';
import { ReservationManagement } from './components/ReservationManagement';
import { RecipeManual } from './components/RecipeManual';
import { OwnerAdmin } from './components/OwnerAdmin';
import { 
  LogOut, Megaphone, ClipboardList, CheckSquare, 
  Calendar, Package, ShieldAlert, BookOpen, 
  Cloud, CloudOff, RefreshCw, Store, Loader2, AlertTriangle, Copy
} from 'lucide-react';

const INITIAL_APP_DATA: AppData = {
  users: [], notices: [], handovers: [], inventory: [], 
  reservations: [], schedules: [], reports: [], tasks: [], 
  template: [], recipes: []
};

const DATA_KEYS: Record<keyof AppData, string> = {
  users: 'twosome_users', notices: 'twosome_notices', handovers: 'twosome_handovers',
  inventory: 'twosome_inventory', reservations: 'twosome_reservations',
  schedules: 'twosome_schedules', reports: 'twosome_reports',
  tasks: 'twosome_tasks', template: 'twosome_tasks_template', recipes: 'twosome_recipes'
};

const Navigation: React.FC<{ 
  user: User, 
  storeId: string, 
  syncStatus: 'connected' | 'offline' | 'syncing', 
  onLogout: () => void,
  onManualSync: () => void
}> = ({ user, storeId, syncStatus, onLogout, onManualSync }) => {
  const location = useLocation();
  const navItems = [
    { path: '/notice', label: '공지사항', icon: Megaphone },
    { path: '/handover', label: '인계인수', icon: ClipboardList },
    { path: '/checklist', label: '업무체크', icon: CheckSquare },
    { path: '/recipe', label: '레시피', icon: BookOpen },
    { path: '/inventory', label: '재고관리', icon: Package },
    { path: '/attendance', label: '근무표', icon: Calendar },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black text-red-600 tracking-tighter shrink-0">TWOSOME</h1>
          <button 
            onClick={onManualSync} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : syncStatus === 'syncing' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}
          >
            {syncStatus === 'syncing' ? <RefreshCw size={12} className="animate-spin" /> : syncStatus === 'connected' ? <Cloud size={12} /> : <CloudOff size={12} />}
            {storeId}
          </button>
        </div>

        {/* Desktop Navigation: PC에서 메뉴가 안 보이던 문제 해결 */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${location.pathname === item.path ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
          {user.role === 'OWNER' && (
            <Link 
              to="/admin" 
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${location.pathname === '/admin' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <ShieldAlert size={16} />
              매장관리
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">{user.role}</span>
            <span className="text-xs font-bold text-gray-900 leading-none">{user.nickname}님</span>
          </div>
          <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><LogOut size={22} /></button>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar: 모바일 전용 */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex justify-around items-center z-50 pb-safe shadow-lg md:hidden">
        {navItems.map(item => (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 w-full transition-colors ${location.pathname === item.path ? 'text-red-600' : 'text-gray-300'}`}>
            <item.icon size={20} strokeWidth={location.pathname === item.path ? 3 : 2} />
            <span className="text-[9px] font-black">{item.label.slice(0, 2)}</span>
          </Link>
        ))}
        {user.role === 'OWNER' && (
          <Link to="/admin" className={`flex flex-col items-center gap-1 w-full transition-colors ${location.pathname === '/admin' ? 'text-red-600' : 'text-gray-300'}`}>
            <ShieldAlert size={20} />
            <span className="text-[9px] font-black">관리</span>
          </Link>
        )}
      </nav>
    </>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [storeId, setStoreId] = useState(localStorage.getItem('twosome_store_id') || '');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'syncing'>('offline');
  const [isReady, setIsReady] = useState(false);
  const [appData, setAppData] = useState<AppData>(INITIAL_APP_DATA);
  const [browserWarning, setBrowserWarning] = useState(false);
  const isSyncing = useRef(false);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('kakao') || ua.includes('instagram')) setBrowserWarning(true);
    const saved = localStorage.getItem('twosome_session');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  // 스마트 병합 로직: 유실 방지의 핵심
  const smartMerge = (local: AppData, cloud: AppData): AppData => {
    const merged: any = { ...INITIAL_APP_DATA };
    (Object.keys(DATA_KEYS) as (keyof AppData)[]).forEach(key => {
      const localItems = local[key] || [];
      const cloudItems = cloud[key] || [];
      
      const allIds = Array.from(new Set([...localItems.map((i:any) => i.id), ...cloudItems.map((i:any) => i.id)]));
      merged[key] = allIds.map(id => {
        const localItem = localItems.find((i:any) => i.id === id);
        const cloudItem = cloudItems.find((i:any) => i.id === id);
        if (!localItem) return cloudItem;
        if (!cloudItem) return localItem;
        // 수정 시간이 더 최신인 것을 선택
        return (localItem.updatedAt || 0) >= (cloudItem.updatedAt || 0) ? localItem : cloudItem;
      });
    });
    return merged as AppData;
  };

  const fetchCloud = useCallback(async (isSilent = false) => {
    if (!storeId || isSyncing.current) return;
    isSyncing.current = true;
    if (!isSilent) setSyncStatus('syncing');

    try {
      // 캐시 방지를 위해 타임스탬프 추가
      const res = await fetch(`https://kvdb.io/ANvV448oU6Q4H6H3N7j2y2/${storeId}?t=${Date.now()}`);
      if (res.ok) {
        const cloudData: AppData = await res.json();
        const localData: any = {};
        (Object.keys(DATA_KEYS) as (keyof AppData)[]).forEach(key => {
          localData[key] = JSON.parse(localStorage.getItem(DATA_KEYS[key]) || '[]');
        });

        const merged = smartMerge(localData as AppData, cloudData);
        setAppData(merged);
        (Object.keys(DATA_KEYS) as (keyof AppData)[]).forEach(key => {
          localStorage.setItem(DATA_KEYS[key], JSON.stringify(merged[key]));
        });
        setSyncStatus('connected');
        hasLoadedOnce.current = true;
      } else {
        setSyncStatus('connected');
        hasLoadedOnce.current = true;
      }
    } catch (e) {
      setSyncStatus('offline');
    } finally {
      isSyncing.current = false;
      setIsReady(true);
    }
  }, [storeId]);

  const pushCloud = useCallback(async (newData: AppData) => {
    if (!storeId || !hasLoadedOnce.current) return; // 한 번도 불러오지 않았다면 절대 올리지 않음 (유실 방지)
    setSyncStatus('syncing');
    try {
      await fetch(`https://kvdb.io/ANvV448oU6Q4H6H3N7j2y2/${storeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
      setSyncStatus('connected');
    } catch (e) {
      setSyncStatus('offline');
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchCloud();
      const interval = setInterval(() => fetchCloud(true), 15000);
      return () => clearInterval(interval);
    } else {
      setIsReady(true);
    }
  }, [storeId, fetchCloud]);

  const handleUpdate = (key: keyof AppData, updatedItems: any[]) => {
    const newData = { ...appData, [key]: updatedItems };
    setAppData(newData);
    localStorage.setItem(DATA_KEYS[key], JSON.stringify(updatedItems));
    pushCloud(newData);
  };

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('twosome_session');
      setCurrentUser(null);
    }
  };

  if (browserWarning) {
    return (
      <div className="min-h-screen bg-red-600 flex items-center justify-center p-8 text-white text-center">
        <div className="max-w-xs space-y-6">
          <AlertTriangle size={64} className="mx-auto animate-bounce" />
          <h1 className="text-2xl font-black">브라우저 경고</h1>
          <p className="font-bold text-sm leading-relaxed">카카오톡 내부는 연동이 불안정합니다. 오른쪽 위 버튼을 눌러 "다른 브라우저로 열기" 또는 크롬을 사용하세요.</p>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('복사되었습니다!'); }} className="w-full py-4 bg-white text-red-600 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl"><Copy size={18}/> 주소 복사하기</button>
          <button onClick={() => setBrowserWarning(false)} className="text-xs opacity-50 underline">무시하고 진행</button>
        </div>
      </div>
    );
  }

  // 매장 연결 전이거나 데이터를 불러오는 중일 때의 화면
  if (!isReady && storeId) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <Loader2 className="text-red-600 animate-spin mb-6" size={48} />
        <h2 className="text-xl font-black text-gray-900">데이터 연동 확인 중...</h2>
        <p className="text-gray-400 font-medium text-sm mt-2">잠시만 기다려주세요.</p>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-300">
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-red-600 rounded-3xl text-white shadow-xl"><Store size={40} /></div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">매장 코드 연결</h1>
            <p className="text-gray-500 font-bold text-sm leading-relaxed">기기 간 데이터를 공유하기 위해<br/>매장 전용 코드를 입력하세요.</p>
          </div>
          <input 
            type="text" placeholder="매장 코드 (예: twosome-강남)" 
            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-red-500 font-black text-center text-lg uppercase"
            onChange={e => localStorage.setItem('twosome_temp_id', e.target.value)}
          />
          <button onClick={() => {
            const id = localStorage.getItem('twosome_temp_id')?.trim().toLowerCase();
            if(id) { localStorage.setItem('twosome_store_id', id); window.location.reload(); }
          }} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform">매장 시작하기</button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage 
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem('twosome_session', JSON.stringify(user));
        }} 
        allUsers={appData.users} 
        onSyncRequest={() => fetchCloud()} 
        onUserUpdate={(users) => handleUpdate('users', users)} 
      />
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navigation user={currentUser} storeId={storeId} syncStatus={syncStatus} onLogout={handleLogout} onManualSync={() => fetchCloud()} />
        <main className="flex-1 pt-24 pb-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/notice" element={<NoticeBoard currentUser={currentUser} data={appData.notices} onUpdate={(items) => handleUpdate('notices', items)} />} />
            <Route path="/handover" element={<HandoverBoard currentUser={currentUser} data={appData.handovers} onUpdate={(items) => handleUpdate('handovers', items)} />} />
            <Route path="/checklist" element={<ChecklistBoard currentUser={currentUser} data={appData.tasks} onUpdate={(items) => handleUpdate('tasks', items)} onReportSubmit={(r) => handleUpdate('reports', [...appData.reports, r])} />} />
            <Route path="/attendance" element={<AttendanceCalendar currentUser={currentUser} allUsers={appData.users} reports={appData.reports} onUpdate={(items) => handleUpdate('reports', items)} />} />
            <Route path="/inventory" element={<InventoryManagement currentUser={currentUser} data={appData.inventory} onUpdate={(items) => handleUpdate('inventory', items)} />} />
            <Route path="/recipe" element={<RecipeManual currentUser={currentUser} data={appData.recipes} onUpdate={(items) => handleUpdate('recipes', items)} />} />
            <Route path="/admin" element={<OwnerAdmin appData={appData} onUpdate={handleUpdate} onStoreIdUpdate={(id) => {localStorage.setItem('twosome_store_id', id); window.location.reload();}} />} />
            <Route path="*" element={<Navigate to="/notice" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

const LoginPage: React.FC<{ 
  onLogin: (user: User) => void, 
  allUsers: User[], 
  onSyncRequest: () => Promise<void>,
  onUserUpdate: (u: User[]) => void 
}> = ({ onLogin, allUsers, onSyncRequest, onUserUpdate }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ id: '', pw: '', nickname: '', role: 'STAFF' as UserRole });

  const handleAuth = async () => {
    const userId = form.id.toLowerCase().trim();
    const userPw = form.pw.trim();
    
    if (userId.length < 4 || userPw.length !== 4) { alert('아이디 4자 이상, 비밀번호 4자리여야 합니다.'); return; }
    
    setLoading(true);
    await onSyncRequest(); // 로그인 전 최신 유저 정보를 가져오기 위해 강제 동기화 수행
    setLoading(false);

    if (isSignUp) {
      if (allUsers.find(u => u.id === userId)) { alert('이미 존재하는 아이디입니다.'); return; }
      const newUser = { id: userId, passwordHash: userPw, nickname: form.nickname.trim(), role: form.role, updatedAt: Date.now() };
      onUserUpdate([...allUsers, newUser]);
      onLogin(newUser);
    } else {
      const user = allUsers.find(u => u.id === userId && u.passwordHash === userPw);
      if (user) {
        onLogin(user);
      } else {
        alert('정보가 일바르지 않습니다. 매장 코드가 동일한지, 혹은 아이디/비번이 맞는지 확인하세요.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <h1 className="text-3xl font-black text-red-600 mb-2">TWOSOME CONNECT</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">매장 통합 관리 솔루션</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">아이디</label>
            <input type="text" placeholder="ID 입력" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none focus:border-red-500 transition-all" onChange={e => setForm({...form, id: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">비밀번호 (4자리)</label>
            <input type="password" placeholder="비밀번호" maxLength={4} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none focus:border-red-500 transition-all" onChange={e => setForm({...form, pw: e.target.value})} />
          </div>
          {isSignUp && (
            <div className="space-y-4 animate-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">성함</label>
                <input type="text" placeholder="본명 입력" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none focus:border-red-500 transition-all" onChange={e => setForm({...form, nickname: e.target.value})} />
              </div>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                <button onClick={() => setForm({...form, role: 'STAFF'})} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${form.role === 'STAFF' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>직원(Staff)</button>
                <button onClick={() => setForm({...form, role: 'OWNER'})} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${form.role === 'OWNER' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400'}`}>점주(Owner)</button>
              </div>
            </div>
          )}
          <button onClick={handleAuth} disabled={loading} className="w-full py-5 bg-black text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl">
            {loading ? <RefreshCw className="animate-spin" size={20} /> : (isSignUp ? '가입 및 연동 시작' : '로그인')}
          </button>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-sm font-bold text-gray-400 py-2 hover:text-gray-600">{isSignUp ? '이미 계정이 있나요? 로그인하기' : '새로 오셨나요? 매장 계정 만들기'}</button>
        </div>
      </div>
    </div>
  );
};

export default App;
