
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { User, UserRole, AppData, DailyReport, InventoryItem } from './types';
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
    { path: '/checklist', label: '업무', icon: CheckSquare },
    { path: '/recipe', label: '레시피', icon: Book },
    { path: '/inventory', label: '재고', icon: Package },
    { path: '/attendance', label: '근무표', icon: Calendar },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-red-600 tracking-tighter">TWOSOME</h1>
          <button onClick={onManualSync} className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : syncStatus === 'syncing' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
            {syncStatus === 'syncing' ? <RefreshCw size={10} className="animate-spin" /> : syncStatus === 'connected' ? <Cloud size={10} /> : <CloudOff size={10} />}
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
            <item.icon size={20} />
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
  const [browserType, setBrowserType] = useState<'standard' | 'inapp'>('standard');
  const [tempInputId, setTempInputId] = useState('');

  const isSyncing = useRef(false);
  const canWrite = useRef(false);

  // 1. 브라우저 체크 및 세션 로드
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('kakao') || ua.includes('instagram') || ua.includes('fbav')) {
      setBrowserType('inapp');
    }
    const saved = localStorage.getItem('twosome_session');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  // 2. 동기화 핵심 로직 (병합 & 보호)
  const syncData = useCallback(async (isManual = false) => {
    if (!storeId || isSyncing.current) return;
    isSyncing.current = true;
    setSyncStatus('syncing');

    try {
      const res = await fetch(`https://kvdb.io/ANvV448oU6Q4H6H3N7j2y2/${storeId}?t=${Date.now()}`);
      let cloudData: Partial<AppData> = {};
      
      if (res.ok) {
        cloudData = await res.json();
        canWrite.current = true; // 서버에 데이터가 있음을 확인 -> 쓰기 가능
      } else if (res.status === 404) {
        canWrite.current = true; // 신규 매장임 -> 쓰기 가능
      } else {
        throw new Error("Server error");
      }

      // 로컬 데이터와 병합
      const keys = Object.keys(DATA_KEYS) as (keyof AppData)[];
      const mergedData: any = {};

      keys.forEach(key => {
        const localItems = JSON.parse(localStorage.getItem(DATA_KEYS[key]) || '[]');
        const cloudItems = cloudData[key] || [];
        
        // 아이디 유실 방지: 클라우드에 데이터가 있으면 로컬보다 우선함 (신규 직원 기기 복구용)
        let merged = [...cloudItems, ...localItems].filter((v, i, a) => 
          a.findIndex(t => t.id === v.id) === i
        );

        localStorage.setItem(DATA_KEYS[key], JSON.stringify(merged));
        mergedData[key] = merged;
      });

      // 서버에 업로드 (데이터가 바뀌었거나 수동일 때)
      if (canWrite.current) {
        await fetch(`https://kvdb.io/ANvV448oU6Q4H6H3N7j2y2/${storeId}`, {
          method: 'POST',
          body: JSON.stringify(mergedData),
        });
      }

      setSyncStatus('connected');
      setIsReady(true);
    } catch (e) {
      console.error("Sync failed", e);
      setSyncStatus('offline');
      // 이미 로컬에 데이터가 있다면 오프라인 모드로 진입 허용
      if (localStorage.getItem(DATA_KEYS.users)) setIsReady(true);
    } finally {
      isSyncing.current = false;
    }
  }, [storeId]);

  // 주기적 동기화 (15초)
  useEffect(() => {
    if (storeId) {
      syncData();
      const timer = setInterval(() => syncData(), 15000);
      return () => clearInterval(timer);
    } else {
      setIsReady(true);
    }
  }, [storeId, syncData]);

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('twosome_session');
      setCurrentUser(null);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('주소가 복사되었습니다! 크롬이나 사파리를 열어 붙여넣으세요.');
  };

  // [화면 1] 인앱 브라우저 경고
  if (browserType === 'inapp') {
    return (
      <div className="min-h-screen bg-red-600 flex items-center justify-center p-8 text-white text-center">
        <div className="max-w-xs space-y-6">
          <AlertTriangle size={64} className="mx-auto animate-bounce" />
          <h1 className="text-2xl font-black tracking-tighter">브라우저 경고</h1>
          <p className="font-bold text-sm leading-relaxed opacity-90">
            카카오톡 내부 브라우저에서는<br/>데이터 저장 및 동기화가 불안정합니다.
          </p>
          <div className="bg-white/10 p-6 rounded-[2rem] space-y-4">
            <p className="text-xs font-medium">아래 버튼을 눌러 주소를 복사한 뒤,<br/><strong>크롬(Chrome)</strong> 앱에 붙여넣으세요.</p>
            <button onClick={copyToClipboard} className="w-full py-4 bg-white text-red-600 rounded-2xl font-black flex items-center justify-center gap-2">
              <Copy size={18} /> 주소 복사하기
            </button>
          </div>
          <button onClick={() => setBrowserType('standard')} className="text-xs font-bold opacity-50 underline">무시하고 계속하기 (추천하지 않음)</button>
        </div>
      </div>
    );
  }

  // [화면 2] 초기 동기화 대기
  if (!isReady && storeId) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="text-red-600 animate-spin mb-6" size={48} />
        <h2 className="text-xl font-black text-gray-900 tracking-tighter">매장 데이터 연결 중...</h2>
        <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest leading-relaxed">
          데이터 보호를 위해 서버 정보를 확인하고 있습니다.<br/>잠시만 기다려주세요.
        </p>
      </div>
    );
  }

  // [화면 3] 매장 코드 설정
  if (!storeId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-red-600 rounded-3xl text-white shadow-xl"><Store size={40} /></div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">매장 연결</h1>
            <p className="text-gray-500 font-bold text-sm leading-relaxed">매장 점주님께 전달받은<br/>고유 코드를 입력하세요.</p>
          </div>
          <input 
            type="text" placeholder="매장 코드를 입력하세요" 
            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-red-500 font-black text-center text-lg uppercase"
            value={tempInputId} onChange={e => setTempInputId(e.target.value)}
          />
          <button onClick={() => {
            const id = tempInputId.trim().toLowerCase().replace(/\s/g, '');
            if(id.length > 3) { localStorage.setItem('twosome_store_id', id); setStoreId(id); window.location.reload(); }
          }} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl">연결하기</button>
        </div>
      </div>
    );
  }

  // [화면 4] 로그인
  if (!currentUser) {
    return <LoginPage onLogin={(user) => {
      setCurrentUser(user);
      localStorage.setItem('twosome_session', JSON.stringify(user));
      syncData(true);
    }} onUpdate={() => syncData(true)} />;
  }

  // [화면 5] 메인 앱 루프
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navigation user={currentUser} storeId={storeId} syncStatus={syncStatus} onLogout={handleLogout} onManualSync={() => syncData(true)} />
        <main className="flex-1 pt-20 pb-24 px-4 max-w-4xl mx-auto w-full">
          {syncStatus === 'offline' && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black flex items-center gap-2">
              <CloudOff size={14}/> 서버 연결이 끊겼습니다. (오프라인 모드)
            </div>
          )}
          <Routes>
            <Route path="/notice" element={<NoticeBoard currentUser={currentUser} onUpdate={() => syncData(true)} />} />
            <Route path="/handover" element={<HandoverBoard currentUser={currentUser} onUpdate={() => syncData(true)} />} />
            <Route path="/checklist" element={<ChecklistBoard currentUser={currentUser} onUpdate={() => syncData(true)} />} />
            <Route path="/attendance" element={<AttendanceCalendar currentUser={currentUser} allUsers={JSON.parse(localStorage.getItem('twosome_users') || '[]')} onUpdate={() => syncData(true)} />} />
            <Route path="/reservation" element={<ReservationManagement currentUser={currentUser} onUpdate={() => syncData(true)} />} />
            <Route path="/inventory" element={<InventoryManagement currentUser={currentUser} onUpdate={() => syncData(true)} />} />
            <Route path="/recipe" element={<RecipeManual currentUser={currentUser} onUpdate={() => syncData(true)} />} />
            {currentUser.role === 'OWNER' && <Route path="/admin" element={<OwnerAdmin onStoreIdUpdate={(id) => {localStorage.setItem('twosome_store_id', id); window.location.reload();}} />} />}
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
    if (id.length < 4 || pw.length !== 4) { alert('아이디 4자 이상, 비밀번호 4자리여야 합니다.'); return; }
    await onUpdate(); // 최신 유저 정보를 가져오기 위해 강제 동기화
    const users = JSON.parse(localStorage.getItem('twosome_users') || '[]');
    
    if (isSignUp) {
      if (role === 'OWNER' && !['kms3191', 'ksk545'].includes(id)) { alert('승인된 점주 아이디가 아닙니다.'); return; }
      if (users.find((u: User) => u.id === id)) { alert('이미 존재하는 아이디입니다.'); return; }
      const newUser = { id, passwordHash: pw, nickname, role };
      localStorage.setItem('twosome_users', JSON.stringify([...users, newUser]));
      onLogin(newUser);
    } else {
      const user = users.find((u: User) => u.id === id && u.passwordHash === pw);
      if (user) onLogin(user);
      else alert('아이디/비밀번호가 틀렸거나 아직 데이터가 동기화되지 않았습니다. 잠시 후 다시 시도하세요.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-block p-4 bg-red-600 rounded-2xl text-white shadow-lg mb-2"><Home size={32} /></div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Twosome Connect</h1>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="아이디" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={id} onChange={e => setId(e.target.value.toLowerCase())} />
          <input type="password" placeholder="비밀번호 (4자리)" maxLength={4} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={pw} onChange={e => setPw(e.target.value.replace(/\D/g, ''))} />
          {isSignUp && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <input type="text" placeholder="본인 성함" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" value={nickname} onChange={e => setNickname(e.target.value)} />
              <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                <button onClick={() => setRole('STAFF')} className={`flex-1 py-3 rounded-xl font-black ${role === 'STAFF' ? 'bg-white shadow-sm' : 'text-gray-400'}`}>직원</button>
                <button onClick={() => setRole('OWNER')} className={`flex-1 py-3 rounded-xl font-black ${role === 'OWNER' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400'}`}>점주</button>
              </div>
            </div>
          )}
          <button onClick={handleAuth} className="w-full py-5 bg-black text-white rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-transform">
            {isSignUp ? '가입 및 시작' : '로그인'}
          </button>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-sm font-bold text-gray-400 py-2">{isSignUp ? '로그인하러 가기' : '계정이 없으신가요? 가입하기'}</button>
        </div>
      </div>
    </div>
  );
};

export default App;
