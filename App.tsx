
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
  Clock, Activity, ShieldAlert, CheckCircle2
} from 'lucide-react';

const INITIAL_APP_DATA: AppData = {
  users: [], notices: [], handovers: [], inventory: [], 
  reservations: [], schedules: [], reports: [], tasks: [], 
  template: [], recipes: []
};

// 범용적으로 사용 가능한 무료 키-밸류 저장소 엔드포인트
const DB_BASE = 'https://kvdb.io/Snd98D7fG6h5J4k3L2m1'; 

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [storeId, setStoreId] = useState(localStorage.getItem('twosome_store_id') || '');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'syncing'>('offline');
  const [appData, setAppData] = useState<AppData>(INITIAL_APP_DATA);
  const [isInitialized, setIsInitialized] = useState(false);
  const [latency, setLatency] = useState<number>(0);
  const [lastError, setLastError] = useState<string>('');
  const [showDoctor, setShowDoctor] = useState(false);
  
  const syncLock = useRef(false);

  // 서버 통신 엔진 (404 예외 처리 포함)
  const syncWithServer = useCallback(async (method: 'GET' | 'POST', payload?: AppData): Promise<AppData | null> => {
    if (!storeId) return null;
    const start = Date.now();
    const url = `${DB_BASE}/${storeId}`;
    
    try {
      setSyncStatus('syncing');
      const response = await fetch(url, {
        method,
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined
      });

      // 404가 뜨면 "서버는 살아있는데 데이터만 없는 것"이므로 연결 성공으로 간주
      if (response.status === 404 && method === 'GET') {
        console.log("New store detected, initializing...");
        setSyncStatus('connected');
        setLatency(Date.now() - start);
        // 데이터가 없으므로 서버에 초기 데이터를 한 번 쏴줍니다.
        await fetch(url, { method: 'POST', mode: 'cors', body: JSON.stringify(INITIAL_APP_DATA) });
        return INITIAL_APP_DATA;
      }

      if (response.ok) {
        const data = method === 'GET' ? await response.json() : payload;
        if (data) setAppData(data);
        setSyncStatus('connected');
        setLatency(Date.now() - start);
        setLastError('');
        return data;
      } else {
        throw new Error(`Server Response: ${response.status}`);
      }
    } catch (e: any) {
      console.error("Sync error:", e);
      setSyncStatus('offline');
      setLastError(e.message || '네트워크 연결 오류');
      return null;
    } finally {
      setIsInitialized(true);
    }
  }, [storeId]);

  // 실시간 폴링
  useEffect(() => {
    if (storeId) {
      syncWithServer('GET');
      const timer = setInterval(() => {
        if (!syncLock.current) syncWithServer('GET');
      }, 5000); // 부하를 줄이기 위해 5초로 변경
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
    const newData = { ...appData, [key]: updatedItems };
    setAppData(newData); // 즉시 로컬 반영 (낙관적 업데이트)
    
    syncLock.current = true;
    await syncWithServer('POST', newData);
    syncLock.current = false;
  };

  const handleManualImport = (code: string) => {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(code))));
      setAppData(decoded);
      syncWithServer('POST', decoded);
      alert('데이터가 서버에 강제로 덮어씌워졌습니다.');
    } catch (e) { alert('코드 형식이 잘못되었습니다.'); }
  };

  if (!isInitialized && storeId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <Loader2 size={40} className="text-red-600 animate-spin mb-4" />
        <p className="font-black text-gray-900">클라우드 데이터 불러오는 중...</p>
      </div>
    );
  }

  // 매장 접속 화면
  if (!storeId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-500 text-center">
          <div className="inline-block p-4 bg-red-600 rounded-3xl text-white shadow-xl mb-2"><Store size={44} /></div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">투썸 PRO 통합 연동</h1>
          <p className="text-gray-400 font-bold text-sm">기기 간 데이터를 공유하려면<br/>동일한 매장 코드를 사용하세요.</p>
          <input 
            type="text" placeholder="매장 코드 (예: 1903384)" 
            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-red-600 font-black text-center text-xl uppercase"
            onChange={e => localStorage.setItem('twosome_temp_id', e.target.value)}
          />
          <button onClick={() => {
            const id = localStorage.getItem('twosome_temp_id')?.trim().toLowerCase();
            if(id) { localStorage.setItem('twosome_store_id', id); window.location.reload(); }
          }} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all">온라인 매장 접속</button>
        </div>
      </div>
    );
  }

  // 로그인 화면
  if (!currentUser) {
    return (
      <LoginPage 
        storeId={storeId}
        appData={appData} 
        syncStatus={syncStatus}
        latency={latency}
        lastError={lastError}
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem('twosome_session', JSON.stringify(user));
        }} 
        onForceSync={() => syncWithServer('GET')}
        onUpdateUsers={(users) => handleUpdate('users', users)}
        onImport={handleManualImport}
        onReset={() => { localStorage.clear(); window.location.reload(); }}
        onShowDoctor={() => setShowDoctor(true)}
      />
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navigation user={currentUser} storeId={storeId} syncStatus={syncStatus} latency={latency} onLogout={() => { if(confirm('로그아웃?')) { localStorage.removeItem('twosome_session'); setCurrentUser(null); } }} onManualSync={() => syncWithServer('GET')} onShowDoctor={() => setShowDoctor(true)} />
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
        {showDoctor && <ConnectionDoctor storeId={storeId} syncStatus={syncStatus} lastError={lastError} onClose={() => setShowDoctor(false)} />}
      </div>
    </HashRouter>
  );
};

