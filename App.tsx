
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
  Clock, ShieldCheck
} from 'lucide-react';

const INITIAL_APP_DATA: AppData = {
  users: [], notices: [], handovers: [], inventory: [], 
  reservations: [], schedules: [], reports: [], tasks: [], 
  template: [], recipes: []
};

// 가장 범용적이고 차단 확률이 낮은 공용 KV 저장소 사용
const DB_ENDPOINT = 'https://kvdb.io/Snd98D7fG6h5J4k3L2m1'; 

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [storeId, setStoreId] = useState(localStorage.getItem('twosome_store_id') || '');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'syncing'>('offline');
  const [appData, setAppData] = useState<AppData>(INITIAL_APP_DATA);
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const isSyncing = useRef(false);

  // 전역 클라우드 푸시 함수 (상태 업데이트 + 서버 전송)
  const pushToCloud = useCallback(async (newData: AppData) => {
    if (!storeId) return;
    setSyncStatus('syncing');
    try {
      const res = await fetch(`${DB_ENDPOINT}/${storeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
        mode: 'cors',
        cache: 'no-cache'
      });
      if (res.ok) {
        setSyncStatus('connected');
        setConnectionError(null);
      } else {
        throw new Error('Server Response Error');
      }
    } catch (e) {
      setSyncStatus('offline');
      setConnectionError('서버 전송 실패. 네트워크를 확인하세요.');
    }
  }, [storeId]);

  // 전역 클라우드 가져오기 함수 (2초 폴링 엔진용)
  const fetchFromCloud = useCallback(async (isSilent = false): Promise<AppData | null> => {
    if (!storeId || (isSyncing.current && !isSilent)) return null;
    if (!isSilent) setSyncStatus('syncing');
    isSyncing.current = true;
    
    try {
      const response = await fetch(`${DB_ENDPOINT}/${storeId}?nocache=${Date.now()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });

      if (response.ok) {
        const cloudData: AppData = await response.json();
        setAppData(cloudData);
        setSyncStatus('connected');
        setConnectionError(null);
        return cloudData;
      } else if (response.status === 404) {
        // 데이터가 아예 없는 경우 초기화 데이터 전송
        await pushToCloud(INITIAL_APP_DATA);
        setSyncStatus('connected');
        return INITIAL_APP_DATA;
      } else {
        throw new Error('Connect Error');
      }
    } catch (e) {
      console.error('Fetch Error:', e);
      setSyncStatus('offline');
      if (!isSilent) setConnectionError('엣지/모바일에서 서버 접속이 차단되었습니다.');
      return null;
    } finally {
      isSyncing.current = false;
      setIsInitialized(true);
    }
  }, [storeId, pushToCloud]);

  // 실시간 동기화 엔진 작동 (2초 주기)
  useEffect(() => {
    if (storeId) {
      fetchFromCloud();
      const timer = setInterval(() => fetchFromCloud(true), 2000);
      return () => clearInterval(timer);
    } else {
      setIsInitialized(true);
    }
  }, [storeId, fetchFromCloud]);

  // 세션 복구
  useEffect(() => {
    const saved = localStorage.getItem('twosome_session');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const handleUpdate = (key: keyof AppData, updatedItems: any[]) => {
    const newData = { ...appData, [key]: updatedItems };
    setAppData(newData);
    pushToCloud(newData); // 변경 즉시 클라우드 전송
  };

  const handleManualImport = (code: string) => {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(code))));
      setAppData(decoded);
      pushToCloud(decoded);
      alert('전체 데이터가 강제 동기화되었습니다.');
    } catch (e) {
      alert('코드가 올바르지 않습니다.');
    }
  };

  if (!isInitialized && storeId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <Loader2 size={48} className="text-red-600 animate-spin mb-6" />
        <h2 className="text-xl font-black tracking-tight text-gray-900">매장 데이터를 불러오는 중...</h2>
        <p className="text-gray-400 text-sm mt-2 font-bold">잠시만 기다려 주세요.</p>
      </div>
    );
  }

  // 매장 접속 화면
  if (!storeId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl space-y-10 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-4">
            <div className="inline-block p-5 bg-red-600 rounded-[2rem] text-white shadow-2xl animate-bounce"><Store size={48} /></div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">투썸 PRO</h1>
            <p className="text-gray-400 font-bold text-sm leading-relaxed">매장 코드를 입력하면<br/>모든 기기에서 실시간 연동이 시작됩니다.</p>
          </div>
          <div className="space-y-4">
            <input 
              type="text" placeholder="매장 코드 입력 (예: 1903384)" 
              className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-red-500 font-black text-center text-xl uppercase transition-all"
              onChange={e => localStorage.setItem('twosome_temp_id', e.target.value)}
            />
            <button onClick={() => {
              const id = localStorage.getItem('twosome_temp_id')?.trim().toLowerCase();
              if(id) { 
                localStorage.setItem('twosome_store_id', id); 
                window.location.reload(); 
              } else {
                alert('코드를 입력하세요.');
              }
            }} className="w-full py-6 bg-black text-white rounded-3xl font-black text-xl shadow-2xl active:scale-95 transition-all">실시간 연동 시작</button>
          </div>
        </div>
      </div>
    );
  }

  // 로그인 화면
  if (!currentUser) {
    return (
      <LoginPage 
        storeId={storeId}
        allUsers={appData.users} 
        syncStatus={syncStatus}
        connectionError={connectionError}
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem('twosome_session', JSON.stringify(user));
        }} 
        onSignUp={async (newUser) => {
          const updatedUsers = [...appData.users, newUser];
          const newData = { ...appData, users: updatedUsers };
          setAppData(newData);
          await pushToCloud(newData); // 회원가입 즉시 클라우드에 쏴줘야 다른 기기가 알 수 있음
          return true;
        }}
        onManualImport={handleManualImport}
        onReset={() => {
          if(confirm('매장 코드를 재설정하시겠습니까?')) {
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
        <Navigation user={currentUser} storeId={storeId} syncStatus={syncStatus} onLogout={() => { if(confirm('로그아웃 하시겠습니까?')) { localStorage.removeItem('twosome_session'); setCurrentUser(null); } }} onManualSync={() => fetchFromCloud()} />
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
            <span className={`w-2 h-2 rounded-full ${syncStatus === 'connected' ? 'bg-green-500 animate-pulse' : syncStatus === 'syncing' ? 'bg-blue-500 animate-spin' : 'bg-red-500 animate-pulse'}`}></span>
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

const LoginPage: React.FC<{ storeId: string, allUsers: User[], syncStatus: string, connectionError: string | null, onLogin: (user: User) => void, onSignUp: (u: User) => Promise<boolean>, onManualImport: (c: string) => void, onReset: () => void }> = ({ storeId, allUsers, syncStatus, connectionError, onLogin, onSignUp, onManualImport, onReset }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ id: '', pw: '', nickname: '', role: 'STAFF' as UserRole });

  const handleAuth = async () => {
    const userId = form.id.toLowerCase().trim();
    const userPw = form.pw.trim();
    if (userId.length < 4 || userPw.length !== 4) { alert('아이디 4자 이상, 비번 4자리여야 합니다.'); return; }
    
    setLoading(true);
    // 현재 메모리에 있는 사용자 리스트에서 확인 (2초마다 클라우드와 자동 동기화됨)
    const user = allUsers.find(u => u.id === userId && u.passwordHash === userPw);

    if (user) {
      onLogin(user);
    } else {
      if (isSignUp) {
        if (allUsers.find(u => u.id === userId)) { alert('이미 존재하는 아이디입니다.'); setLoading(false); return; }
        const newUser: User = { id: userId, passwordHash: userPw, nickname: form.nickname.trim() || userId, role: form.role, updatedAt: Date.now() };
        await onSignUp(newUser);
        onLogin(newUser);
      } else {
        alert('아이디/비번이 틀렸거나 서버에 아직 등록되지 않았습니다. 잠시 후 다시 시도하세요.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-10 animate-in slide-in-from-bottom-6">
        <div className="text-center space-y-3">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {syncStatus === 'connected' ? <Wifi size={14}/> : <WifiOff size={14}/>} {storeId.toUpperCase()} {syncStatus === 'connected' ? '실시간 연동중' : '접속 확인중'}
          </div>
          <h1 className="text-4xl font-black text-red-600 tracking-tighter">TWOSOME PRO</h1>
        </div>

        {connectionError && (
          <div className="p-5 bg-red-50 rounded-3xl border border-red-100 flex items-start gap-3 animate-pulse">
            <AlertTriangle className="text-red-600 shrink-0" size={24} />
            <div>
              <p className="text-xs font-black text-red-800 leading-tight">서버 연결에 실패했습니다.</p>
              <p className="text-[10px] font-bold text-red-600 mt-1">엣지 브라우저는 보안 설정(추적 방지)을 해제하거나 아래 '비상용 수동 연동'을 눌러주세요.</p>
            </div>
          </div>
        )}
        
        <div className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 ml-2 uppercase">아이디</label>
              <input type="text" placeholder="ID 입력" className="w-full p-5 bg-gray-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-red-100" onChange={e => setForm({...form, id: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 ml-2 uppercase">비밀번호 (4자리)</label>
              <input type="password" placeholder="비번 4자리" maxLength={4} className="w-full p-5 bg-gray-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-red-100" onChange={e => setForm({...form, pw: e.target.value})} />
            </div>
          </div>
          
          {isSignUp && (
            <div className="space-y-5 pt-2 animate-in slide-in-from-top-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 ml-2 uppercase">닉네임</label>
                <input type="text" placeholder="표시 이름" className="w-full p-5 bg-gray-50 border rounded-2xl font-bold" onChange={e => setForm({...form, nickname: e.target.value})} />
              </div>
              <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
                <button onClick={() => setForm({...form, role: 'STAFF'})} className={`flex-1 py-3 rounded-xl font-black text-xs ${form.role === 'STAFF' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>직원</button>
                <button onClick={() => setForm({...form, role: 'OWNER'})} className={`flex-1 py-3 rounded-xl font-black text-xs ${form.role === 'OWNER' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400'}`}>점주</button>
              </div>
            </div>
          )}

          <button onClick={handleAuth} disabled={loading} className="w-full py-6 bg-black text-white rounded-3xl font-black text-xl shadow-2xl active:scale-95 flex items-center justify-center gap-3 transition-all">
            {loading ? <RefreshCw className="animate-spin" /> : (isSignUp ? '계정 만들기' : '로그인')}
          </button>
          
          <div className="flex flex-col gap-3 pt-6 border-t border-gray-100">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm font-black text-gray-400 py-1 hover:text-red-600 transition-colors">{isSignUp ? '이미 계정이 있으신가요? 로그인' : '새 계정 만들기'}</button>
            <button onClick={() => { const code = prompt('노트북 [관리]에서 복사한 코드를 붙여넣으세요.'); if(code) onManualImport(code); }} className="flex items-center justify-center gap-2 py-5 bg-blue-50 text-blue-600 rounded-[1.5rem] text-[11px] font-black hover:bg-blue-100 transition-colors">
              <Database size={16}/> 비상용 수동 데이터 연동
            </button>
            <button onClick={onReset} className="text-[10px] text-gray-300 underline font-bold hover:text-gray-500">매장 코드(1903384) 재설정</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
