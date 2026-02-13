
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
import { 
  LogOut, Megaphone, ClipboardList, CheckSquare, 
  Calendar, Package, ShieldAlert, BookOpen, 
  Cloud, CloudOff, RefreshCw, Store, Loader2, AlertCircle, Wifi, WifiOff
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

const KVDB_BASE_URL = 'https://kvdb.io/ANvV448oU6Q4H6H3N7j2y2';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [storeId, setStoreId] = useState(localStorage.getItem('twosome_store_id') || '');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'syncing'>('offline');
  const [appData, setAppData] = useState<AppData>(INITIAL_APP_DATA);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  
  const isSyncing = useRef(false);
  const hasLoadedFromCloud = useRef(false);

  // 최신 데이터 병합 로직
  const smartMerge = (local: AppData, cloud: AppData): AppData => {
    const merged: any = { ...INITIAL_APP_DATA };
    (Object.keys(DATA_KEYS) as (keyof AppData)[]).forEach(key => {
      const localItems = local[key] || [];
      const cloudItems = cloud[key] || [];
      
      // 새 기기인 경우 클라우드 데이터 전면 수용
      if (localItems.length === 0) {
        merged[key] = cloudItems;
        return;
      }

      const allIds = Array.from(new Set([...localItems.map((i:any) => i.id), ...cloudItems.map((i:any) => i.id)]));
      merged[key] = allIds.map(id => {
        const localItem = localItems.find((i:any) => i.id === id);
        const cloudItem = cloudItems.find((i:any) => i.id === id);
        if (!localItem) return cloudItem;
        if (!cloudItem) return localItem;
        return (localItem.updatedAt || 0) >= (cloudItem.updatedAt || 0) ? localItem : cloudItem;
      });
    });
    return merged as AppData;
  };

  const fetchCloud = useCallback(async (isSilent = false): Promise<AppData | null> => {
    if (!storeId || (isSyncing.current && !isSilent)) return null;
    isSyncing.current = true;
    if (!isSilent) setSyncStatus('syncing');

    try {
      const res = await fetch(`${KVDB_BASE_URL}/${storeId}?nocache=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
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
        
        hasLoadedFromCloud.current = true;
        setSyncStatus('connected');
        setLastSyncTime(Date.now());
        return merged;
      } else if (res.status === 404) {
        hasLoadedFromCloud.current = true;
        setSyncStatus('connected');
        return INITIAL_APP_DATA;
      } else {
        throw new Error('Server returned error');
      }
    } catch (e) {
      console.error('Fetch error:', e);
      setSyncStatus('offline');
      return null;
    } finally {
      isSyncing.current = false;
      setIsInitialized(true);
    }
  }, [storeId]);

  const pushCloud = useCallback(async (newData: AppData) => {
    if (!storeId || !hasLoadedFromCloud.current) return;
    setSyncStatus('syncing');
    try {
      const res = await fetch(`${KVDB_BASE_URL}/${storeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
      if (res.ok) {
        setSyncStatus('connected');
        setLastSyncTime(Date.now());
      } else {
        setSyncStatus('offline');
      }
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
      setIsInitialized(true);
    }
  }, [storeId, fetchCloud]);

  useEffect(() => {
    const saved = localStorage.getItem('twosome_session');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const handleUpdate = (key: keyof AppData, updatedItems: any[]) => {
    const newData = { ...appData, [key]: updatedItems };
    setAppData(newData);
    localStorage.setItem(DATA_KEYS[key], JSON.stringify(updatedItems));
    pushCloud(newData);
  };

  if (!isInitialized && storeId) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <Loader2 size={48} className="text-red-600 animate-spin mb-6" />
        <h2 className="text-xl font-black text-gray-900">서버 데이터 동기화 중</h2>
        <p className="text-gray-400 font-bold text-sm mt-2">이 화면이 10초 이상 지속되면 인터넷 연결을 확인하세요.</p>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-300">
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-red-600 rounded-3xl text-white shadow-xl"><Store size={40} /></div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">매장 연결</h1>
            <p className="text-gray-500 font-bold text-sm leading-relaxed text-balance">모든 기기에서 동일한<br/>[매장 코드]를 사용해야 연동됩니다.</p>
          </div>
          <input 
            type="text" placeholder="매장 코드 입력 (예: twosome123)" 
            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-red-500 font-black text-center text-lg uppercase"
            onChange={e => localStorage.setItem('twosome_temp_id', e.target.value)}
          />
          <button onClick={() => {
            const id = localStorage.getItem('twosome_temp_id')?.trim().toLowerCase();
            if(id) { 
              localStorage.setItem('twosome_store_id', id); 
              window.location.reload(); 
            }
          }} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform">동기화 시작하기</button>
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
        lastSyncTime={lastSyncTime}
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem('twosome_session', JSON.stringify(user));
        }} 
        onSyncForce={fetchCloud} 
        onUserUpdate={(users) => handleUpdate('users', users)} 
        onResetStore={() => {
          if(confirm('매장 코드를 변경하면 기존 데이터와 연결이 끊깁니다. 변경하시겠습니까?')) {
            localStorage.removeItem('twosome_store_id');
            localStorage.clear(); // 데이터 꼬임 방지를 위해 로컬 캐시 전체 삭제
            window.location.reload();
          }
        }}
      />
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navigation user={currentUser} storeId={storeId} syncStatus={syncStatus} onLogout={() => {
          if(confirm('로그아웃 하시겠습니까?')) {
            localStorage.removeItem('twosome_session');
            setCurrentUser(null);
          }
        }} onManualSync={() => fetchCloud()} />
        <main className="flex-1 pt-20 pb-24 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto w-full">
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

// 상단 네비게이션 컴포넌트
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
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-red-600 tracking-tighter shrink-0">TWOSOME</h1>
          <button onClick={onManualSync} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : syncStatus === 'syncing' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
            {syncStatus === 'syncing' ? <RefreshCw size={12} className="animate-spin" /> : syncStatus === 'connected' ? <Cloud size={12} /> : <CloudOff size={12} />}
            {storeId}
          </button>
        </div>
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className={`px-3 lg:px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${location.pathname === item.path ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
              <item.icon size={16} /> <span className="hidden lg:inline">{item.label}</span>
            </Link>
          ))}
          {user.role === 'OWNER' && <Link to="/admin" className={`px-3 lg:px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${location.pathname === '/admin' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}><ShieldAlert size={16} /><span>관리</span></Link>}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-[10px] font-black text-gray-300 uppercase mb-1">{user.role}</span>
            <span className="text-xs font-bold text-gray-900 leading-none">{user.nickname}님</span>
          </div>
          <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><LogOut size={22} /></button>
        </div>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden">
        {navItems.map(item => (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 w-full transition-colors ${location.pathname === item.path ? 'text-red-600' : 'text-gray-300'}`}>
            <item.icon size={20} strokeWidth={location.pathname === item.path ? 3 : 2} />
            <span className="text-[9px] font-black">{item.label.slice(0, 2)}</span>
          </Link>
        ))}
        {user.role === 'OWNER' && <Link to="/admin" className={`flex flex-col items-center gap-1 w-full transition-colors ${location.pathname === '/admin' ? 'text-red-600' : 'text-gray-300'}`}><ShieldAlert size={20} /><span className="text-[9px] font-black">관리</span></Link>}
      </nav>
    </>
  );
};

// 로그인 페이지 컴포넌트
const LoginPage: React.FC<{ 
  storeId: string,
  allUsers: User[], 
  syncStatus: string,
  lastSyncTime: number,
  onLogin: (user: User) => void, 
  onSyncForce: () => Promise<AppData | null>,
  onUserUpdate: (u: User[]) => void,
  onResetStore: () => void
}> = ({ storeId, allUsers, syncStatus, lastSyncTime, onLogin, onSyncForce, onUserUpdate, onResetStore }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ id: '', pw: '', nickname: '', role: 'STAFF' as UserRole });

  const handleAuth = async () => {
    const userId = form.id.toLowerCase().trim();
    const userPw = form.pw.trim();
    if (userId.length < 4 || userPw.length !== 4) { alert('아이디 4자 이상, 비번 4자리여야 합니다.'); return; }
    
    setLoading(true);
    // 로그인 직전 강제 동기화 (노트북 계정 가져오기 핵심)
    const freshData = await onSyncForce();
    setLoading(false);

    if (!freshData && syncStatus === 'offline') {
      alert('현재 서버와 연결이 원활하지 않습니다. 인터넷 연결을 확인해주세요.');
      return;
    }

    const latestUsers = freshData ? freshData.users : allUsers;

    if (isSignUp) {
      if (latestUsers.find(u => u.id === userId)) { alert('이미 존재하는 아이디입니다.'); return; }
      const newUser = { id: userId, passwordHash: userPw, nickname: form.nickname.trim() || userId, role: form.role, updatedAt: Date.now() };
      onUserUpdate([...latestUsers, newUser]);
      onLogin(newUser);
    } else {
      const user = latestUsers.find(u => u.id === userId && u.passwordHash === userPw);
      if (user) {
        onLogin(user);
      } else {
        alert('아이디 또는 비밀번호가 틀립니다.\n만약 노트북에서 방금 만드셨다면 [서버 연결 확인] 버튼을 누른 뒤 3초 후에 다시 시도하세요.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black mb-4 ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {syncStatus === 'connected' ? <Wifi size={10}/> : <WifiOff size={10}/>}
            {storeId.toUpperCase()} 매장 - {syncStatus === 'connected' ? '연결됨' : '연결 안됨'}
            <button onClick={onResetStore} className="ml-1 text-red-500 underline">코드변경</button>
          </div>
          <h1 className="text-3xl font-black text-red-600 mb-2">TWOSOME PRO</h1>
          <p className="text-xs font-black text-gray-300 uppercase tracking-widest leading-none">Management Solution</p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">아이디</label>
            <input type="text" placeholder="ID 입력" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:border-red-500" onChange={e => setForm({...form, id: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">비밀번호 (4자리)</label>
            <input type="password" placeholder="PIN 번호" maxLength={4} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:border-red-500" onChange={e => setForm({...form, pw: e.target.value})} />
          </div>
          
          {isSignUp && (
            <div className="space-y-4 pt-2 border-t border-gray-50 animate-in slide-in-from-top-2">
              <input type="text" placeholder="표시될 이름" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none focus:border-red-500" onChange={e => setForm({...form, nickname: e.target.value})} />
              <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
                <button onClick={() => setForm({...form, role: 'STAFF'})} className={`flex-1 py-3 rounded-xl font-black text-xs ${form.role === 'STAFF' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>직원</button>
                <button onClick={() => setForm({...form, role: 'OWNER'})} className={`flex-1 py-3 rounded-xl font-black text-xs ${form.role === 'OWNER' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400'}`}>점주</button>
              </div>
            </div>
          )}

          <button onClick={handleAuth} disabled={loading} className="w-full py-5 bg-black text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl disabled:bg-gray-200">
            {loading ? <Loader2 className="animate-spin" size={24} /> : (isSignUp ? '계정 생성' : '로그인')}
          </button>
          
          <div className="flex flex-col gap-2">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs font-black text-gray-400 py-1 hover:text-red-500 transition-colors uppercase">
              {isSignUp ? '로그인으로 돌아가기' : '계정 새로 만들기'}
            </button>
            <button 
              onClick={async () => {
                setLoading(true);
                await onSyncForce();
                setLoading(false);
                alert('최신 정보를 불러왔습니다. 로그인을 시도하세요.');
              }} 
              className="flex items-center justify-center gap-1 text-[10px] font-black text-red-400 bg-red-50 py-3 rounded-xl hover:bg-red-100 transition-colors"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> 
              서버 연결 확인 및 계정 불러오기
            </button>
          </div>
        </div>
        
        {lastSyncTime > 0 && (
          <p className="text-[9px] text-center text-gray-300 font-bold">마지막 서버 연결: {new Date(lastSyncTime).toLocaleTimeString()}</p>
        )}
      </div>
    </div>
  );
};

export default App;
