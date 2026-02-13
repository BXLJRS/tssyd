
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
  Store, Loader2, Wifi, WifiOff, Clock, RotateCcw, ShieldCheck, User as UserIcon, Lock, ChevronRight, UserPlus, Info, HelpCircle, CheckCircle2, LayoutDashboard
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
    { path: '/notice', label: '공지사항', icon: Megaphone },
    { path: '/handover', label: '인계사항', icon: ClipboardList },
    { path: '/checklist', label: '업무체크', icon: CheckSquare },
    { path: '/recipe', label: '레시피', icon: BookOpen },
    { path: '/inventory', label: '재고관리', icon: Package },
    { path: '/attendance', label: '근무기록', icon: Calendar },
    { path: '/reservation', label: '케익예약', icon: Clock },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 grid grid-cols-[200px_1fr_220px] items-center px-4 md:px-10 z-50 shadow-sm">
        <div className="flex items-center"><h1 className="text-xl font-black text-red-600 tracking-tighter shrink-0 italic">A TWOSOME PLACE</h1></div>
        <nav className="hidden lg:flex items-center justify-center gap-2 overflow-hidden">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${location.pathname === item.path ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>{item.label}</Link>
          ))}
          {user.role === 'OWNER' && <Link to="/admin" className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${location.pathname === '/admin' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>환경설정</Link>}
        </nav>
        <div className="flex items-center justify-end gap-3">
          <div className="hidden sm:flex flex-col items-end mr-2 text-right">
            <span className="text-[11px] font-black text-gray-900">{user.nickname} {user.role === 'OWNER' ? '점주님' : '님'}</span>
            <span className="text-[9px] font-bold text-green-500 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>온라인</span>
          </div>
          <button onClick={onShowDoctor} className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all min-w-[100px] ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600 animate-pulse'}`}>
            {syncStatus === 'connected' ? <Wifi size={12}/> : <WifiOff size={12}/>}
            <span>{syncStatus === 'connected' ? `${sec > 0 ? sec : 0}s 전` : '연결지연'}</span>
          </button>
          <button onClick={onLogout} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><LogOut size={22} /></button>
        </div>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex justify-around items-center z-50 lg:hidden pb-safe px-2">
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
  
  // 로그인/회원가입 상태
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  const syncLock = useRef(false);
  const debounceTimer = useRef<any>(null);

  // 로컬 저장 함수
  const saveLocally = useCallback((newData: AppData) => {
    setAppData(newData);
    localStorage.setItem(`twosome_data_${storeId}`, JSON.stringify(newData));
    setLastSyncTime(Date.now());
  }, [storeId]);

  // 서버 동기화 함수
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
              // 중요: 유저 정보는 로컬에 있는 것과 서버에 있는 것을 무조건 합침 (데이터 증발 방지)
              const mergedUsers = [...(data.users || [])];
              prev.users.forEach(u => { if(!mergedUsers.find(m => m.id === u.id)) mergedUsers.push(u); });

              // 서버 데이터가 더 최신이거나 내 로컬이 비어있을 때만 업데이트
              if ((data.lastUpdated || 0) > prev.lastUpdated || prev.users.length === 0) {
                const updated = { ...INITIAL_APP_DATA, ...data, users: mergedUsers };
                localStorage.setItem(`twosome_data_${storeId}`, JSON.stringify(updated));
                return updated;
              }
              return prev;
            });
          }
          setLastSyncTime(Date.now());
          setSyncStatus('connected');
          return data;
        }
      }
      throw new Error("SYNC_FAIL");
    } catch (e) {
      setSyncStatus('offline');
      return null;
    } finally {
      setIsInitialized(true);
    }
  }, [storeId]);

  // 초기화 및 주기적 동기화
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
  }, [storeId, syncWithServer]);

  // 세션 체크
  useEffect(() => {
    const saved = localStorage.getItem('twosome_session');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const handleUpdate = async (key: keyof AppData, updatedItems: any[]) => {
    if (!storeId) return;
    const nextData = { ...appData, [key]: updatedItems, lastUpdated: Date.now() };
    saveLocally(nextData);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      syncLock.current = true;
      await syncWithServer('POST', nextData);
      syncLock.current = false;
    }, 1000);
  };

  if (!isInitialized && storeId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <Loader2 className="text-red-600 animate-spin mb-4" size={40} />
        <p className="font-black italic text-sm tracking-widest text-gray-400">CONNECTING TO TWOSOME CLOUD...</p>
      </div>
    );
  }

  // 1. 매장 설정 화면 (가장 처음)
  if (!storeId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl space-y-10 animate-in zoom-in duration-500">
          <div className="text-center space-y-4">
            <div className="inline-block p-6 bg-red-600 rounded-[2rem] text-white mb-2 shadow-xl shadow-red-200"><Store size={50} /></div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">TWOSOME PRO</h1>
            <p className="text-gray-400 font-bold text-sm leading-relaxed">매장 식별 코드를 입력하세요.<br/>(처음이라면 원하는 이름을 영문으로 입력하세요)</p>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="매장 코드 (예: ts-gangnam)" className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-[2rem] outline-none focus:border-red-600 font-black text-center text-2xl transition-all lowercase" id="store-input" />
            <button onClick={() => { 
              const id = (document.getElementById('store-input') as HTMLInputElement).value?.trim().toLowerCase(); 
              if(id) { localStorage.setItem('twosome_store_id', id); window.location.reload(); }
            }} className="w-full py-6 bg-black text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-gray-800 active:scale-95 transition-all uppercase tracking-tight">시스템 연동 시작</button>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl flex items-start gap-3">
            <Info className="text-gray-400 shrink-0" size={18} />
            <p className="text-[11px] font-bold text-gray-400 leading-relaxed">입력하신 코드로 모든 직원이 데이터를 공유하게 됩니다. 보안을 위해 우리 매장만의 고유한 코드를 사용하세요.</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. 통합 인증 화면 (로그인/회원가입)
  if (!currentUser) {
    return (
      <div className="min-h-screen flex bg-gray-50 font-sans p-4 md:p-10 items-center justify-center">
        <div className="w-full max-w-5xl bg-white rounded-[4rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row h-full max-h-[800px]">
          {/* 브랜딩 영역 */}
          <div className="lg:w-1/2 bg-red-600 p-16 flex flex-col justify-between text-white relative">
            <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl"></div>
            <div className="z-10"><h2 className="text-3xl font-black italic tracking-tighter">A TWOSOME PLACE</h2></div>
            <div className="z-10 space-y-6">
              <h3 className="text-6xl font-black leading-[1.1] tracking-tighter">Premium<br/>Partner<br/>Portal.</h3>
              <p className="text-red-100 font-bold max-w-xs text-lg opacity-80">최고의 매장 관리를 위한 점주 전용 워크페이스입니다.</p>
            </div>
            <div className="z-10 flex items-center gap-2 text-xs font-black tracking-widest uppercase opacity-50">
              <LayoutDashboard size={14} /> <span>Twosome Management Pro v4.0</span>
            </div>
          </div>

          {/* 입력 영역 */}
          <div className="lg:w-1/2 p-12 md:p-20 flex flex-col justify-center relative bg-white">
            <div className="w-full max-w-sm mx-auto space-y-10 animate-in slide-in-from-right-10 duration-500">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                    {authMode === 'LOGIN' ? '로그인' : '계정 등록'}
                  </h1>
                  <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-red-100">{storeId}</div>
                </div>
                <p className="text-gray-400 font-bold">{authMode === 'LOGIN' ? '계정 정보를 입력해 주세요.' : '새로운 관리 주체를 등록합니다.'}</p>
              </div>

              {authMode === 'LOGIN' ? (
                /* --- 로그인 섹션 --- */
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <UserIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input type="text" placeholder="아이디 (ID)" className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-3xl outline-none font-bold transition-all lowercase" id="login-id" />
                    </div>
                    <div className="relative">
                      <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input type="password" placeholder="비밀번호 4자리" maxLength={4} className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-3xl outline-none font-bold transition-all tracking-widest" id="login-pw" />
                    </div>
                  </div>
                  <button onClick={async (e) => {
                    const id = (document.getElementById('login-id') as HTMLInputElement).value.toLowerCase().trim();
                    const pw = (document.getElementById('login-pw') as HTMLInputElement).value.trim();
                    if(!id || !pw) return alert('아이디와 비밀번호를 입력하세요.');
                    
                    // 내 로컬 데이터를 최우선적으로 믿고 로그인
                    const user = appData.users.find(u => u.id === id && u.passwordHash === pw);
                    if (user) { 
                      setCurrentUser(user); 
                      localStorage.setItem('twosome_session', JSON.stringify(user)); 
                    } else { 
                      alert('아이디 또는 비밀번호가 올바르지 않습니다.'); 
                    }
                  }} className="w-full py-6 bg-black text-white rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3">
                    접속하기 <ChevronRight size={22}/>
                  </button>
                  <div className="pt-8 border-t border-gray-50 flex flex-col items-center gap-4">
                    <button onClick={() => setAuthMode('REGISTER')} className="text-sm font-black text-gray-400 hover:text-red-600 transition-colors flex items-center gap-2">
                      <UserPlus size={16}/> 처음이신가요? 계정 등록하기
                    </button>
                    <button onClick={() => { if(confirm('매장 코드를 다시 설정하시겠습니까?')) { localStorage.clear(); window.location.reload(); } }} className="text-[10px] font-black text-gray-300 underline uppercase tracking-tighter">매장 코드 재설정</button>
                  </div>
                </div>
              ) : (
                /* --- 회원가입 섹션 --- */
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                  <div className="space-y-4">
                    <input type="text" placeholder="새로운 아이디 (영문 소문자)" className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-3xl outline-none font-bold transition-all lowercase" id="reg-id" />
                    <input type="text" placeholder="닉네임 (본명 추천)" className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-3xl outline-none font-bold transition-all" id="reg-name" />
                    <input type="password" placeholder="비밀번호 4자리" maxLength={4} className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-3xl outline-none font-bold transition-all tracking-widest" id="reg-pw" />
                    <div className="grid grid-cols-2 gap-3">
                      <button id="role-owner" onClick={() => { 
                        document.getElementById('role-owner')?.classList.add('bg-black', 'text-white');
                        document.getElementById('role-staff')?.classList.remove('bg-red-600', 'text-white');
                      }} className="py-4 bg-gray-50 rounded-2xl font-black text-sm transition-all border border-gray-100 bg-black text-white">점주 (Owner)</button>
                      <button id="role-staff" onClick={() => { 
                        document.getElementById('role-staff')?.classList.add('bg-red-600', 'text-white');
                        document.getElementById('role-owner')?.classList.remove('bg-black', 'text-white');
                      }} className="py-4 bg-gray-50 rounded-2xl font-black text-sm transition-all border border-gray-100">직원 (Staff)</button>
                    </div>
                  </div>
                  <button onClick={async () => {
                    const id = (document.getElementById('reg-id') as HTMLInputElement).value.toLowerCase().trim();
                    const pw = (document.getElementById('reg-pw') as HTMLInputElement).value.trim();
                    const name = (document.getElementById('reg-name') as HTMLInputElement).value.trim();
                    const isOwner = document.getElementById('role-owner')?.classList.contains('bg-black');

                    if(!id || !pw || !name) return alert('모든 정보를 입력하세요.');
                    if(pw.length !== 4) return alert('비밀번호는 4자리여야 합니다.');
                    if(appData.users.find(u => u.id === id)) return alert('이미 존재하는 아이디입니다.');

                    const newUser: User = { id, passwordHash: pw, nickname: name, role: isOwner ? 'OWNER' : 'STAFF', updatedAt: Date.now() };
                    
                    // 1. 데이터 즉시 업데이트 및 로컬 저장
                    const updatedUsers = [...appData.users, newUser];
                    const nextData = { ...appData, users: updatedUsers, lastUpdated: Date.now() };
                    saveLocally(nextData);
                    
                    // 2. 서버 강제 전송 시도
                    syncWithServer('POST', nextData);

                    // 3. ★ 핵심: 즉시 자동 로그인 처리 ★
                    setCurrentUser(newUser);
                    localStorage.setItem('twosome_session', JSON.stringify(newUser));
                    alert(`[${name}]님, 환영합니다!\n계정 생성이 완료되어 자동으로 로그인됩니다.`);
                  }} className="w-full py-6 bg-red-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                    <CheckCircle2 size={22} /> 등록 및 시작하기
                  </button>
                  <button onClick={() => setAuthMode('LOGIN')} className="w-full py-4 text-gray-400 font-bold hover:text-gray-900 transition-colors">이미 계정이 있습니다 (로그인)</button>
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
        <Navigation user={currentUser} syncStatus={syncStatus} lastSyncTime={lastSyncTime} onLogout={() => { if(confirm('로그아웃 하시겠습니까?')) { localStorage.removeItem('twosome_session'); setCurrentUser(null); } }} onShowDoctor={() => setShowDoctor(true)} />
        <main className="flex-1 pt-20 pb-24 lg:pb-10 px-4 md:px-10 max-w-[1600px] mx-auto w-full">
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
            <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl space-y-8 animate-in zoom-in duration-300">
              <ShieldCheck size={60} className="mx-auto text-green-600 mb-2" />
              <div className="space-y-2">
                <h3 className="text-3xl font-black italic tracking-tighter uppercase">Cloud Sync Monitor</h3>
                <p className="text-gray-400 font-bold text-sm">데이터 연동 무결성을 실시간 체크합니다.</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-3xl space-y-4 text-xs font-bold text-gray-500 text-left border border-gray-100">
                <div className="flex justify-between items-center"><span>Store Identifer</span> <span className="text-red-600 font-black uppercase text-sm">{storeId}</span></div>
                <div className="flex justify-between items-center"><span>Sync Health</span> <span className={syncStatus === 'connected' ? 'text-green-500' : 'text-red-500'}>{syncStatus.toUpperCase()}</span></div>
                <div className="flex justify-between items-center"><span>Staff Count</span> <span className="text-gray-900">{appData.users.length} members</span></div>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => { syncWithServer('GET'); setShowDoctor(false); }} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 italic uppercase shadow-xl hover:bg-red-700 transition-all"><RotateCcw size={20} /> Force Re-Sync</button>
                <button onClick={() => setShowDoctor(false)} className="w-full py-5 bg-black text-white rounded-2xl font-black">확인 완료</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HashRouter>
  );
};

export default App;
