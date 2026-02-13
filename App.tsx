
import React, { useState, useEffect, useCallback, useRef } from 'react';
// @ts-ignore
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
  Store, Loader2, Wifi, WifiOff, Clock, RotateCcw, ShieldCheck
} from 'lucide-react';

const DB_BASE = 'https://kvdb.io/Snd98D7fG6h5J4k3L2m1'; 

const INITIAL_APP_DATA: AppData = {
  users: [], notices: [], handovers: [], inventory: [], 
  reservations: [], schedules: [], reports: [], tasks: [], 
  template: [], recipes: [], lastUpdated: 0
};

const Navigation = ({ user, syncStatus, lastSyncTime, onLogout, onShowDoctor }: any) => {
  const location = useLocation();
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSec(Math.floor((Date.now() - lastSyncTime) / 1000)), 1000);
    return () => clearInterval(t);
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
        <div className="flex items-center"><h1 className="text-xl font-black text-red-600 tracking-tighter shrink-0 italic">TWOSOME</h1></div>
        <nav className="hidden md:flex items-center justify-center gap-1 overflow-hidden">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className={`px-3 py-2 rounded-xl text-sm font-black transition-all ${location.pathname === item.path ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>{item.label}</Link>
          ))}
          {user.role === 'OWNER' && <Link to="/admin" className={`px-3 py-2 rounded-xl text-sm font-black transition-all ${location.pathname === '/admin' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>관리</Link>}
        </nav>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onShowDoctor} className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all min-w-[110px] ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600 animate-pulse'}`}>
            {syncStatus === 'connected' ? <Wifi size={12}/> : <WifiOff size={12}/>}
            <span>{syncStatus === 'connected' ? `${sec > 0 ? sec : 0}초 전` : '연결안됨'}</span>
          </button>
          <button onClick={onLogout} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><LogOut size={22} /></button>
        </div>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex justify-around items-center z-50 md:hidden pb-safe">
        {navItems.map(item => (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 w-full ${location.pathname === item.path ? 'text-red-600' : 'text-gray-300'}`}><item.icon size={20} /><span className="text-[9px] font-black">{item.label}</span></Link>
        ))}
      </nav>
    </>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [storeId, setStoreId] = useState(localStorage.getItem('twosome_store_id')?.toLowerCase().trim() || '');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'syncing'>('offline');
  const [appData, setAppData] = useState<AppData>(INITIAL_APP_DATA);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [showDoctor, setShowDoctor] = useState(false);
  
  const syncLock = useRef(false);
  const debounceTimer = useRef<any>(null);

  // 서버 데이터를 로컬에 강제로 주입
  const forceUpdateData = useCallback((newData: AppData) => {
    setAppData(newData);
    localStorage.setItem(`twosome_data_${storeId}`, JSON.stringify(newData));
    setLastSyncTime(Date.now());
    setSyncStatus('connected');
  }, [storeId]);

  // 서버 동기화 함수 (로직 강화)
  const syncWithServer = useCallback(async (method: 'GET' | 'POST', payload?: AppData): Promise<AppData | null> => {
    if (!storeId) return null;
    const url = `${DB_BASE}/${storeId}`;
    
    try {
      setSyncStatus('syncing');
      const response = await fetch(`${url}?t=${Date.now()}`, {
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
        const data = await response.json();
        if (data && typeof data === 'object') {
          if (method === 'GET') {
            // [핵심] 폰에서 처음 접속했거나 서버 데이터가 더 많다면 무조건 수용
            const isLocalEmpty = appData.users.length === 0 && appData.notices.length === 0;
            if (isLocalEmpty || data.lastUpdated > appData.lastUpdated) {
              forceUpdateData(data);
            }
          }
          setLastSyncTime(Date.now());
          setSyncStatus('connected');
          return data;
        }
      }
      throw new Error("FAIL");
    } catch (e) {
      setSyncStatus('offline');
      return null;
    } finally {
      setIsInitialized(true);
    }
  }, [storeId, appData, forceUpdateData]);

  // 초기화 시 로컬 저장소 먼저 읽기
  useEffect(() => {
    if (storeId) {
      const saved = localStorage.getItem(`twosome_data_${storeId}`);
      if (saved) setAppData(JSON.parse(saved));
      syncWithServer('GET');
      
      const timer = setInterval(() => {
        if (!syncLock.current) syncWithServer('GET');
      }, 15000);
      return () => clearInterval(timer);
    } else {
      setIsInitialized(true);
    }
  }, [storeId]);

  useEffect(() => {
    const saved = localStorage.getItem('twosome_session');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const handleUpdate = async (key: keyof AppData, updatedItems: any[]) => {
    if (!storeId) return;
    const nextData = { ...appData, [key]: updatedItems, lastUpdated: Date.now() };
    forceUpdateData(nextData);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      syncLock.current = true;
      await syncWithServer('POST', nextData);
      syncLock.current = false;
    }, 1000);
  };

  if (!isInitialized && storeId) {
    return <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white"><Loader2 className="text-red-600 animate-spin mb-4" size={40} /><p className="font-black italic">LOADING...</p></div>;
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl space-y-8">
          <div className="inline-block p-4 bg-red-600 rounded-3xl text-white"><Store size={44} /></div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter italic">Twosome Pro</h1>
          <p className="text-gray-400 font-bold text-sm">매장 코드를 입력하세요.</p>
          <input type="text" placeholder="매장 코드 (예: gangnam)" className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-red-600 font-black text-center text-xl" id="store-input" />
          <button onClick={() => { 
            const id = (document.getElementById('store-input') as HTMLInputElement).value?.trim().toLowerCase(); 
            if(id) { localStorage.setItem('twosome_store_id', id); window.location.reload(); }
          }} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl shadow-xl">연동 시작</button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex px-4 py-1.5 rounded-full text-[10px] font-black bg-gray-50 text-gray-400 uppercase">Store: {storeId}</div>
            <h1 className="text-4xl font-black text-red-600 tracking-tighter italic">LOGIN</h1>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="아이디" className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-red-600" id="login-id" />
            <input type="password" placeholder="비밀번호(4자리)" maxLength={4} className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none focus:border-red-600" id="login-pw" />
            <button onClick={async () => {
              const id = (document.getElementById('login-id') as HTMLInputElement).value.toLowerCase().trim();
              const pw = (document.getElementById('login-pw') as HTMLInputElement).value.trim();
              const serverData = await syncWithServer('GET'); 
              const users = serverData ? serverData.users : appData.users;
              const user = users.find(u => u.id === id && u.passwordHash === pw);
              if (user) { setCurrentUser(user); localStorage.setItem('twosome_session', JSON.stringify(user)); }
              else { alert('아이디/비번을 확인하세요. (동기화 확인 중...)'); }
            }} className="w-full py-6 bg-black text-white rounded-[2rem] font-black text-xl">로그인</button>
            <div className="pt-6 border-t text-center flex flex-col gap-4">
              <button onClick={() => {
                const id = prompt('새 아이디?')?.toLowerCase().trim();
                if(!id) return;
                const pw = prompt('비번 4자리?')?.trim();
                if(!pw || pw.length !== 4) return;
                const name = prompt('이름?') || id;
                const role = confirm('점주님?') ? 'OWNER' : 'STAFF';
                const newUser = { id, passwordHash: pw, nickname: name, role, updatedAt: Date.now() };
                handleUpdate('users', [...appData.users, newUser]);
                alert('생성됨. 로그인하세요.');
              }} className="text-sm font-black text-gray-400 hover:text-red-600">계정 만들기</button>
              <button onClick={() => { if(confirm('매장 코드 초기화?')) { localStorage.clear(); window.location.reload(); } }} className="text-[10px] font-black text-gray-300 underline">매장 코드 재설정</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navigation user={currentUser} syncStatus={syncStatus} lastSyncTime={lastSyncTime} onLogout={() => { localStorage.removeItem('twosome_session'); setCurrentUser(null); }} onShowDoctor={() => setShowDoctor(true)} />
        <main className="flex-1 pt-20 pb-24 px-4 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/notice" element={<NoticeBoard currentUser={currentUser} data={appData.notices} onUpdate={(it) => handleUpdate('notices', it)} />} />
            <Route path="/handover" element={<HandoverBoard currentUser={currentUser} data={appData.handovers} onUpdate={(it) => handleUpdate('handovers', it)} />} />
            <Route path="/checklist" element={<ChecklistBoard currentUser={currentUser} data={appData.tasks} onUpdate={(it) => handleUpdate('tasks', it)} onReportSubmit={(r) => handleUpdate('reports', [...appData.reports, r])} />} />
            <Route path="/attendance" element={<AttendanceCalendar currentUser={currentUser} allUsers={appData.users} reports={appData.reports} onUpdate={(it) => handleUpdate('reports', it)} />} />
            <Route path="/inventory" element={<InventoryManagement currentUser={currentUser} data={appData.inventory} onUpdate={(it) => handleUpdate('inventory', it)} />} />
            <Route path="/recipe" element={<RecipeManual currentUser={currentUser} data={appData.recipes} onUpdate={(it) => handleUpdate('recipes', it)} />} />
            <Route path="/reservation" element={<ReservationManagement currentUser={currentUser} data={appData.reservations} onUpdate={(it) => handleUpdate('reservations', it)} />} />
            <Route path="/admin" element={<OwnerAdmin appData={appData} onUpdate={handleUpdate} onStoreIdUpdate={(id) => {localStorage.setItem('twosome_store_id', id); window.location.reload();}} onForceUpload={() => syncWithServer('POST', appData)} />} />
            <Route path="*" element={<Navigate to="/notice" />} />
          </Routes>
        </main>
        {showDoctor && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 text-center">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl space-y-6">
              <ShieldCheck size={48} className="mx-auto text-green-600 mb-2" />
              <h3 className="text-2xl font-black italic">SYNC DOCTOR</h3>
              <div className="p-5 bg-gray-50 rounded-2xl space-y-3 text-xs font-bold text-gray-500 text-left">
                <div className="flex justify-between"><span>매장 코드</span> <span className="text-red-600 font-black uppercase">{storeId}</span></div>
                <div className="flex justify-between"><span>최종 서버 통신</span> <span>{new Date(lastSyncTime).toLocaleTimeString()}</span></div>
              </div>
              <button onClick={() => { syncWithServer('GET'); setShowDoctor(false); }} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 italic uppercase"><RotateCcw size={18} /> Force Load Server Data</button>
              <button onClick={() => setShowDoctor(false)} className="w-full py-5 bg-black text-white rounded-2xl font-black">CLOSE</button>
            </div>
          </div>
        )}
      </div>
    </HashRouter>
  );
};

export default App;
