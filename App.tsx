
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { User, UserRole, DailyReport, InventoryItem } from './types';
import { NoticeBoard } from './components/NoticeBoard';
import { HandoverBoard } from './components/HandoverBoard';
import { ChecklistBoard } from './components/ChecklistBoard';
import { WorkManagement } from './components/WorkManagement';
import { InventoryManagement } from './components/InventoryManagement';
import { ReservationManagement } from './components/ReservationManagement';
import { OwnerAdmin } from './components/OwnerAdmin';
import { 
  LogOut, 
  Menu, 
  X, 
  Megaphone, 
  ClipboardList, 
  CheckSquare, 
  Calendar, 
  Package, 
  ShieldAlert, 
  BookOpen, 
  Home, 
  Bell,
  Info
} from 'lucide-react';

const LoginPage: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');

  const handleAuth = () => {
    if (id.length < 4 || pw.length !== 4) {
      alert('아이디는 4자 이상, 비밀번호는 숫자 4자리여야 합니다.');
      return;
    }
    const users = JSON.parse(localStorage.getItem('twosome_users') || '[]');
    
    if (isSignUp) {
      if (role === 'OWNER') {
        const allowedOwnerIds = ['kms3191', 'ksk545'];
        if (!allowedOwnerIds.includes(id)) {
          alert('점주 계정은 승인된 관리자 아이디로만 생성이 가능합니다.');
          return;
        }
      }
      if (!nickname || nickname.length < 2) {
        alert('실명을 포함한 닉네임을 입력해주세요.');
        return;
      }
      if (users.find((u: User) => u.id === id)) {
        alert('이미 존재하는 아이디입니다.');
        return;
      }
      const newUser: User = { id, passwordHash: pw, nickname, role };
      localStorage.setItem('twosome_users', JSON.stringify([...users, newUser]));
      alert('가입 성공! 로그인해주세요.');
      setIsSignUp(false);
    } else {
      const user = users.find((u: User) => u.id === id && u.passwordHash === pw);
      if (user) {
        onLogin(user);
      } else {
        alert('아이디 또는 비밀번호가 일치하지 않습니다.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 pb-safe">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-8 border border-gray-100">
        <div className="text-center space-y-2">
          <div className="inline-block p-4 bg-red-600 rounded-2xl text-white shadow-lg mb-2">
            <Home size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Twosome Mgr</h1>
          <p className="text-gray-400 font-medium text-xs">매장 효율을 위한 전용 관리 시스템</p>
        </div>
        <div className="space-y-4">
          <input 
            type="text" placeholder="아이디"
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-100 font-bold"
            value={id} onChange={e => setId(e.target.value.toLowerCase())}
          />
          <input 
            type="password" placeholder="비밀번호 (숫자 4자리)" maxLength={4}
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-100 font-bold"
            value={pw} onChange={e => setPw(e.target.value.replace(/\D/g, ''))}
          />
          {isSignUp && (
            <div className="space-y-4">
              <input 
                type="text" placeholder="닉네임 (실명 필수)"
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-100 font-bold"
                value={nickname} onChange={e => setNickname(e.target.value)}
              />
              <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                <button onClick={() => setRole('STAFF')} className={`flex-1 py-3 rounded-xl font-black transition-all ${role === 'STAFF' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>직원</button>
                <button onClick={() => setRole('OWNER')} className={`flex-1 py-3 rounded-xl font-black transition-all ${role === 'OWNER' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400'}`}>점주</button>
              </div>
            </div>
          )}
          <button onClick={handleAuth} className="w-full py-5 bg-black text-white rounded-2xl font-black text-lg active:scale-95 transition-transform shadow-xl">
            {isSignUp ? '가입하기' : '로그인'}
          </button>
          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-sm font-bold text-gray-400 py-2">
            {isSignUp ? '이미 계정이 있나요? 로그인' : '처음이신가요? 회원가입'}
          </button>
        </div>
        <div className="pt-4 border-t border-dashed flex items-center gap-2 text-[10px] text-gray-400 font-medium">
          <Info size={12} /> 현재 기기에만 데이터가 저장되는 데모 버전입니다.
        </div>
      </div>
    </div>
  );
};

const Navigation: React.FC<{ user: User, onLogout: () => void }> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const checkAlerts = () => {
      if (user.role !== 'OWNER') return;
      const reports = JSON.parse(localStorage.getItem('twosome_pending_reports') || '[]');
      const rCount = reports.filter((r: DailyReport) => !r.isApproved).length;
      const inventory = JSON.parse(localStorage.getItem('twosome_inventory') || '[]');
      const iCount = inventory.filter((i: InventoryItem) => i.alertEnabled && i.count <= 2).length;
      setPendingCount(rCount + iCount);
    };
    checkAlerts();
    const timer = setInterval(checkAlerts, 5000);
    return () => clearInterval(timer);
  }, [user]);

  const mainLinks = [
    { path: '/notice', label: '공지', icon: <Megaphone size={20} /> },
    { path: '/checklist', label: '업무', icon: <CheckSquare size={20} /> },
    { path: '/reservation', label: '예약', icon: <BookOpen size={20} /> },
    { path: '/inventory', label: '재고', icon: <Package size={20} /> },
  ];

  const sidebarLinks = [
    ...mainLinks,
    { path: '/handover', label: '인계인수', icon: <ClipboardList size={20} /> },
    { path: '/work', label: '근무스케줄', icon: <Calendar size={20} /> },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-white border-r flex-col p-8 z-50">
        <h1 className="text-2xl font-black text-red-600 mb-10 tracking-tighter">TWOSOME</h1>
        <div className="flex-1 space-y-2">
          {sidebarLinks.map(link => (
            <Link key={link.path} to={link.path} 
              className={`flex items-center gap-4 px-5 py-3 rounded-2xl font-bold transition-all ${location.pathname === link.path ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {link.icon} {link.label}
            </Link>
          ))}
          {user.role === 'OWNER' && (
            <Link to="/admin" className={`flex items-center justify-between px-5 py-3 rounded-2xl font-black transition-all border-2 border-dashed ${location.pathname === '/admin' ? 'bg-black text-white border-black' : 'text-red-600 border-red-500 bg-red-50'}`}>
              <div className="flex items-center gap-4"><ShieldAlert size={20} /> 승인센터</div>
              {pendingCount > 0 && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingCount}</span>}
            </Link>
          )}
        </div>
        <div className="pt-6 border-t mt-auto">
          <button onClick={onLogout} className="w-full flex items-center gap-3 text-gray-400 font-bold hover:text-red-600 transition-colors">
            <LogOut size={20} /> 로그아웃
          </button>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 inset-x-0 h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-6 z-40">
        <h1 className="text-xl font-black text-red-600 tracking-tighter">TWOSOME</h1>
        <div className="flex items-center gap-4">
          {user.role === 'OWNER' && (
            <Link to="/admin" className="relative p-2 text-gray-800">
              <Bell size={24} />
              {pendingCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white animate-alert" />}
            </Link>
          )}
          <button onClick={() => setIsOpen(true)} className="p-2 text-gray-800"><Menu size={24} /></button>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t flex justify-around items-center h-16 pb-safe z-40 px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        {mainLinks.map(link => (
          <Link key={link.path} to={link.path} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${location.pathname === link.path ? 'text-red-600' : 'text-gray-400'}`}>
            {/* Fix: Added type casting to React.ReactElement<any> to allow 'size' property during cloneElement */}
            {React.cloneElement(link.icon as React.ReactElement<any>, { size: 22 })}
            <span className="text-[10px] font-black mt-1">{link.label}</span>
          </Link>
        ))}
        <button onClick={() => setIsOpen(true)} className="flex flex-col items-center justify-center w-full h-full text-gray-400">
          <Menu size={22} />
          <span className="text-[10px] font-black mt-1">더보기</span>
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-300">
          <div className="absolute right-0 inset-y-0 w-3/4 bg-white shadow-2xl p-8 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-10">
              <div className="font-black text-gray-900">전체 메뉴</div>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto scrollbar-hide">
              {sidebarLinks.map(link => (
                <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-4 p-4 rounded-2xl font-black ${location.pathname === link.path ? 'bg-red-600 text-white' : 'bg-gray-50 text-gray-600'}`}
                >
                  {link.icon} {link.label}
                </Link>
              ))}
              {user.role === 'OWNER' && (
                <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl font-black bg-black text-white">
                  <ShieldAlert size={20} /> 승인 센터
                </Link>
              )}
            </div>
            <div className="mt-auto pt-6 border-t space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-black text-gray-500 border border-gray-200">{user.nickname.slice(0,1)}</div>
                <div className="flex-1">
                  <div className="text-sm font-black text-gray-800">{user.nickname}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">{user.role === 'OWNER' ? '점주' : '직원'}</div>
                </div>
              </div>
              <button onClick={onLogout} className="w-full py-4 text-red-600 font-black text-sm bg-red-50 rounded-2xl">로그아웃</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('twosome_session');
    if (saved) setCurrentUser(JSON.parse(saved));
    const users = JSON.parse(localStorage.getItem('twosome_users') || '[]');
    setAllUsers(users);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('twosome_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('twosome_session');
  };

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
        <Navigation user={currentUser} onLogout={handleLogout} />
        <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0 px-4 md:px-10 overflow-x-hidden">
          <div className="max-w-4xl mx-auto py-6 md:py-12">
            <Routes>
              <Route path="/notice" element={<NoticeBoard currentUser={currentUser} />} />
              <Route path="/handover" element={<HandoverBoard currentUser={currentUser} />} />
              <Route path="/checklist" element={<ChecklistBoard currentUser={currentUser} />} />
              <Route path="/reservation" element={<ReservationManagement currentUser={currentUser} />} />
              <Route path="/work" element={<WorkManagement currentUser={currentUser} allUsers={allUsers} />} />
              <Route path="/inventory" element={<InventoryManagement currentUser={currentUser} />} />
              {currentUser.role === 'OWNER' && <Route path="/admin" element={<OwnerAdmin />} />}
              <Route path="*" element={<Navigate to="/notice" />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
