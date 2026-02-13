
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
  Store, Loader2, Wifi, WifiOff, Clock, RotateCcw, ShieldCheck, User as UserIcon, Lock, ChevronRight, UserPlus, Info, HelpCircle, CheckCircle2, LayoutDashboard, RefreshCw
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
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 grid grid-cols-[140px_1fr_160px] items-center px-4 md:px-10 z-50 shadow-sm">
        <div className="flex items-center"><h1 className="text-base md:text-lg font-black text-red-600 tracking-tighter shrink-0 italic">TWOSOME</h1></div>
        <nav className="hidden lg:flex items-center justify-center gap-1 overflow-hidden">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${location.pathname === item.path ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>{item.label}</Link>
          ))}
          {user.role === 'OWNER' && <Link to="/admin" className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${location.pathname === '/admin' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>관리</Link>}
        </nav>
        <div className="flex items-center justify-end gap-2">
          <div className="hidden sm:flex flex-col items-end mr-1 text-right">
            <span className="text-[9px] font-black text-gray-900">{user.nickname} {user.role === 'OWNER' ? '점주' : ''}</span>
            <span className="text-[7px] font-bold text-green-500 flex items-center gap-0.5"><div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>연결됨</span>
          </div>
          <button onClick={onShowDoctor} className={`flex items-center justify-center gap-1 px-2 py-1 rounded-full text-[9px] font-black transition-all ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {syncStatus === 'connected' ? <Wifi size={10}/> : <WifiOff size={10}/>}
            <span>{sec > 0 ? `${sec}s` : 'OK'}</span>
          </button>
          <button onClick={onLogout} className="p-1.5 text-gray-300 hover:text-red-600"><LogOut size={18} /></button>
        </div>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex justify-around items-center z-50 lg:hidden pb-safe">
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
  const [isLoading, setIsLoading] = useState(false);
  
  const syncLock = useRef(false);
  const debounceTimer = useRef<any>(null);

  // 로컬 & 상태 동시 저장
  const saveAll = useCallback((newData: AppData) => {
    setAppData(newData);
    localStorage.setItem(`twosome_data_${storeId}`, JSON.stringify(newData));
    setLastSyncTime(Date.now());
  }, [storeId]);

  // 서버 통신 (핵심 로직)
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
              // 유저 목록은 로컬과 서버를 항상 합침 (계정 증발 방지 최우선)
              const serverUsers = data.users || [];
              const mergedUsers = [...serverUsers];
              prev.users.forEach(u => {
                if(!mergedUsers.find(m => m.id === u.id)) mergedUsers.push(u);
              });

              // 서버 데이터가 더 최신이거나 로컬에 유저가 없을 때만 전체 업데이트
              if ((data.lastUpdated || 0) >= prev.lastUpdated || prev.users.length === 0) {
                const finalData = { ...INITIAL_APP_DATA, ...data, users: mergedUsers };
                localStorage.setItem(`twosome_data_${storeId}`, JSON.stringify(finalData));
                return finalData;
              }
              // 로컬이 더 최신이면 유저만 합쳐서 유지
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
      setIsLoading(false);
    }
  }, [storeId]);

  // 폴링 설정
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

  // 세션 로드
  useEffect(() => {
    const saved = localStorage.getItem('twosome_session');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const handleUpdate = async (key: keyof AppData, updatedItems: any[]) => {
    if (!storeId) return;
    const nextData = { ...appData, [key]: updatedItems, lastUpdated: Date.now() };
    saveAll(nextData);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      syncLock.current = true;
      await syncWithServer('POST', nextData);
      syncLock.current = false;
    }, 1000);
  };

  if (!isInitialized && storeId) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[9999]">
        <Loader2 className="text-red-600 animate-spin mb-4" size={32} />
        <p className="font-black text-[10px] tracking-widest text-gray-300 uppercase">Twosome System Initializing...</p>
      </div>
    );
  }

  // 매장 연결 화면
  if (!storeId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-300">
          <div className="text-center space-y-3">
            <div className="inline-block p-4 bg-red-600 rounded-3xl text-white shadow-lg"><Store size={36} /></div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter italic">TWOSOME PRO</h1>
            <p className="text-gray-400 font-bold text-xs">매장 고유 코드를 입력하여<br/>데이터 동기화를 시작하세요.</p>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="매장 코드 (예: ts-pos-01)" className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-2xl outline-none font-black text-center text-xl transition-all lowercase" id="store-input" />
            <button onClick={() => { 
              const id = (document.getElementById('store-input') as HTMLInputElement).value?.trim().toLowerCase(); 
              if(id) { localStorage.setItem('twosome_store_id', id); window.location.reload(); }
            }} className="w-full py-5 bg-black text-white rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all">시스템 연동 시작</button>
          </div>
        </div>
      </div>
    );
  }

  // 로그인 / 회원가입 화면 (모바일 짤림 수정 버전)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:items-center md:justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-4xl bg-white rounded-3xl md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
          
          {/* 브랜딩 (모바일에서는 작게, 데스크탑에서는 왼쪽) */}
          <div className="bg-red-600 p-8 md:p-12 text-white md:w-5/12 flex flex-col justify-between">
            <div className="flex justify-between items-center md:block">
              <h2 className="text-xl font-black italic tracking-tighter">A TWOSOME PLACE</h2>
              <div className="md:hidden bg-white/20 px-2 py-1 rounded text-[9px] font-black uppercase">{storeId}</div>
            </div>
            <div className="hidden md:block mt-20 space-y-4">
              <h3 className="text-4xl font-black leading-tight tracking-tighter">Smart<br/>Partner.</h3>
              <p className="text-red-100 font-bold text-sm opacity-70">실시간 데이터 동기화 기반의<br/>프리미엄 매장 관리 솔루션</p>
            </div>
            <div className="hidden md:flex mt-10 items-center gap-2 text-[9px] font-black tracking-widest uppercase opacity-40">
              <LayoutDashboard size={14} /> <span>v5.0 Stable Sync</span>
            </div>
          </div>

          {/* 입력 폼 */}
          <div className="flex-1 p-8 md:p-12 bg-white">
            <div className="max-w-xs mx-auto space-y-8">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                    {authMode === 'LOGIN' ? '로그인' : '계정 생성'}
                  </h1>
                  <button onClick={() => { setIsLoading(true); syncWithServer('GET'); }} className="p-2 text-gray-300 hover:text-red-600 transition-colors">
                    <RefreshCw size={18} className={isLoading ? 'animate-spin text-red-600' : ''} />
                  </button>
                </div>
                <p className="text-gray-400 font-bold text-xs">{authMode === 'LOGIN' ? '관리 계정으로 접속하세요.' : '우리 매장 관리 그룹에 합류하세요.'}</p>
              </div>

              {authMode === 'LOGIN' ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-3">
                    <div className="relative">
                      <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input type="text" placeholder="아이디" className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-2xl outline-none font-bold transition-all lowercase" id="login-id" />
                    </div>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input type="password" placeholder="비번 4자리" maxLength={4} className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-2xl outline-none font-bold transition-all tracking-widest" id="login-pw" />
                    </div>
                  </div>
                  <button onClick={async () => {
                    const id = (document.getElementById('login-id') as HTMLInputElement).value.toLowerCase().trim();
                    const pw = (document.getElementById('login-pw') as HTMLInputElement).value.trim();
                    if(!id || !pw) return alert('모든 정보를 입력하세요.');
                    
                    const user = appData.users.find(u => u.id === id && u.passwordHash === pw);
                    if (user) { 
                      setCurrentUser(user); 
                      localStorage.setItem('twosome_session', JSON.stringify(user)); 
                    } else { 
                      alert('등록되지 않은 계정이거나 정보가 틀립니다.\n데이터 동기화(새로고침) 후 다시 시도해 보세요.'); 
                    }
                  }} className="w-full py-5 bg-black text-white rounded-2xl font-black text-lg shadow-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                    입장하기 <ChevronRight size={20}/>
                  </button>
                  <div className="pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
                    <button onClick={() => setAuthMode('REGISTER')} className="text-xs font-black text-gray-400 hover:text-red-600 flex items-center gap-1">
                      <UserPlus size={14}/> 신규 계정 등록하기
                    </button>
                    <button onClick={() => { if(confirm('매장 코드를 초기화하시겠습니까?')) { localStorage.clear(); window.location.reload(); } }} className="text-[9px] font-black text-gray-300 underline uppercase">매장 코드 재설정</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 animate-in slide-in-from-right-2 duration-300">
                  <div className="space-y-3">
                    <input type="text" placeholder="새 아이디" className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-2xl outline-none font-bold transition-all lowercase" id="reg-id" />
                    <input type="text" placeholder="이름(닉네임)" className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-2xl outline-none font-bold transition-all" id="reg-name" />
                    <input type="password" placeholder="비번 4자리" maxLength={4} className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-red-600 rounded-2xl outline-none font-bold transition-all tracking-widest" id="reg-pw" />
                    <div className="grid grid-cols-2 gap-2">
                      <button id="role-owner" onClick={() => { 
                        document.getElementById('role-owner')?.classList.add('bg-black', 'text-white');
                        document.getElementById('role-staff')?.classList.remove('bg-red-600', 'text-white');
                      }} className="py-4 bg-gray-50 rounded-xl font-black text-xs border border-gray-100 bg-black text-white">점주</button>
                      <button id="role-staff" onClick={() => { 
                        document.getElementById('role-staff')?.classList.add('bg-red-600', 'text-white');
                        document.getElementById('role-owner')?.classList.remove('bg-black', 'text-white');
                      }} className="py-4 bg-gray-50 rounded-xl font-black text-xs border border-gray-100">직원</button>
                    </div>
                  </div>
                  <button onClick={async () => {
                    const id = (document.getElementById('reg-id') as HTMLInputElement).value.toLowerCase().trim();
                    const pw = (document.getElementById('reg-pw') as HTMLInputElement).value.trim();
                    const name = (document.getElementById('reg-name') as HTMLInputElement).value.trim();
                    const isOwner = document.getElementById('role-owner')?.classList.contains('bg-black');

                    if(!id || !pw || !name) return alert('모든 정보를 입력하세요.');
                    if(pw.length !== 4) return alert('비밀번호는 숫자 4자리입니다.');
                    
                    const newUser: User = { id, passwordHash: pw, nickname: name, role: isOwner ? 'OWNER' : 'STAFF', updatedAt: Date.now() };
                    
                    // 1. 현재 데이터에 추가
                    const updatedUsers = [...appData.users, newUser];
                    const nextData = { ...appData, users: updatedUsers, lastUpdated: Date.now() };
                    
                    // 2. 즉시 로컬 저장 및 서버 전송
                    saveAll(nextData);
                    await syncWithServer('POST', nextData);

                    // 3. 즉시 로그인 처리
                    setCurrentUser(newUser);
                    localStorage.setItem('twosome_session', JSON.stringify(newUser));
                    alert(`${name}님, 계정 생성이 완료되어 자동으로 입장합니다!`);
                  }} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-red-700 transition-all">
                    등록 및 자동 로그인
                  </button>
                  <button onClick={() => setAuthMode('LOGIN')} className="w-full py-2 text-gray-400 font-bold text-xs">이미 계정이 있습니다</button>
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
        <main className="flex-1 pt-20 pb-24 lg:pb-10 px-4 md:px-10 max-w-[1400px] mx-auto w-full">
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
            <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl space-y-6 animate-in zoom-in duration-200">
              <ShieldCheck size={40} className="mx-auto text-green-600" />
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Sync Integrity</h3>
                <p className="text-gray-400 font-bold text-[9px]">데이터 연동 무결성 점검 시스템</p>
              </div>
              <div className="p-5 bg-gray-50 rounded-2xl space-y-3 text-[10px] font-bold text-gray-500 text-left">
                <div className="flex justify-between"><span>매장 코드</span> <span className="text-red-600 font-black">{storeId}</span></div>
                <div className="flex justify-between"><span>연결 상태</span> <span className={syncStatus === 'connected' ? 'text-green-500' : 'text-red-500'}>{syncStatus.toUpperCase()}</span></div>
                <div className="flex justify-between"><span>최종 갱신</span> <span className="text-gray-900">{new Date(appData.lastUpdated).toLocaleTimeString()}</span></div>
                <div className="flex justify-between"><span>직원 수</span> <span className="text-gray-900">{appData.users.length}명</span></div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => { syncWithServer('GET'); setShowDoctor(false); }} className="w-full py-4 bg-red-600 text-white rounded-xl font-black flex items-center justify-center gap-2 italic shadow-lg active:scale-95 transition-all"><RotateCcw size={16} /> 강제 새로고침</button>
                <button onClick={() => setShowDoctor(false)} className="w-full py-4 bg-black text-white rounded-xl font-black">닫기</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HashRouter>
  );
};

export default App;
