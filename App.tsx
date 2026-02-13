
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { User, UserRole, AppData } from './types';
import { NoticeBoard } from './components/NoticeBoard';
import { HandoverBoard } from './components/HandoverBoard';
import { ChecklistBoard } from './components/ChecklistBoard';
import { AttendanceCalendar } from './components/AttendanceCalendar';
import { InventoryManagement } from './components/InventoryManagement';
import { RecipeManual } from './components/RecipeManual';
import { OwnerAdmin } from './components/OwnerAdmin';
import { ReservationManagement } from './components/ReservationManagement';
import { 
  LogOut, Megaphone, ClipboardList, CheckSquare, 
  Calendar, Package, BookOpen, 
  RefreshCw, Store, Loader2, Wifi, WifiOff, Database, AlertTriangle, 
  Clock, Activity
} from 'lucide-react';

const INITIAL_APP_DATA: AppData = {
  users: [], notices: [], handovers: [], inventory: [], 
  reservations: [], schedules: [], reports: [], tasks: [], 
  template: [], recipes: []
};

// 안정성이 검증된 글로벌 엔드포인트
const DB_PATH = 'https://kvdb.io/Snd98D7fG6h5J4k3L2m1'; 

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [storeId, setStoreId] = useState(localStorage.getItem('twosome_store_id') || '');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'syncing'>('offline');
  const [appData, setAppData] = useState<AppData>(INITIAL_APP_DATA);
  const [isInitialized, setIsInitialized] = useState(false);
  const [latency, setLatency] = useState<number>(0);
  
  const syncLock = useRef(false);

  // 서버에서 데이터 가져오기 (GET)
  const fetchLatest = useCallback(async (): Promise<AppData | null> => {
    if (!storeId) return null;
    const start = Date.now();
    try {
      const response = await fetch(`${DB_PATH}/${storeId}?cb=${Date.now()}`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setAppData(data);
        setSyncStatus('connected');
        setLatency(Date.now() - start);
        return data;
      } else if (response.status === 404) {
        return INITIAL_APP_DATA;
      }
      throw new Error();
    } catch (e) {
      setSyncStatus('offline');
      return null;
    } finally {
      setIsInitialized(true);
    }
  }, [storeId]);

  // 서버에 데이터 밀어넣기 (POST)
  const pushData = useCallback(async (newData: AppData) => {
    if (!storeId || syncLock.current) return;
    syncLock.current = true;
    setSyncStatus('syncing');
    try {
      await fetch(`${DB_PATH}/${storeId}`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
      setSyncStatus('connected');
    } catch (e) {
      setSyncStatus('offline');
    } finally {
      syncLock.current = false;
    }
  }, [storeId]);

  // 실시간 엔진 (2.5초마다 폴링)
  useEffect(() => {
    if (storeId) {
      fetchLatest();
      const timer = setInterval(() => fetchLatest(), 2500);
      return () => clearInterval(timer);
    } else {
      setIsInitialized(true);
    }
  }, [storeId, fetchLatest]);

  useEffect(() => {
    const saved = localStorage.getItem('twosome_session');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const handleUpdate = async (key: keyof AppData, updatedItems: any[]) => {
    // 1. 최신 데이터를 먼저 가져와서 (다른 기기 변경사항 반영)
    const currentCloud = await fetchLatest();
    const base = currentCloud || appData;
    // 2. 내 변경사항을 합치고
    const merged = { ...base, [key]: updatedItems };
    // 3. 서버에 전송
    setAppData(merged);
    await pushData(merged);
  };

  const handleManualImport = (code: string) => {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(code))));
      setAppData(decoded);
      pushData(decoded);
      alert('데이터가 성공적으로 복구되었습니다.');
    } catch (e) { alert('잘못된 코드입니다.'); }
  };

  if (!isInitialized && storeId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <Loader2 size={40} className="text-red-600 animate-spin mb-4" />
        <p className="font-black text-gray-900 tracking-tighter">서버 연결 확인 중...</p>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-500">
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-red-600 rounded-3xl text-white shadow-xl"><Store size={40} /></div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">투썸 PRO 가동</h1>
            <p className="text-gray-500 font-bold text-sm leading-relaxed">매장 코드 <span className="text-red-600">1903384</span>를 입력하여<br/>전 기기 실시간 공유를 시작하세요.</p>
          </div>
          <input 
            type="text" placeholder="매장 코드 입력" 
            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-red-500 font-black text-center text-lg uppercase"
            onChange={e => localStorage.setItem('twosome_temp_id', e.target.value)}
          />
          <button onClick={() => {
            const id = localStorage.getItem('twosome_temp_id')?.trim().toLowerCase();
            if(id) { localStorage.setItem('twosome_store_id', id); window.location.reload(); }
          }} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all">연동 시작하기</button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage 
        storeId={storeId}
        appData={appData} 
        syncStatus={syncStatus}
        latency={latency}
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem('twosome_session', JSON.stringify(user));
        }} 
        onForceSync={fetchLatest}
        onUpdateUsers={(users) => handleUpdate('users', users)}
        onImport={handleManualImport}
        onReset={() => { if(confirm('매장 코드를 재입력하시겠습니까?')) { localStorage.clear(); window.location.reload(); } }}
      />
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navigation user={currentUser} storeId={storeId} syncStatus={syncStatus} latency={latency} onLogout={() => { if(confirm('로그아웃 하시겠습니까?')) { localStorage.removeItem('twosome_session'); setCurrentUser(null); } }} onManualSync={() => fetchLatest()} />
        <main className="flex-1 pt-20 pb-24 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/notice" element={<NoticeBoard currentUser={currentUser} data={appData.notices} onUpdate={(items) => handleUpdate('notices', items)} />} />
            <Route path="/handover" element={<HandoverBoard currentUser={currentUser} data={appData.handovers} onUpdate={(items) => handleUpdate('handovers', items)} />} />
            <Route path="/checklist" element={<ChecklistBoard currentUser={currentUser} data={appData.tasks} onUpdate={(items) => handleUpdate('tasks', items)} onReportSubmit={(r) => handleUpdate('reports', [...appData.reports, r])} />} />
            <Route path="/attendance" element={<AttendanceCalendar currentUser={currentUser} allUsers={appData.users} reports={appData.reports} onUpdate={(items) => handleUpdate('reports', items)} />} />
            <Route path="/inventory" element={<InventoryManagement currentUser={currentUser} data={appData.inventory} onUpdate={(items) => handleUpdate('inventory', items)} />} />
            <Route path="/recipe" element={<RecipeManual currentUser={currentUser} data={appData.recipes} onUpdate={(items) => handleUpdate('recipes', items)} />} />
            <Route path="/reservation" element={<ReservationManagement currentUser={currentUser} data={appData.reservations} onUpdate={(items) => handleUpdate('reservations', items)} />} />
            <Route path="/admin" element={<OwnerAdmin appData={appData} onUpdate={handleUpdate} onStoreIdUpdate={(id) => {localStorage.setItem('twosome_store_id', id); window.location.reload();}} />} />
            <Route path="*" element={<Navigate to="/notice" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

const Navigation: React.FC<{ user: User, storeId: string, syncStatus: string, latency: number, onLogout: () => void, onManualSync: () => void }> = ({ user, storeId, syncStatus, latency, onLogout, onManualSync }) => {
  const location = useLocation();
  const navItems = [
    { path: '/notice', label: '공지', icon: Megaphone },
    { path: '/handover', label: '인계', icon: ClipboardList },
    { path: '/checklist', label: '체크', icon: CheckSquare },
    { path: '/recipe', label: '레시피', icon: BookOpen },
    { path: '/inventory', label: '재고', icon: Package },
    { path: '/attendance', label: '근무', icon: Calendar },
    { path: '/reservation', label: '예약', icon: Clock },
  ];
  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-red-600 tracking-tighter shrink-0">TWOSOME</h1>
          <button onClick={onManualSync} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            <Activity size={12} className={syncStatus === 'connected' ? 'animate-pulse' : ''} />
            {syncStatus === 'connected' ? `${latency}ms` : 'OFFLINE'}
          </button>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${location.pathname === item.path ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}>{item.label}</Link>
          ))}
          {user.role === 'OWNER' && <Link to="/admin" className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${location.pathname === '/admin' ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-50'}`}>관리</Link>}
        </nav>
        <button onClick={onLogout} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><LogOut size={22} /></button>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex justify-around items-center z-50 md:hidden">
        {navItems.map(item => (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 w-full ${location.pathname === item.path ? 'text-red-600' : 'text-gray-300'}`}>
            <item.icon size={20} /> <span className="text-[9px] font-black">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
};

const LoginPage: React.FC<{ storeId: string, appData: AppData, syncStatus: string, latency: number, onLogin: (user: User) => void, onForceSync: () => Promise<AppData|null>, onUpdateUsers: (u: User[]) => void, onImport: (c: string) => void, onReset: () => void }> = ({ storeId, appData, syncStatus, latency, onLogin, onForceSync, onUpdateUsers, onImport, onReset }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ id: '', pw: '', nickname: '', role: 'STAFF' as UserRole });

  const handleAuth = async () => {
    const userId = form.id.toLowerCase().trim();
    const userPw = form.pw.trim();
    if (userId.length < 4 || userPw.length !== 4) { alert('아이디 4자 이상, 비번 4자리여야 합니다.'); return; }
    
    setLoading(true);
    // 로그인 시도 전 강제로 서버에서 최신 데이터를 긁어옴 (가장 중요!)
    const freshData = await onForceSync();
    const usersToSearch = freshData ? freshData.users : appData.users;

    const user = usersToSearch.find(u => u.id === userId && u.passwordHash === userPw);

    if (user) {
      onLogin(user);
    } else {
      if (isSignUp) {
        if (usersToSearch.find(u => u.id === userId)) { alert('이미 존재하는 아이디입니다.'); setLoading(false); return; }
        const newUser: User = { id: userId, passwordHash: userPw, nickname: form.nickname.trim() || userId, role: form.role, updatedAt: Date.now() };
        onUpdateUsers([...usersToSearch, newUser]);
        onLogin(newUser);
      } else {
        alert('아이디/비번이 틀렸습니다. (방금 가입했다면 1초만 기다려주세요)');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8 animate-in slide-in-from-bottom-6">
        <div className="text-center space-y-3">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {syncStatus === 'connected' ? <Wifi size={14}/> : <WifiOff size={14}/>} 
            매장:{storeId.toUpperCase()} • {syncStatus === 'connected' ? `${latency}ms 연동중` : '연결안됨'}
          </div>
          <h1 className="text-4xl font-black text-red-600 tracking-tighter italic">TWOSOME PRO</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Store Management System</p>
        </div>

        {syncStatus === 'offline' && (
          <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
            <AlertTriangle className="text-red-600 shrink-0" size={20} />
            <p className="text-[10px] font-bold text-red-800 leading-tight">엣지 브라우저는 보안 설정 때문에 실시간 연동이 차단될 수 있습니다. <br/>하단 [비상용 수동 연동]을 이용해 주세요.</p>
          </div>
        )}
        
        <div className="space-y-4">
          <input type="text" placeholder="아이디" className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-red-600 transition-all" onChange={e => setForm({...form, id: e.target.value})} />
          <input type="password" placeholder="비밀번호(4자리)" maxLength={4} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-red-600 transition-all" onChange={e => setForm({...form, pw: e.target.value})} />
          
          {isSignUp && (
            <div className="space-y-4 pt-2 animate-in slide-in-from-top-4">
              <input type="text" placeholder="이름 (닉네임)" className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" onChange={e => setForm({...form, nickname: e.target.value})} />
              <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
                <button onClick={() => setForm({...form, role: 'STAFF'})} className={`flex-1 py-3 rounded-xl font-black text-xs ${form.role === 'STAFF' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>직원</button>
                <button onClick={() => setForm({...form, role: 'OWNER'})} className={`flex-1 py-3 rounded-xl font-black text-xs ${form.role === 'OWNER' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400'}`}>점주</button>
              </div>
            </div>
          )}

          <button onClick={handleAuth} disabled={loading} className="w-full py-6 bg-black text-white rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
            {loading ? <RefreshCw className="animate-spin" /> : (isSignUp ? '무료 계정 생성' : '매장 로그인')}
          </button>
          
          <div className="flex flex-col gap-3 pt-6 border-t border-gray-100">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm font-black text-gray-400 hover:text-red-600 transition-colors">{isSignUp ? '이미 아이디가 있습니다 (로그인)' : '우리 매장 첫 이용인가요? (회원가입)'}</button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { const code = prompt('코드를 입력하세요'); if(code) onImport(code); }} className="flex items-center justify-center gap-2 py-4 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black hover:bg-blue-100 transition-colors">
                <Database size={14}/> 비상 수동 연동
              </button>
              <button onClick={onReset} className="py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black hover:bg-gray-100 transition-colors">매장코드 재설정</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
