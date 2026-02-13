
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
  Calendar, Package, ShieldAlert, BookOpen, Home, 
  Cloud, CloudOff, RefreshCw, Store, Book, Loader2, AlertTriangle, Copy
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
    { path: '/notice', label: '공지', icon: Megaphone },
    { path: '/handover', label: '인계', icon: ClipboardList },
    { path: '/checklist', label: '업무', icon: CheckSquare },
    { path: '/recipe', label: '레시피', icon: BookOpen },
    { path: '/inventory', label: '재고', icon: Package },
    { path: '/attendance', label: '근무표', icon: Calendar },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-red-600 tracking-tighter">TWOSOME</h1>
          <button onClick={onManualSync} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : syncStatus === 'syncing' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
            {syncStatus === 'syncing' ? <RefreshCw size={12} className="animate-spin" /> : syncStatus === 'connected' ? <Cloud size={12} /> : <CloudOff size={12} />}
            {storeId}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-xs font-bold text-gray-500">{user.nickname}님</span>
          <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-600"><LogOut size={20} /></button>
        </div>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex justify-around items-center z-50 pb-safe shadow-lg md:hidden">
        {navItems.map(item => (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 w-full transition-colors ${location.pathname === item.path ? 'text-red-600' : 'text-gray-300'}`}>
            <item.icon size={20} strokeWidth={location.pathname === item.path ? 3 : 2} />
            <span className="text-[9px] font-black">{item.label}</span>
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

  // 1. 초기화 및 세션 확인
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('kakao') || ua.includes('instagram')) setBrowserWarning(true);
    const saved = localStorage.getItem('twosome_session');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  // 2. 서버에서 가져오기
  const fetchCloud = useCallback(async () => {
    if (!storeId || isSyncing.current) return;
    isSyncing.current = true;
    setSyncStatus('syncing');

    try {
      const res = await fetch(`https://kvdb.io/ANvV448oU6Q4H6H3N7j2y2/${storeId}?t=${Date.now()}`);
      if (res.ok) {
        const cloudData: AppData = await res.json();
        // 클라우드 데이터를 로컬 상태와 스토리지에 즉시 반영 (동기화의 핵심)
        setAppData(cloudData);
        (Object.keys(DATA_KEYS) as (keyof AppData)[]).forEach(key => {
          localStorage.setItem(DATA_KEYS[key], JSON.stringify(cloudData[key] || []));
        });
        setSyncStatus('connected');
      } else if (res.status === 404) {
        setSyncStatus('connected'); // 신규 매장은 오프라인이 아님
      }
    } catch (e) {
      setSyncStatus('offline');
    } finally {
      isSyncing.current = false;
      setIsReady(true);
    }
  }, [storeId]);

  // 3. 서버에 올리기 (데이터 변경 시 즉시 호출용)
  const pushCloud = useCallback(async (newData: AppData) => {
    if (!storeId) return;
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

  // 주기적 동기화
  useEffect(() => {
    if (storeId) {
      fetchCloud();
      const interval = setInterval(fetchCloud, 15000);
      return () => clearInterval(interval);
    } else {
      setIsReady(true);
    }
  }, [storeId, fetchCloud]);

  // 데이터 업데이트 핸들러 (하위 컴포넌트에서 호출)
  const handleUpdate = (key: keyof AppData, updatedItems: any[]) => {
    const newData = { ...appData, [key]: updatedItems };
    setAppData(newData);
    localStorage.setItem(DATA_KEYS[key], JSON.stringify(updatedItems));
    pushCloud(newData); // 즉시 서버 전송
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
          <p className="font-bold text-sm leading-relaxed">카톡/인스타 브라우저에서는 데이터가 유실됩니다. 주소를 복사해서 <b>크롬(Chrome)</b>에서 열어주세요.</p>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('복사됨!'); }} className="w-full py-4 bg-white text-red-600 rounded-2xl font-black flex items-center justify-center gap-2"><Copy size={18}/> 주소 복사하기</button>
          <button onClick={() => setBrowserWarning(false)} className="text-xs opacity-50 underline">무시하고 진행</button>
        </div>
      </div>
    );
  }

  if (!isReady && storeId) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="text-red-600 animate-spin mb-6" size={48} />
        <h2 className="text-xl font-black text-gray-900 tracking-tighter">데이터 동기화 중...</h2>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-red-600 rounded-3xl text-white shadow-xl"><Store size={40} /></div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">매장 연결</h1>
            <p className="text-gray-500 font-bold text-sm leading-relaxed">공유받은 매장 코드를 입력하세요.</p>
          </div>
          <input 
            type="text" placeholder="매장 코드 입력" 
            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-red-500 font-black text-center text-lg uppercase"
            onChange={e => localStorage.setItem('twosome_temp_id', e.target.value)}
          />
          <button onClick={() => {
            const id = localStorage.getItem('twosome_temp_id')?.trim().toLowerCase();
            if(id) { localStorage.setItem('twosome_store_id', id); window.location.reload(); }
          }} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl">연결하기</button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={(user) => {
      setCurrentUser(user);
      localStorage.setItem('twosome_session', JSON.stringify(user));
      fetchCloud();
    }} allUsers={appData.users} onUserUpdate={(users) => handleUpdate('users', users)} />;
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navigation user={currentUser} storeId={storeId} syncStatus={syncStatus} onLogout={handleLogout} onManualSync={fetchCloud} />
        <main className="flex-1 pt-20 pb-24 px-4 max-w-4xl mx-auto w-full">
          <Routes>
            <Route path="/notice" element={<NoticeBoard currentUser={currentUser} data={appData.notices} onUpdate={(items) => handleUpdate('notices', items)} />} />
            <Route path="/handover" element={<HandoverBoard currentUser={currentUser} data={appData.handovers} onUpdate={(items) => handleUpdate('handovers', items)} />} />
            <Route path="/checklist" element={<ChecklistBoard currentUser={currentUser} data={appData.tasks} onUpdate={(items) => handleUpdate('tasks', items)} onReportSubmit={(r) => handleUpdate('reports', [...appData.reports, r])} />} />
            <Route path="/attendance" element={<AttendanceCalendar currentUser={currentUser} allUsers={appData.users} reports={appData.reports} onUpdate={(items) => handleUpdate('reports', items)} />} />
            <Route path="/inventory" element={<InventoryManagement currentUser={currentUser} data={appData.inventory} onUpdate={(items) => handleUpdate('inventory', items)} />} />
            <Route path="/recipe" element={<RecipeManual currentUser={currentUser} data={appData.recipes} onUpdate={(items) => handleUpdate('recipes', items)} />} />
            <Route path="/admin" element={<OwnerAdmin onStoreIdUpdate={(id) => {localStorage.setItem('twosome_store_id', id); window.location.reload();}} />} />
            <Route path="*" element={<Navigate to="/notice" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

const LoginPage: React.FC<{ onLogin: (user: User) => void, allUsers: User[], onUserUpdate: (u: User[]) => void }> = ({ onLogin, allUsers, onUserUpdate }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ id: '', pw: '', nickname: '', role: 'STAFF' as UserRole });

  const handleAuth = () => {
    if (form.id.length < 4 || form.pw.length !== 4) { alert('아이디 4자 이상, 비밀번호 4자리여야 합니다.'); return; }
    
    if (isSignUp) {
      if (allUsers.find(u => u.id === form.id)) { alert('이미 존재하는 아이디입니다.'); return; }
      const newUser = { id: form.id, passwordHash: form.pw, nickname: form.nickname, role: form.role, updatedAt: Date.now() };
      onUserUpdate([...allUsers, newUser]);
      onLogin(newUser);
    } else {
      const user = allUsers.find(u => u.id === form.id && u.passwordHash === form.pw);
      if (user) onLogin(user);
      else alert('정보가 올바르지 않거나 데이터가 아직 동기화되지 않았습니다. 잠시 후 시도하세요.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-8">
        <h1 className="text-3xl font-black text-center text-red-600">TWOSOME CONNECT</h1>
        <div className="space-y-4">
          <input type="text" placeholder="아이디" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" onChange={e => setForm({...form, id: e.target.value.toLowerCase()})} />
          <input type="password" placeholder="비밀번호(4자리)" maxLength={4} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" onChange={e => setForm({...form, pw: e.target.value})} />
          {isSignUp && (
            <div className="space-y-4">
              <input type="text" placeholder="성함" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" onChange={e => setForm({...form, nickname: e.target.value})} />
              <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                <button onClick={() => setForm({...form, role: 'STAFF'})} className={`flex-1 py-3 rounded-xl font-black ${form.role === 'STAFF' ? 'bg-white shadow-sm' : 'text-gray-400'}`}>직원</button>
                <button onClick={() => setForm({...form, role: 'OWNER'})} className={`flex-1 py-3 rounded-xl font-black ${form.role === 'OWNER' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400'}`}>점주</button>
              </div>
            </div>
          )}
          <button onClick={handleAuth} className="w-full py-5 bg-black text-white rounded-2xl font-black text-lg">
            {isSignUp ? '가입 및 시작' : '로그인'}
          </button>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-sm font-bold text-gray-400">{isSignUp ? '로그인하기' : '회원가입'}</button>
        </div>
      </div>
    </div>
  );
};

export default App;