const Navigation: React.FC<{ user: User, storeId: string, syncStatus: string, latency: number, onLogout: () => void, onManualSync: () => void, onShowDoctor: () => void }> = ({ user, storeId, syncStatus, latency, onLogout, onManualSync, onShowDoctor }) => {
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
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black text-red-600 tracking-tighter shrink-0 italic">TWOSOME</h1>
          <button onClick={onShowDoctor} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600 animate-pulse'}`}>
            {syncStatus === 'connected' ? <Wifi size={12}/> : <WifiOff size={12}/>}
            {syncStatus === 'connected' ? `${latency}ms` : '연결안됨(진단)'}
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

const ConnectionDoctor: React.FC<{ storeId: string, syncStatus: string, lastError: string, onClose: () => void }> = ({ storeId, syncStatus, lastError, onClose }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
    <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 space-y-6">
      <div className="text-center space-y-2">
        <ShieldAlert size={48} className="mx-auto text-red-600 mb-2" />
        <h3 className="text-2xl font-black text-gray-900">연동 진단</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
          <div className="flex justify-between text-xs font-bold text-gray-400"><span>서버 타입</span> <span>KVDB.IO (Cloud)</span></div>
          <div className="flex justify-between text-xs font-bold text-gray-400"><span>매장 코드</span> <span className="text-red-600">{storeId.toUpperCase()}</span></div>
          <div className="flex justify-between text-xs font-bold text-gray-400"><span>연결 상태</span> <span className={syncStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>{syncStatus === 'connected' ? '정상' : '차단됨'}</span></div>
        </div>
        {lastError && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-[10px] font-bold">오류 내용: {lastError}</div>}
        <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-[10px] font-bold space-y-2">
          <p>💡 해결 방법:</p>
          <p>1. 404 에러는 "새 매장"을 의미하므로 무시하고 가입/로그인을 진행하면 자동으로 해결됩니다.</p>
          <p>2. OFFLINE일 경우, 브라우저 주소창 옆의 [자물쇠]를 눌러 '쿠키 및 사이트 데이터' 허용을 확인하세요.</p>
          <p>3. 사내 Wi-Fi 보안이 강력하면 막힐 수 있으니 LTE 환경에서 테스트해 보세요.</p>
        </div>
      </div>
      <button onClick={onClose} className="w-full py-5 bg-black text-white rounded-2xl font-black">진단창 닫기</button>
    </div>
  </div>
);

const LoginPage: React.FC<{ storeId: string, appData: AppData, syncStatus: string, latency: number, lastError: string, onLogin: (user: User) => void, onForceSync: () => Promise<AppData|null>, onUpdateUsers: (u: User[]) => void, onImport: (c: string) => void, onReset: () => void, onShowDoctor: () => void }> = ({ storeId, appData, syncStatus, latency, lastError, onLogin, onForceSync, onUpdateUsers, onImport, onReset, onShowDoctor }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ id: '', pw: '', nickname: '', role: 'STAFF' as UserRole });

  const handleAuth = async () => {
    const userId = form.id.toLowerCase().trim();
    const userPw = form.pw.trim();
    if (!userId || userPw.length !== 4) { alert('아이디와 비번(4자리)을 입력하세요.'); return; }
    
    setLoading(true);
    // 로그인 시도 시 강제 동기화 (최신 사용자 명단 확보)
    const freshData = await onForceSync();
    const currentUsers = freshData ? freshData.users : appData.users;

    const user = currentUsers.find(u => u.id === userId && u.passwordHash === userPw);

    if (user) {
      onLogin(user);
    } else if (isSignUp) {
      if (currentUsers.find(u => u.id === userId)) { alert('이미 있는 아이디입니다.'); setLoading(false); return; }
      const newUser: User = { id: userId, passwordHash: userPw, nickname: form.nickname || userId, role: form.role, updatedAt: Date.now() };
      onUpdateUsers([...currentUsers, newUser]);
      onLogin(newUser);
    } else {
      alert('아이디가 없거나 비번이 틀렸습니다.\n(실시간 연동 상태를 확인해 주세요)');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8">
        <div className="text-center space-y-2">
          <button onClick={onShowDoctor} className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600 animate-pulse'}`}>
            {syncStatus === 'connected' ? <Wifi size={14}/> : <WifiOff size={14}/>} 
            매장:{storeId.toUpperCase()} • {syncStatus === 'connected' ? '실시간 클라우드 연동 완료' : '서버 응답 확인 중 (진단)'}
          </button>
          <h1 className="text-4xl font-black text-red-600 tracking-tighter italic">TWOSOME PRO</h1>
        </div>

        <div className="space-y-4">
          <input type="text" placeholder="아이디" className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-red-600" onChange={e => setForm({...form, id: e.target.value})} />
          <input type="password" placeholder="비밀번호 (4자리)" maxLength={4} className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-red-600" onChange={e => setForm({...form, pw: e.target.value})} />
          
          {isSignUp && (
            <div className="space-y-4 pt-2 animate-in slide-in-from-top-4">
              <input type="text" placeholder="이름 (닉네임)" className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl font-bold" onChange={e => setForm({...form, nickname: e.target.value})} />
              <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
                <button onClick={() => setForm({...form, role: 'STAFF'})} className={`flex-1 py-3 rounded-xl font-black text-xs ${form.role === 'STAFF' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>직원</button>
                <button onClick={() => setForm({...form, role: 'OWNER'})} className={`flex-1 py-3 rounded-xl font-black text-xs ${form.role === 'OWNER' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400'}`}>점주</button>
              </div>
            </div>
          )}

          <button onClick={handleAuth} disabled={loading} className="w-full py-6 bg-black text-white rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 flex items-center justify-center gap-3 transition-all disabled:opacity-50">
            {loading ? <RefreshCw className="animate-spin" /> : (isSignUp ? '계정 생성 후 로그인' : '매장 서버 로그인')}
          </button>
          
          <div className="flex flex-col gap-3 pt-6 border-t border-gray-100 text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm font-black text-gray-400 hover:text-red-600">{isSignUp ? '로그인하러 가기' : '우리 매장 첫 이용인가요? (가입)'}</button>
            <div className="flex justify-center gap-4">
              <button onClick={() => { const code = prompt('코드를 입력하세요'); if(code) onImport(code); }} className="text-[10px] font-black text-blue-500 underline">수동 연동</button>
              <button onClick={onReset} className="text-[10px] font-black text-gray-300 underline uppercase">매장코드 재설정</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
