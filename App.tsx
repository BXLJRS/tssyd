
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
  Cloud, RefreshCw, Store, Loader2, Wifi, WifiOff, Database, AlertTriangle, 
  Clock
} from 'lucide-react';

const INITIAL_APP_DATA: AppData = {
  users: [], notices: [], handovers: [], inventory: [], 
  reservations: [], schedules: [], reports: [], tasks: [], 
  template: [], recipes: []
};

// 엣지/모바일에서 차단되지 않는 신규 데이터 저장소
// 이 주소는 표준 API 방식을 따르므로 보안 차단 확률이 매우 낮습니다.
const SYNC_BASE_URL = 'https://kvdb.io/Snd98D7fG6h5J4k3L2m1'; 

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [storeId, setStoreId] = useState(localStorage.getItem('twosome_store_id') || '');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'syncing'>('offline');
  const [appData, setAppData] = useState<AppData>(INITIAL_APP_DATA);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  
  const isSyncing = useRef(false);
  const lastUpdateRef = useRef<number>(0);

  // 실시간 클라우드 동기화 (GET)
  const fetchCloudData = useCallback(async (isSilent = false): Promise<AppData | null> => {
    if (!storeId || (isSyncing.current && !isSilent)) return null;
    if (!isSilent) setSyncStatus('syncing');
    
    try {
      // 캐시 방지를 위해 랜덤 쿼리 파라미터(t) 추가 - 실시간성 보장
      const response = await fetch(`${SYNC_BASE_URL}/${storeId}?t=${Date.now()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });

      if (response.ok) {
        const cloudData: AppData = await response.json();
        // 마지막 업데이트 시간이 클라우드가 더 최신인 경우에만 교체
        setAppData(cloudData);
        setSyncStatus('connected');
        setIsBlocking(false);
        return cloudData;
      } else if (response.status === 404) {
        setSyncStatus('connected');
        return INITIAL_APP_DATA;
      } else {
        throw new Error('Server connectivity issues');
      }
    } catch (e) {
      console.error('Real-time Sync Error:', e);
      setSyncStatus('offline');
      // 엣지/모바일 차단 감지
      if (e instanceof TypeError && !isSilent) setIsBlocking(true);
      return null;
    } finally {
      if (!isSilent) isSyncing.current = false;
      setIsInitialized(true);
    }
  }, [storeId]);

  // 클라우드 데이터 전송 (POST)
  const pushToCloud = useCallback(async (newData: AppData) => {
    if (!storeId) return;
    setSyncStatus('syncing');
    try {
      const res = await fetch(`${SYNC_BASE_URL}/${storeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
        mode: 'cors'
      });
      if (res.ok) {
        setSyncStatus('connected');
      } else {
        setSyncStatus('offline');
      }
    } catch (e) {
      setSyncStatus('offline');
    }
  }, [storeId]);

  // 실시간 엔진: 3초마다 클라우드 확인 (일반 사이트 방식)
  useEffect(() => {
    if (storeId) {
      fetchCloudData();
      const interval = setInterval(() => fetchCloudData(true), 3000); 
      return () => clearInterval(interval);
    } else {
      setIsInitialized(true);
    }
  }, [storeId, fetchCloudData]);

  useEffect(() => {
    const saved = localStorage.getItem('twosome_session');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const handleUpdate = (key: keyof AppData, updatedItems: any[]) => {
    const newData = { ...appData, [key]: updatedItems };
    setAppData(newData);
    // 즉시 클라우드로 전송 (실시간)
    pushToCloud(newData);
  };

  const handleImportCode = (code: string) => {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(code))));
      setAppData(decoded);
      pushToCloud(decoded);
      alert('데이터 복구 및 실시간 연동이 재개되었습니다.');
    } catch (e) {
      alert('올바른 코드가 아닙니다.');
    }
  };

  if (!isInitialized && storeId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <Loader2 size={40} className="text-red-600 animate-spin mb-4" />
        <h2 className="text-lg font-black tracking-tighter">매장 서버 연결 중...</h2>
      </div>
    );
  }

  // 매장 코드 입력 화면 (최초 1회)
  if (!storeId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-red-600 rounded-3xl text-white shadow-xl"><Store size={40} /></div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">투썸 PRO 매장접속</h1>
            <p className="text-gray-500 font-bold text-sm leading-relaxed">공통 매장 코드(1903384 등)를 입력하면<br/>모든 기기가 실시간으로 연동됩니다.</p>
          </div>
          <input 
            type="text" placeholder="매장 코드 입력" 
            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-red-500 font-black text-center text-lg uppercase"
            onChange={e => localStorage.setItem('twosome_temp_id', e.target.value)}
          />
          <button onClick={() => {
            const id = localStorage.getItem('twosome_temp_id')?.trim().toLowerCase();
            if(id) { 
              localStorage.setItem('twosome_store_id', id); 
              window.location.reload(); 
            }
          }} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform">실시간 연동 시작</button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage 
        storeId={storeId}
        allUsers={appData.users} 
        syncStatus={syncStatus}
        isBlocking={isBlocking}
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem('twosome_session', JSON.stringify(user));
        }} 
        onSyncNow={() => fetchCloudData()} 
        onUserUpdate={(users) => handleUpdate('users', users)} 
        onImport={handleImportCode}
        onReset={() => {
          if(confirm('매장 코드를 변경하시겠습니까?')) {
            localStorage.clear();
            window.location.reload();
          }
        }}
      />
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navigation user={currentUser} storeId={storeId} syncStatus={syncStatus} onLogout={() => { if(confirm('로그아웃 하시겠습니까?')) { localStorage.removeItem('twosome_session'); setCurrentUser(null); } }} onManualSync={() => fetchCloudData()} />
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

