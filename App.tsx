
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
  RefreshCw, Store, Loader2, Wifi, WifiOff, Clock, RotateCcw, ShieldCheck
} from 'lucide-react';

const INITIAL_APP_DATA: AppData = {
  users: [], notices: [], handovers: [], inventory: [], 
  reservations: [], schedules: [], reports: [], tasks: [], 
  template: [], recipes: []
};

const DB_BASE = 'https://kvdb.io/Snd98D7fG6h5J4k3L2m1'; 

/**
 * 하위 컴포넌트들을 App 상단에 선언하여 호이스팅(Hoisting)으로 인한 빌드 오류 방지
 */

const Navigation: React.FC<{ 
  user: User, 
  storeId: string, 
  syncStatus: string, 
  lastSyncTime: number, 
  onLogout: () => void, 
  onShowDoctor: () => void 
}> = ({ user, storeId, syncStatus, lastSyncTime, onLogout, onShowDoctor }) => {
  const location = useLocation();
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastSyncTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastSyncTime]);

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
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 grid grid-cols-[160px_1fr_180px] items-center px-4 md:px-8 z-50 shadow-sm">
        <div className="flex items-center">
          <h1 className="text-xl font-black text-red-600 tracking-tighter shrink-0 italic">TWOSOME</h1>
        </div>
        <nav className="hidden md:flex items-center justify-center gap-1 overflow-hidden">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className={`px-3 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap ${location.pathname === item.path ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>
              {item.label}
            </Link>
          ))}
          {user.role === 'OWNER' && <Link to="/admin" className={`px-3 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap ${location.pathname === '/admin' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>관리</Link>}
        </nav>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onShowDoctor} className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all min-w-[110px] ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600 animate-pulse'}`}>
            {syncStatus === 'connected' ? <Wifi size={12}/> : <WifiOff size={12}/>}
            <span className="tabular-nums truncate">
              {syncStatus === 'connected' ? `${secondsAgo}초 전 수신` : '연결 확인중'}
            </span>
          </button>
          <button onClick={onLogout} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><LogOut size={22} /></button>
        </div>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex justify-around items-center z-50 md:hidden pb-safe">
        {navItems.map(item => (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 w-full ${location.pathname === item.path ? 'text-red-600' : 'text-gray-300'}`}>
            <item.icon size={20} /> <span className="text-[9px] font-black">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
};

const ConnectionDoctor: React.FC<{ 
  storeId: string, 
  syncStatus: string, 
  lastSyncTime: number, 
  onManualSync: () => void, 
  onClose: () => void 
}> = ({ storeId, syncStatus, lastSyncTime, onManualSync, onClose }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 text-center">
    <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl space-y-6">
      <ShieldCheck size={48} className="mx-auto text-green-600 mb-2" />
      <h3 className="text-2xl font-black text-gray-900 leading-tight italic uppercase">Cloud Sync Status</h3>
      <div className="p-5 bg-gray-50 rounded-2xl space-y-3 text-xs font-bold text-gray-500 text-left">
        <div className="flex justify-between"><span>매장 코드</span> <span className="text-red-600 uppercase font-black">{storeId}</span></div>
        <div className="flex justify-between"><span>상태</span> <span className={syncStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>{syncStatus === 'connected' ? '정상 연결됨' : '재연결 시도 중'}</span></div>
        <div className="flex justify-between"><span>최종 수신</span> <span>{new Date(lastSyncTime).toLocaleTimeString()}</span></div>
      </div>
      <button onClick={() => { onManualSync(); alert('서버 데이터를 수동으로 갱신했습니다.'); }} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-red-100 uppercase italic">
        <RotateCcw size={18} /> Refresh Data
      </button>
      <button onClick={onClose} className="w-full py-5 bg-black text-white rounded-2xl font-black">창 닫기</button>
    </div>
  </div>
);

const LoginPage: React.FC<{ 
  storeId: string, 
  appData: AppData, 
  syncStatus: string, 
  onLogin: (user: User) => void, 
  onForceSync: () => Promise<AppData | null>, 
  onUpdateUsers: (u: User[]) => void, 
  onReset: () => void 
}> = ({ storeId, appData, syncStatus, onLogin, onForceSync, onUpdateUsers, onReset }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ id: '', pw: '', nickname: '', role: 'STAFF' as UserRole });

  const handleAuth = async () => {
    const userId = form.id.toLowerCase().trim();
    const userPw = form.pw.trim();
    if (!userId || userPw.length !== 4) { alert('아이디와 비밀번호(4자리)를 입력하세요.'); return; }
    
    setLoading(true);
    const freshData = await onForceSync();
    const currentUsers = freshData ? freshData.users : appData.users;

    const user = currentUsers.find(u => u.id === userId && u.passwordHash === userPw);

    if (user) {
      onLogin(user);
    } else if (isSignUp) {
      if (currentUsers.find(u => u.id === userId)) { alert('이미 등록된 아이디입니다.'); setLoading(false); return; }
      const newUser: User = { id: userId, passwordHash: userPw, nickname: form.nickname || userId, role: form.role, updatedAt: Date.now() };
      onUpdateUsers([...currentUsers, newUser]);
      onLogin(newUser);
    } else {
      alert('로그인 정보가 일치하지 않습니다.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8 animate-in zoom-in duration-300">
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black bg-gray-50 text-gray-400`}>
             STORE: {storeId.toUpperCase()}
          </div>
          <h1 className="text-4xl font-black text-red-600 tracking-tighter italic">TWOSOME PRO</h1>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="아이디" className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-red-600 transition-all uppercase" onChange={e => setForm({...form, id: e.target.value})} />
          <input type="password" placeholder="비밀번호(4자리)" maxLength={4} className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-red-600 transition-all" onChange={e => setForm({...form, pw: e.target.value})} />
          {isSignUp && (
            <div className="space-y-4 pt-2 animate-in slide-in-from-top-4">
              <input type="text" placeholder="이름" className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl font-bold" onChange={e => setForm({...form, nickname: e.target.value})} />
              <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
                <button onClick={() => setForm({...form, role: 'STAFF'})} className={`flex-1 py-3 rounded-xl font-black text-xs ${form.role === 'STAFF' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>직원</button>
                <button onClick={() => setForm({...form, role: 'OWNER'})} className={`flex-1 py-3 rounded-xl font-black text-xs ${form.role === 'OWNER' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400'}`}>점주</button>
              </div>
            </div>
          )}
          <button onClick={handleAuth} disabled={loading} className="w-full py-6 bg-black text-white rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 flex items-center justify-center gap-3 transition-all disabled:opacity-50">
            {loading ? <RefreshCw className="animate-spin" /> : (isSignUp ? '계정 생성' : '로그인')}
          </button>
          <div className="flex flex-col gap-3 pt-6 border-t border-gray-100 text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm font-black text-gray-400 hover:text-red-600">{isSignUp ? '로그인하기' : '직원 등록하기'}</button>
            <button onClick={onReset} className="text-[10px] font-black text-gray-300 underline uppercase">매장 코드 재설정</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [storeId, setStoreId] = useState(localStorage.getItem('twosome_store_id')?.toLowerCase().trim() || '');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'syncing'>('offline');
  const [appData, setAppData] = useState<AppData>(INITIAL_APP_DATA);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [showDoctor, setShowDoctor] = useState(false);
  
  const syncLock = useRef(false);
  const lastActionTime = useRef<number>(0);

  const syncWithServer = useCallback(async (method: 'GET' | 'POST', payload?: AppData): Promise<AppData | null> => {
    if (!storeId) return null;
    const url = `${DB_BASE}/${storeId}?t=${Date.now()}`;
    
    try {
      setSyncStatus('syncing');
      const response = await fetch(url, {
        method,
        mode: 'cors',
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: payload ? JSON.stringify(payload) : undefined,
      });

      if (response.status === 404 && method === 'GET') {
        setSyncStatus('connected');
        return INITIAL_APP_DATA;
      }

      if (response.ok) {
        const data = method === 'GET' ? await response.json() : payload;
        if (data && typeof data === 'object') {
          if (method === 'GET') setAppData(data);
          setLastSyncTime(Date.now());
          setSyncStatus('connected');
          return data;
        }
      }
      throw new Error("Sync Fail");
    } catch (e) {
      setSyncStatus('offline');
      return null;
    } finally {
      setIsInitialized(true);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      syncWithServer('GET');
      const timer = setInterval(() => {
        const timeSinceLastAction = Date.now() - lastActionTime.current;
        if (!syncLock.current && timeSinceLastAction > 15000) { // 15초로 더 완화
          syncWithServer('GET');
        }
      }, 10000); // 10초 주기로 완화
      return () => clearInterval(timer);
    } else {
      setIsInitialized(true);
    }
  }, [storeId, syncWithServer]);

  useEffect(() => {
    const saved = localStorage.getItem('twosome_session');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const handleUpdate = async (key: keyof AppData, updatedItems: any[]) => {
    if (!storeId) return;
    
    lastActionTime.current = Date.now();
    syncLock.current = true;
    
    const oldData = { ...appData };
    const newData = { ...appData, [key]: updatedItems };
    
    setAppData(newData);

    let result = await syncWithServer('POST', newData);
    
    // 네트워크 오류 시 조용히 1회 더 재시도
    if (!result) {
      await new Promise(r => setTimeout(r, 1000));
      result = await syncWithServer('POST', newData);
    }
    
    if (!result) {
      setAppData(oldData);
      alert('데이터 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
    
    // 조작 후 3초간 동기화 잠금 유지
    setTimeout(() => {
      syncLock.current = false;
    }, 3000);
  };

  if (!isInitialized && storeId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <Loader2 size={40} className="text-red-600 animate-spin mb-4" />
        <p className="font-black text-gray-900 italic uppercase tracking-widest">Twosome Cloud Connecting...</p>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-500">
          <div className="inline-block p-4 bg-red-600 rounded-3xl text-white"><Store size={44} /></div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Twosome Pro</h1>
          <p className="text-gray-400 font-bold text-sm leading-relaxed">매장 코드를 입력하여 시작하세요.</p>
          <input 
            type="text" placeholder="매장 코드 입력" 
            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-red-600 font-black text-center text-xl uppercase tracking-widest"
            onChange={e => localStorage.setItem('twosome_temp_id', e.target.value)}
          />
          <button onClick={() => {
            const id = localStorage.getItem('twosome_temp_id')?.trim().toLowerCase();
            if(id) { 
              localStorage.setItem('twosome_store_id', id); 
              window.location.reload(); 
            }
          }} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all">연동 시작</button>
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
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem('twosome_session', JSON.stringify(user));
        }} 
        onForceSync={() => syncWithServer('GET')}
        onUpdateUsers={(users) => handleUpdate('users', users)}
        onReset={() => { if(confirm('매장 코드를 재설정하시겠습니까?')) { localStorage.clear(); window.location.reload(); } }}
      />
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navigation 
          user={currentUser} 
          storeId={storeId} 
          syncStatus={syncStatus} 
          lastSyncTime={lastSyncTime}
          onLogout={() => { if(confirm('로그아웃 하시겠습니까?')) { localStorage.removeItem('twosome_session'); setCurrentUser(null); } }} 
          onShowDoctor={() => setShowDoctor(true)}
        />
        <main className="flex-1 pt-20 pb-24 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/notice" element={<NoticeBoard currentUser={currentUser} data={appData.notices} onUpdate={(items) => handleUpdate('notices', items)} />} />
            <Route path="/handover" element={<HandoverBoard currentUser={currentUser} data={appData.handovers} onUpdate={(items) => handleUpdate('handovers', items)} />} />
            <Route path="/checklist" element={<ChecklistBoard currentUser={currentUser} data={appData.tasks} onUpdate={(items) => handleUpdate('tasks', items)} onReportSubmit={(r) => handleUpdate('reports', [...appData.reports, r])} />} />
            <Route path="/attendance" element={<AttendanceCalendar currentUser={currentUser} allUsers={appData.users} reports={appData.reports} onUpdate={(items) => handleUpdate('reports', items)} />} />
            <Route path="/inventory" element={<InventoryManagement currentUser={currentUser} data={appData.inventory} onUpdate={(items) => handleUpdate('inventory', items)} />} />
            <Route path="/recipe" element={<RecipeManual currentUser={currentUser} data={appData.recipes} onUpdate={(items) => handleUpdate('recipes', items)} />} />
            <Route path="/reservation" element={<ReservationManagement currentUser={currentUser} data={appData.reservations} onUpdate={(items) => handleUpdate('reservations', items)} />} />
            <Route path="/admin" element={<OwnerAdmin appData={appData} onUpdate={handleUpdate} onStoreIdUpdate={(id) => {localStorage.setItem('twosome_store_id', id); window.location.reload();}} onForceUpload={() => syncWithServer('POST', appData)} />} />
            <Route path="*" element={<Navigate to="/notice" />} />
          </Routes>
        </main>
        {showDoctor && <ConnectionDoctor storeId={storeId} syncStatus={syncStatus} lastSyncTime={lastSyncTime} onManualSync={() => syncWithServer('GET')} onClose={() => setShowDoctor(false)} />}
      </div>
    </HashRouter>
  );
};

export default App;
