
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
  Cloud, CloudOff, RefreshCw, Store, Loader2, Wifi, WifiOff, Database
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
  
  const isSyncing = useRef(false);
  const hasLoadedAtLeastOnce = useRef(false);

  // 로컬 저장소에서 데이터 로드
  const loadLocal = useCallback(() => {
    const localData: any = {};
    (Object.keys(DATA_KEYS) as (keyof AppData)[]).forEach(key => {
      localData[key] = JSON.parse(localStorage.getItem(DATA_KEYS[key]) || '[]');
    });
    setAppData(localData as AppData);
    if (localData.users.length > 0) hasLoadedAtLeastOnce.current = true;
  }, []);

  const smartMerge = (local: AppData, cloud: AppData): AppData => {
    const merged: any = { ...INITIAL_APP_DATA };
    (Object.keys(DATA_KEYS) as (keyof AppData)[]).forEach(key => {
      const localItems = local[key] || [];
      const cloudItems = cloud[key] || [];
      if (localItems.length === 0) { merged[key] = cloudItems; return; }
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

  const fetchCloud = useCallback(async (isSilent = false) => {
    if (!storeId || (isSyncing.current && !isSilent)) return;
    isSyncing.current = true;
    if (!isSilent) setSyncStatus('syncing');

    try {
      const res = await fetch(`${KVDB_BASE_URL}/${storeId}?nocache=${Date.now()}`, {
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
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
        setSyncStatus('connected');
        hasLoadedAtLeastOnce.current = true;
      } else {
        setSyncStatus('offline');
      }
    } catch (e) {
      setSyncStatus('offline');
    } finally {
      isSyncing.current = false;
      setIsInitialized(true);
    }
  }, [storeId]);

  const pushCloud = useCallback(async (newData: AppData) => {
    if (!storeId) return;
    setSyncStatus('syncing');
    try {
      await fetch(`${KVDB_BASE_URL}/${storeId}`, {
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
    loadLocal();
    if (storeId) {
      fetchCloud();
      const interval = setInterval(() => fetchCloud(true), 20000);
      return () => clearInterval(interval);
    } else {
      setIsInitialized(true);
    }
  }, [storeId, fetchCloud, loadLocal]);

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

  const handleImportEmergencyCode = (code: string) => {
    try {
      const decoded = JSON.parse(atob(code));
      setAppData(decoded);
      (Object.keys(DATA_KEYS) as (keyof AppData)[]).forEach(key => {
        localStorage.setItem(DATA_KEYS[key], JSON.stringify(decoded[key]));
      });
      hasLoadedAtLeastOnce.current = true;
      alert('비상 코드로 데이터를 성공적으로 불러왔습니다!\n이제 로그인할 수 있습니다.');
    } catch (e) {
      alert('올바르지 않은 코드입니다. 다시 확인해주세요.');
    }
  };

  if (!isInitialized && storeId) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <Loader2 size={48} className="text-red-600 animate-spin mb-4" />
        <p className="font-black text-gray-900">데이터 연결 중...</p>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-300">
          <div className="text-center space-y-4">
            <div className="inline-block p-4 bg-red-600 rounded-3xl text-white shadow-xl"><Store size={40} /></div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">매장 코드 입력</h1>
            <p className="text-gray-500 font-bold text-sm leading-relaxed">모든 기기에서 동일한 코드를 입력하세요.</p>
          </div>
          <input 
            type="text" placeholder="예: twosome-신논현" 
            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-red-500 font-black text-center text-lg uppercase"
            onChange={e => localStorage.setItem('twosome_temp_id', e.target.value)}
          />
          <button onClick={() => {
            const id = localStorage.getItem('twosome_temp_id')?.trim().toLowerCase();
            if(id) { localStorage.setItem('twosome_store_id', id); window.location.reload(); }
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
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem('twosome_session', JSON.stringify(user));
        }} 
        onSyncForce={() => fetchCloud()} 
        onUserUpdate={(users) => handleUpdate('users', users)} 
        onImportCode={handleImportEmergencyCode}
        onResetStore={() => {
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
        <Navigation user={currentUser} storeId={storeId} syncStatus={syncStatus} onLogout={() => { if(confirm('로그아웃 하시겠습니까?')) { localStorage.removeItem('twosome_session'); setCurrentUser(null); } }} onManualSync={() => fetchCloud()} />
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

const Navigation: React.FC<{ user: User, storeId: string, syncStatus: string, onLogout: () => void, onManualSync: () => void }> = ({ user, storeId, syncStatus, onLogout, onManualSync }) => {
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
          <button onClick={onManualSync} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {syncStatus === 'connected' ? <Cloud size={12}/> : <CloudOff size={12}/>} {storeId}
          </button>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${location.pathname === item.path ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>{item.label}</Link>
          ))}
          {user.role === 'OWNER' && <Link to="/admin" className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${location.pathname === '/admin' ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-50'}`}>관리</Link>}
        </nav>
        <button onClick={onLogout} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><LogOut size={22} /></button>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex justify-around items-center z-50 md:hidden">
        {navItems.map(item => (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 w-full ${location.pathname === item.path ? 'text-red-600' : 'text-gray-300'}`}>
            <item.icon size={20} /> <span className="text-[9px] font-black">{item.label.slice(0, 2)}</span>
          </Link>
        ))}
      </nav>
    </>
  );
};

const LoginPage: React.FC<{ storeId: string, allUsers: User[], syncStatus: string, onLogin: (user: User) => void, onSyncForce: () => void, onUserUpdate: (u: User[]) => void, onImportCode: (c: string) => void, onResetStore: () => void }> = ({ storeId, allUsers, syncStatus, onLogin, onSyncForce, onUserUpdate, onImportCode, onResetStore }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ id: '', pw: '', nickname: '', role: 'STAFF' as UserRole });

  const handleAuth = () => {
    const userId = form.id.toLowerCase().trim();
    const userPw = form.pw.trim();
    if (userId.length < 4 || userPw.length !== 4) { alert('아이디 4자 이상, 비번 4자리여야 합니다.'); return; }
    
    const user = allUsers.find(u => u.id === userId && u.passwordHash === userPw);
    if (user) {
      onLogin(user);
    } else {
      if (isSignUp) {
        if (allUsers.find(u => u.id === userId)) { alert('이미 존재하는 아이디입니다.'); return; }
        const newUser = { id: userId, passwordHash: userPw, nickname: form.nickname.trim() || userId, role: form.role, updatedAt: Date.now() };
        onUserUpdate([...allUsers, newUser]);
        onLogin(newUser);
      } else {
        alert('아이디가 없거나 서버 연동이 안 되었습니다.\n엣지 브라우저에서 차단 중일 수 있으니 아래 [비상용 코드]를 사용하세요.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black mb-4 ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {syncStatus === 'connected' ? <Wifi size={10}/> : <WifiOff size={10}/>} {storeId.toUpperCase()} {syncStatus === 'connected' ? '연결됨' : '연결 안됨'}
          </div>
          <h1 className="text-3xl font-black text-red-600">TWOSOME PRO</h1>
        </div>
        
        <div className="space-y-4">
          <input type="text" placeholder="아이디" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none focus:border-red-500" onChange={e => setForm({...form, id: e.target.value})} />
          <input type="password" placeholder="비밀번호(4자리)" maxLength={4} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none focus:border-red-500" onChange={e => setForm({...form, pw: e.target.value})} />
          
          {isSignUp && (
            <div className="space-y-4 pt-2 animate-in slide-in-from-top-2">
              <input type="text" placeholder="닉네임" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" onChange={e => setForm({...form, nickname: e.target.value})} />
              <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                <button onClick={() => setForm({...form, role: 'STAFF'})} className={`flex-1 py-3 rounded-xl font-black text-xs ${form.role === 'STAFF' ? 'bg-white shadow-sm' : 'text-gray-400'}`}>직원</button>
                <button onClick={() => setForm({...form, role: 'OWNER'})} className={`flex-1 py-3 rounded-xl font-black text-xs ${form.role === 'OWNER' ? 'bg-red-600 text-white' : 'text-gray-400'}`}>점주</button>
              </div>
            </div>
          )}

          <button onClick={handleAuth} className="w-full py-5 bg-black text-white rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all">
            {isSignUp ? '계정 만들기' : '로그인'}
          </button>
          
          <div className="flex flex-col gap-2 pt-4 border-t border-gray-50">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs font-black text-gray-400 py-1">{isSignUp ? '로그인으로 돌아가기' : '새 기기에서 처음 로그인하시나요?'}</button>
            <button onClick={() => { const code = prompt('노트북 관리자 메뉴에서 복사한 [비상용 데이터 코드]를 붙여넣으세요.'); if(code) onImportCode(code); }} className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black">
              <Database size={12}/> 비상용 데이터 코드로 연동하기 (추천)
            </button>
            <button onClick={onResetStore} className="text-[10px] text-gray-300 underline font-bold">매장 코드 재입력하기</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