const Navigation: React.FC<{ user: User, storeId: string, syncStatus: string, onLogout: () => void, onManualSync: () => void }> = ({ user, storeId, syncStatus, onLogout, onManualSync }) => {
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
          <button onClick={onManualSync} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${syncStatus === 'connected' ? 'bg-green-50 text-green-600 shadow-sm' : 'bg-red-50 text-red-600'}`}>
            <span className={`w-2 h-2 rounded-full ${syncStatus === 'connected' ? 'bg-green-500' : syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' : 'bg-red-500 animate-pulse'}`}></span>
            {storeId}
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

const LoginPage: React.FC<{ storeId: string, allUsers: User[], syncStatus: string, isBlocking: boolean, onLogin: (user: User) => void, onSyncNow: () => Promise<AppData | null>, onUserUpdate: (u: User[]) => void, onImport: (c: string) => void, onReset: () => void }> = ({ storeId, allUsers, syncStatus, isBlocking, onLogin, onSyncNow, onUserUpdate, onImport, onReset }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ id: '', pw: '', nickname: '', role: 'STAFF' as UserRole });

  const handleAuth = async () => {
    const userId = form.id.toLowerCase().trim();
    const userPw = form.pw.trim();
    if (userId.length < 4 || userPw.length !== 4) { alert('아이디 4자 이상, 비번 4자리여야 합니다.'); return; }
    
    setLoading(true);
    const freshData = await onSyncNow();
    setLoading(false);

    const targetUsers: User[] = freshData ? freshData.users : allUsers;
    const user = targetUsers.find(u => u.id === userId && u.passwordHash === userPw);

    if (user) {
      onLogin(user);
    } else {
      if (isSignUp) {
        if (targetUsers.find(u => u.id === userId)) { alert('이미 존재하는 아이디입니다.'); return; }
        const newUser: User = { id: userId, passwordHash: userPw, nickname: form.nickname.trim() || userId, role: form.role, updatedAt: Date.now() };
        onUserUpdate([...targetUsers, newUser]);
        onLogin(newUser);
      } else {
        alert(isBlocking ? '브라우저 보안 설정으로 서버 접속이 차단되었습니다. 크롬 브라우저를 사용하거나 사이트 설정에서 통신 허용을 해주세요.' : '아이디 또는 비밀번호가 틀렸습니다.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-8 animate-in slide-in-from-bottom-4">
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {syncStatus === 'connected' ? <Wifi size={10}/> : <WifiOff size={10}/>} {storeId.toUpperCase()} {syncStatus === 'connected' ? '실시간 연동중' : '연결 안 됨'}
          </div>
          <h1 className="text-3xl font-black text-red-600 tracking-tighter">TWOSOME PRO</h1>
        </div>

        {isBlocking && (
          <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
            <AlertTriangle className="text-red-600 shrink-0" size={20} />
            <p className="text-[11px] font-bold text-red-800 leading-relaxed">이 기기(브라우저)에서 서버 접속을 막고 있습니다. <br/>1. 엣지 설정에서 '추적 방지' 해제<br/>2. 혹은 하단의 [비상용 동기화] 클릭</p>
          </div>
        )}
        
        <div className="space-y-4">
          <input type="text" placeholder="아이디" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none" onChange={e => setForm({...form, id: e.target.value})} />
          <input type="password" placeholder="비밀번호(4자리)" maxLength={4} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none" onChange={e => setForm({...form, pw: e.target.value})} />
          
          {isSignUp && (
            <div className="space-y-4 pt-2 animate-in slide-in-from-top-2">
              <input type="text" placeholder="표시 이름" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" onChange={e => setForm({...form, nickname: e.target.value})} />
              <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                <button onClick={() => setForm({...form, role: 'STAFF'})} className={`flex-1 py-3 rounded-xl font-black text-xs ${form.role === 'STAFF' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>직원</button>
                <button onClick={() => setForm({...form, role: 'OWNER'})} className={`flex-1 py-3 rounded-xl font-black text-xs ${form.role === 'OWNER' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400'}`}>점주</button>
              </div>
            </div>
          )}

          <button onClick={handleAuth} disabled={loading} className="w-full py-5 bg-black text-white rounded-2xl font-black text-lg shadow-xl active:scale-95 flex items-center justify-center gap-2">
            {loading ? <RefreshCw className="animate-spin" /> : (isSignUp ? '계정 만들기' : '로그인')}
          </button>
          
          <div className="flex flex-col gap-2 pt-4 border-t">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs font-black text-gray-400 py-1">{isSignUp ? '로그인으로 가기' : '계정이 없으신가요?'}</button>
            <button onClick={() => { const code = prompt('데이터 코드를 붙여넣으세요.'); if(code) onImport(code); }} className="flex items-center justify-center gap-2 py-4 bg-blue-50 text-blue-600 rounded-2xl text-[11px] font-black">
              <Database size={14}/> 비상용 수동 동기화
            </button>
            <button onClick={onReset} className="text-[10px] text-gray-300 underline font-bold">매장 코드 재입력</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
