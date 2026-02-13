
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
  Store, Loader2, Wifi, WifiOff, Clock, RotateCcw, ShieldCheck, User as UserIcon, Lock, ChevronRight
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
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-[11px] font-black text-gray-900">{user.nickname} {user.role === 'OWNER' ? '점주님' : '님'}</span>
            <span className="text-[9px] font-bold text-gray-400">접속 중</span>
          </div>
          <button onClick={onShowDoctor} className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all min-w-[100px] ${syncStatus === 'connected' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600 animate-pulse'}`}>
            {syncStatus === 'connected' ? <Wifi size={12}/> : <WifiOff size={12}/>}
            <span>{syncStatus === 'connected' ? `${sec > 0 ? sec : 0}s 전` : '연결확인'}</span>
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
  
  const syncLock = useRef(false);
  const debounceTimer = useRef<any>(null);

  // 로컬 저장 및 상태 업데이트
  const updateLocal = useCallback((newData: AppData) => {
    setAppData(newData);
    localStorage.setItem(`twosome_data_${storeId}`, JSON.stringify(newData));
    setLastSyncTime(Date.now());
    setSyncStatus('connected');
  }, [storeId]);

  // 서버 동기화
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
              // 내 로컬 데이터보다 최신일 때만 (또는 내 로컬이 비어있을 때)
              if (data.lastUpdated > prev.lastUpdated || prev.users.length === 0) {
                localStorage.setItem(`twosome_data_${storeId}`, JSON.stringify(data));
                return data;
              }
              return prev;
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
      }, 20000);
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
    updateLocal(nextData);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      syncLock.current = true;
      await syncWithServer('POST', nextData);
      syncLock.current = false;
    }, 1500);
  };

  if (!isInitialized && storeId) {
    return <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white"><Loader2 className="text-red-600 animate-spin mb-4" size={40} /><p className="font-black italic text-sm tracking-tighter">ESTABLISHING CONNECTION...</p></div>;
  }

  // 매장 설정 화면
  if (!storeId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-12 shadow-2xl space-y-10 animate-in zoom-in duration-500">
          <div className="text-center space-y-3">
            <div className="inline-block p-5 bg-red-600 rounded-3xl text-white mb-2"><Store size={48} /></div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">TWOSOME PRO</h1>
            <p className="text-gray-400 font-bold text-sm">매장 통합 관리를 위해 코드를 입력해 주세요.</p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <input type="text" placeholder="매장 코드 입력" className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-red-600 font-black text-center text-2xl placeholder:text-gray-200 uppercase transition-all" id="store-input" />
            </div>
            <button onClick={() => { 
              const id = (document.getElementById('store-input') as HTMLInputElement).value?.trim().toLowerCase(); 
              if(id) { localStorage.setItem('twosome_store_id', id); window.location.reload(); }
            }} className="w-full py-6 bg-black text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-gray-900 active:scale-95 transition-all">시스템 연동 시작</button>
          </div>
        </div>
      </div>
    );
  }

  // [신규] 홈페이지 스타일의 전문적인 로그인 화면
  if (!currentUser) {
    return (
      <div className="min-h-screen flex bg-white font-sans">
        {/* 왼쪽 섹션: 브랜딩 비주얼 */}
        <div className="hidden lg:flex lg:w-1/2 bg-red-600 p-16 flex-col justify-between items-start text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-700 rounded-full -mr-96 -mt-96 opacity-50"></div>
          <div className="z-10"><h2 className="text-3xl font-black italic tracking-tighter">A TWOSOME PLACE</h2></div>
          <div className="z-10 space-y-6">
            <h3 className="text-6xl font-black leading-tight tracking-tighter">Premium<br/>Management<br/>Solution.</h3>
            <p className="text-red-100 font-bold max-w-md leading-relaxed">투썸플레이스 매장 운영의 효율을 극대화하는 스마트 워크페이스입니다. 공지, 인계, 체크리스트, 재고관리를 하나의 플랫폼에서 관리하세요.</p>
          </div>
          <div className="z-10 flex gap-4 text-xs font-black text-red-200 uppercase tracking-widest">
            <span>Copyright 2024</span>
            <span>•</span>
            <span>Twosome Pro v2.5</span>
          </div>
        </div>

        {/* 오른쪽 섹션: 로그인 폼 */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16">
          <div className="w-full max-w-md space-y-12 animate-in slide-in-from-right duration-500">
            <div className="space-y-4">
              <div className="lg:hidden mb-10"><h2 className="text-2xl font-black italic text-red-600 tracking-tighter">TWOSOME PLACE</h2></div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">반갑습니다.</h1>
              <p className="text-gray-400 font-bold">서비스 이용을 위해 계정 정보를 입력해 주세요.</p>
              <div className="inline-flex px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-black text-gray-400 uppercase border border-gray-100">매장코드: {storeId}</div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5 group">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-red-600">Username</label>
                  <div className="relative">
                    <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input type="text" placeholder="아이디 입력" className="w-full pl-12 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-red-600 font-bold transition-all" id="login-id" />
                  </div>
                </div>
                <div className="space-y-1.5 group">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-red-600">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input type="password" placeholder="비밀번호 4자리" maxLength={4} className="w-full pl-12 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-red-600 font-bold transition-all tracking-widest" id="login-pw" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 accent-red-600" defaultChecked />
                  <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700">로그인 상태 유지</span>
                </label>
                <button className="text-xs font-bold text-gray-400 hover:text-red-600 transition-colors">비밀번호 찾기</button>
              </div>

              <button onClick={async (e) => {
                const btn = e.currentTarget;
                btn.disabled = true;
                const id = (document.getElementById('login-id') as HTMLInputElement).value.toLowerCase().trim();
                const pw = (document.getElementById('login-pw') as HTMLInputElement).value.trim();
                
                // 1. 서버 시도 (하지만 기다리지 않고 로컬 먼저 대조)
                syncWithServer('GET');
                
                // 2. 내 로컬 데이터를 최우선적으로 믿고 로그인 (계정 생성 즉시 로그인을 위해)
                const user = appData.users.find(u => u.id === id && u.passwordHash === pw);
                
                if (user) { 
                  setCurrentUser(user); 
                  localStorage.setItem('twosome_session', JSON.stringify(user)); 
                } else { 
                  alert('아이디 또는 비밀번호가 올바르지 않습니다.'); 
                  btn.disabled = false;
                }
              }} className="w-full py-6 bg-black text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-gray-900 active:scale-95 transition-all flex items-center justify-center gap-3">
                로그인하기 <ChevronRight size={20}/>
              </button>

              <div className="pt-10 flex flex-col items-center gap-4 border-t border-gray-50">
                <p className="text-xs font-bold text-gray-400">아직 계정이 없으신가요?</p>
                <button onClick={() => {
                  const id = prompt('새로운 아이디를 입력하세요.')?.toLowerCase().trim();
                  if(!id) return;
                  if(appData.users.find(u => u.id === id)) return alert('이미 사용 중인 아이디입니다.');
                  const pw = prompt('사용할 비밀번호 4자리를 입력하세요.')?.trim();
                  if(!pw || pw.length !== 4) return alert('비밀번호는 반드시 4자리 숫자여야 합니다.');
                  const name = prompt('표시될 이름(닉네임)을 입력하세요.') || id;
                  const role = confirm('점주 계정으로 등록하시겠습니까? (확인:점주 / 취소:직원)') ? 'OWNER' : 'STAFF';

                  const newUser: User = { id, passwordHash: pw, nickname: name, role, updatedAt: Date.now() };
                  // handleUpdate는 내부적으로 로컬 저장을 수행함
                  handleUpdate('users', [...appData.users, newUser]);
                  alert(`[${name}]님, 계정 생성이 완료되었습니다.\n방금 만든 정보로 로그인해 주세요.`);
                }} className="px-10 py-4 border-2 border-gray-100 rounded-2xl font-black text-sm text-gray-600 hover:border-red-600 hover:text-red-600 transition-all">신규 계정 등록</button>
                <button onClick={() => { if(confirm('매장 코드를 초기화하시겠습니까?')) { localStorage.clear(); window.location.reload(); } }} className="text-[10px] font-black text-gray-300 underline uppercase tracking-tighter">매장 코드 재설정</button>
              </div>
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
                <h3 className="text-3xl font-black italic tracking-tighter">NETWORK DIAGNOSIS</h3>
                <p className="text-gray-400 font-bold text-sm">데이터 연동 상태를 확인합니다.</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-3xl space-y-4 text-xs font-bold text-gray-500 text-left border border-gray-100">
                <div className="flex justify-between items-center"><span>매장 식별 코드</span> <span className="text-red-600 font-black uppercase text-sm">{storeId}</span></div>
                <div className="flex justify-between items-center"><span>최종 동기화 시간</span> <span className="text-gray-900">{new Date(lastSyncTime).toLocaleTimeString()}</span></div>
                <div className="flex justify-between items-center"><span>유저 데이터 수</span> <span className="text-gray-900">{appData.users.length}명</span></div>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => { syncWithServer('GET'); setShowDoctor(false); }} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 italic uppercase shadow-xl hover:bg-red-700 transition-all"><RotateCcw size={20} /> Force Server Refresh</button>
                <button onClick={() => setShowDoctor(false)} className="w-full py-5 bg-black text-white rounded-2xl font-black">이전 화면으로</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HashRouter>
  );
};

export default App;
