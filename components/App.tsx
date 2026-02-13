
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
import { StaffManagement } from './components/StaffManagement';
import { 
  LogOut, Megaphone, ClipboardList, CheckSquare, 
  Calendar, Package, BookOpen, 
  Store, Loader2, Wifi, WifiOff, Clock, RotateCcw, ShieldCheck, User as UserIcon, Lock, ChevronRight, UserPlus, Info, HelpCircle, CheckCircle2, LayoutDashboard, RefreshCw, Users
} from 'lucide-react';

const DB_BASE = 'https://kvdb.io/Snd98D7fG6h5J4k3L2m1'; 

const INITIAL_APP_DATA: AppData = {
  users: [], notices: [], handovers: [], inventory: [], 
  reservations: [], schedules: [], reports: [], tasks: [], 
  template: [], recipes: [], lastUpdated: 0
};

const Navigation = ({ user, syncStatus, lastSyncTime, onLogout, onShowDoctor, onRefresh }: any) => {
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
    { path: '/staff', label: '직원', icon: Users },
    { path: '/recipe', label: '레시피', icon: BookOpen },
    { path: '/inventory', label: '재고', icon: Package },
    { path: '/attendance', label: '근무', icon: Calendar },
    { path: '/reservation', label: '예약', icon: Clock },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 grid grid-cols-[120px_1fr_180px] items-center px-4 md:px-10 z-50 shadow-sm">
        <div className="flex items-center"><h1 className="text-base md:text-lg font-black text-red-600 tracking-tighter shrink-0 italic">TWOSOME</h1></div>
        <nav className="hidden lg:flex items-center justify-center gap-1 overflow-hidden">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${location.pathname === item.path ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>{item.label}</Link>
          ))}
          {user.role === 'OWNER' && <Link to="/admin" className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${location.pathname === '/admin' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>환경설정</Link>}
        </nav>
        <div className="flex items-center justify-end gap-1 md:gap-3">
          <button onClick={onRefresh} className="p-2 text-gray-400 hover:text-red-600 transition-colors hidden sm:block">
            <RefreshCw size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
          </button>
          <div className="hidden sm:flex flex-col items-end mr-1 text-right">
            <span className="text-[9px] font-black text-gray-900">{user.nickname} {user.role === 'OWNER' ? '점주' : ''}</span>
            <span className="text-[7px] font-bold text-green-500 flex items-center gap-0.5"><div className="w-1 h-1 bg-green-500 rounded-full"></div>ONLINE</span>
          </div>
          <button onClick={onShowDoctor} className={`flex items-center justify-center gap-1 px-2 py-1 rounded-full text-[9px] font-black transition-all ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {syncStatus === 'connected' ? <Wifi size={10}/> : <WifiOff size={10}/>}
            <span>{sec > 0 ? `${sec}s` : 'SYNC'}</span>
          </button>
          <button onClick={onLogout} className="p-1.5 text-gray-300 hover:text-red-600"><LogOut size={18} /></button>
        </div>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex justify-around items-center z-50 lg:hidden pb-safe px-1">
        {navItems.map(item => (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 w-full ${location.pathname === item.path ? 'text-red-600' : 'text-gray-300'}`}><item.icon size={18} /><span className="text-[8px] font-black">{item.label}</span></Link>
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
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  const syncLock = useRef(false);
  const debounceTimer = useRef<any>(null);

  const saveAll = useCallback((newData: AppData) => {
    setAppData(newData);
    localStorage.setItem(`twosome_data_${storeId}`, JSON.stringify(newData));
    setLastSyncTime(Date.now());
  }, [storeId]);

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
            setAppData(prev => {
              // 유저 병합
              const mergedUsers = [...(data.users || [])];
              prev.users.forEach(u => { if(!mergedUsers.find(m => m.id === u.id)) mergedUsers.push(u); });

              // 정밀 병합 로직: 타임스탬프가 더 최신인 데이터가 있는 경우만 업데이트
              if ((data.lastUpdated || 0) >= prev.lastUpdated || prev.users.length === 0) {
                const final = { ...INITIAL_APP_DATA, ...data, users: mergedUsers };
                localStorage.setItem(`twosome_data_${storeId}`, JSON.stringify(final));
                return final;
              }
              return { ...prev, users: mergedUsers };
            });
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
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      const saved = localStorage.getItem(`twosome_data_${storeId}`);
      if (saved) setAppData(JSON.parse(saved));
      
      syncWithServer('GET');
      const timer = setInterval(() => {
        if (!syncLock.current) syncWithServer('GET');
      }, 10000);
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
    const now = Date.now();
    const nextData = { ...appData, [key]: updatedItems, lastUpdated: now };
    saveAll(nextData);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      syncLock.current = true;
      await syncWithServer('POST', nextData);
      syncLock.current = false;
    }, 1500);
  };

  if (!isInitialized && storeId) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[9999]">
        <Loader2 className="text-red-600 animate-spin mb-4" size={32} />
        <p className="font-black text-[10px] tracking-widest text-gray-300 uppercase italic">A TWOSOME PLACE CLOUD CONNECTING...</p>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl space-y-10 animate-in zoom-in duration-500">
          <div className="text-center space-y-4">
            <div className="inline-block p-6 bg-red-600 rounded-[2rem] text-white mb-2 shadow-xl shadow-red-200"><Store size={44} /></div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">TWOSOME PRO</h1>
            <p className="text-gray-400 font-bold text-sm leading-relaxed">우리 매장만의 고유 코드를 입력하세요.<br/>(처음이라면 원하는 영문 이름을 입력)</p>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="매장 코드 (예: ts-center)" className="w-full p-6 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-[2rem] outline-none font-black text-center text-2xl transition-all lowercase" id="store-input" />
            <button onClick={() => { 
              const id = (document.getElementById('store-input') as HTMLInputElement).value?.trim().toLowerCase(); 
              if(id) { localStorage.setItem('twosome_store_id', id); window.location.reload(); }
            }} className="w-full py-6 bg-black text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-gray-800 active:scale-95 transition-all uppercase tracking-tight">연동 시스템 가동</button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[700px]">
          <div className="bg-red-600 p-12 text-white md:w-5/12 flex flex-col justify-between">
            <div className="z-10 flex justify-between items-center md:block">
              <h2 className="text-2xl font-black italic tracking-tighter">A TWOSOME PLACE</h2>
              <div className="md:hidden bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{storeId}</div>
            </div>
            <div className="hidden md:block mt-20 space-y-4">
              <h3 className="text-5xl font-black leading-tight tracking-tighter italic">Partner<br/>Portal.</h3>
              <p className="text-red-100 font-bold text-base opacity-70">실시간 매장 데이터 동기화 기반의<br/>전문 관리 솔루션 v5.0 Stable</p>
            </div>
            <div className="hidden md:flex mt-10 items-center gap-2 text-[10px] font-black tracking-widest uppercase opacity-40">
              <LayoutDashboard size={14} /> <span>Cloud Integrity Enabled</span>
            </div>
          </div>

          <div className="flex-1 p-10 md:p-16 bg-white overflow-y-auto scrollbar-hide">
            <div className="max-w-xs mx-auto space-y-10">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                    {authMode === 'LOGIN' ? '로그인' : '계정 등록'}
                  </h1>
                  <button onClick={() => syncWithServer('GET')} className="p-2 text-gray-300 hover:text-red-600 transition-colors">
                    <RefreshCw size={20} className={syncStatus === 'syncing' ? 'animate-spin text-red-600' : ''} />
                  </button>
                </div>
                <p className="text-gray-400 font-bold text-sm">{authMode === 'LOGIN' ? '매장 관리 계정으로 입장하세요.' : '우리 매장 관리 명부에 등록합니다.'}</p>
              </div>

              {authMode === 'LOGIN' ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-4">
                    <div className="relative">
                      <UserIcon size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input type="text" placeholder="아이디 (ID)" className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-[2rem] outline-none font-bold transition-all lowercase" id="login-id" />
                    </div>
                    <div className="relative">
                      <Lock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input type="password" placeholder="비밀번호 4자리" maxLength={4} className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-[2rem] outline-none font-bold transition-all tracking-widest" id="login-pw" />
                    </div>
                  </div>
                  <button onClick={async () => {
                    const id = (document.getElementById('login-id') as HTMLInputElement).value.toLowerCase().trim();
                    const pw = (document.getElementById('login-pw') as HTMLInputElement).value.trim();
                    if(!id || !pw) return alert('모든 정보를 입력해 주세요.');
                    
                    const user = appData.users.find(u => u.id === id && u.passwordHash === pw);
                    if (user) { 
                      setCurrentUser(user); 
                      localStorage.setItem('twosome_session', JSON.stringify(user)); 
                    } else { 
                      alert('아이디 또는 비밀번호를 확인해 주세요.\n데이터 연동 전이라면 새로고침 후 시도해 보세요.'); 
                    }
                  }} className="w-full py-6 bg-black text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-3 italic tracking-tight">
                    LOGIN <ChevronRight size={22}/>
                  </button>
                  <div className="pt-8 border-t border-gray-100 flex flex-col items-center gap-4">
                    <button onClick={() => setAuthMode('REGISTER')} className="text-xs font-black text-gray-400 hover:text-red-600 flex items-center gap-2">
                      <UserPlus size={16}/> 처음이신가요? 계정 등록하기
                    </button>
                    <button onClick={() => { if(confirm('매장 코드를 재설정하시겠습니까?\n모든 데이터 연동이 끊어집니다.')) { localStorage.clear(); window.location.reload(); } }} className="text-[10px] font-black text-gray-300 underline uppercase tracking-tighter">RESET STORE ID</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4">
                    <input type="text" placeholder="새 아이디 (영문)" className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-[2rem] outline-none font-bold transition-all lowercase" id="reg-id" />
                    <input type="text" placeholder="닉네임 (본명 권장)" className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-[2rem] outline-none font-bold transition-all" id="reg-name" />
                    <input type="password" placeholder="비번 4자리" maxLength={4} className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-[2rem] outline-none font-bold transition-all tracking-widest" id="reg-pw" />
                    <div className="grid grid-cols-2 gap-3">
                      <button id="role-owner" onClick={() => { 
                        document.getElementById('role-owner')?.classList.add('bg-black', 'text-white');
                        document.getElementById('role-staff')?.classList.remove('bg-red-600', 'text-white');
                      }} className="py-4 bg-gray-50 rounded-2xl font-black text-xs border border-gray-100 bg-black text-white">점주</button>
                      <button id="role-staff" onClick={() => { 
                        document.getElementById('role-staff')?.classList.add('bg-red-600', 'text-white');
                        document.getElementById('role-owner')?.classList.remove('bg-black', 'text-white');
                      }} className="py-4 bg-gray-50 rounded-2xl font-black text-xs border border-gray-100">직원</button>
                    </div>
                  </div>
                  <button onClick={async () => {
                    const id = (document.getElementById('reg-id') as HTMLInputElement).value.toLowerCase().trim();
                    const pw = (document.getElementById('reg-pw') as HTMLInputElement).value.trim();
                    const name = (document.getElementById('reg-name') as HTMLInputElement).value.trim();
                    const isOwner = document.getElementById('role-owner')?.classList.contains('bg-black');

                    if(!id || !pw || !name) return alert('모든 칸을 채워주세요.');
                    if(pw.length !== 4) return alert('비밀번호는 숫자 4자리입니다.');
                    
                    const newUser: User = { id, passwordHash: pw, nickname: name, role: isOwner ? 'OWNER' : 'STAFF', updatedAt: Date.now() };
                    const nextUsers = [...appData.users, newUser];
                    const nextData = { ...appData, users: nextUsers, lastUpdated: Date.now() };
                    
                    saveAll(nextData);
                    await syncWithServer('POST', nextData);
                    setCurrentUser(newUser);
                    localStorage.setItem('twosome_session', JSON.stringify(newUser));
                    alert(`${name}님, 가입이 완료되었습니다!`);
                  }} className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-red-700 transition-all italic tracking-tight">
                    REGISTER NOW
                  </button>
                  <button onClick={() => setAuthMode('LOGIN')} className="w-full py-2 text-gray-400 font-bold text-xs">이미 계정이 있습니다 (로그인)</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navigation 
          user={currentUser} 
          syncStatus={syncStatus} 
          lastSyncTime={lastSyncTime} 
          onLogout={() => { if(window.confirm('로그아웃 하시겠습니까?')) { localStorage.removeItem('twosome_session'); setCurrentUser(null); } }} 
          onShowDoctor={() => setShowDoctor(true)}
          onRefresh={() => syncWithServer('GET')}
        />
        <main className="flex-1 pt-20 pb-24 lg:pb-10 px-4 md:px-10 max-w-[1400px] mx-auto w-full">
          <Routes>
            <Route path="/notice" element={<NoticeBoard currentUser={currentUser} data={appData.notices} onUpdate={(it) => handleUpdate('notices', it)} />} />
            <Route path="/handover" element={<HandoverBoard currentUser={currentUser} data={appData.handovers} onUpdate={(it) => handleUpdate('handovers', it)} />} />
            <Route path="/checklist" element={<ChecklistBoard currentUser={currentUser} data={appData.tasks} onUpdate={(it) => handleUpdate('tasks', it)} onReportSubmit={(r) => handleUpdate('reports', [...appData.reports, r])} />} />
            <Route path="/staff" element={<StaffManagement currentUser={currentUser} allUsers={appData.users} onUpdate={(it) => handleUpdate('users', it)} />} />
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
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl space-y-6 animate-in zoom-in duration-200">
              <ShieldCheck size={50} className="mx-auto text-green-600" />
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Sync Monitor</h3>
                <p className="text-gray-400 font-bold text-[10px]">데이터 동기화 무결성을 실시간 점검합니다.</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-2xl space-y-3 text-[10px] font-bold text-gray-500 text-left">
                <div className="flex justify-between"><span>매장 코드</span> <span className="text-red-600 font-black">{storeId}</span></div>
                <div className="flex justify-between"><span>연결 상태</span> <span className={syncStatus === 'connected' ? 'text-green-500' : 'text-red-500'}>{syncStatus.toUpperCase()}</span></div>
                <div className="flex justify-between"><span>최종 연동</span> <span className="text-gray-900">{new Date(appData.lastUpdated).toLocaleTimeString()}</span></div>
                <div className="flex justify-between"><span>직원 명수</span> <span className="text-gray-900">{appData.users.length}명</span></div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => { syncWithServer('GET'); setShowDoctor(false); }} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 italic uppercase shadow-xl hover:bg-red-700 transition-all"><RotateCcw size={18} /> Force Sync</button>
                <button onClick={() => setShowDoctor(false)} className="w-full py-4 bg-black text-white rounded-2xl font-black">닫기</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HashRouter>
  );
};

export default App;
