import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, PackageOpen, LayoutDashboard, History as HistoryIcon, Shield, Swords, Flame } from "lucide-react";
import { useStore } from "../store/useStore";

interface SidebarProps {
  user?: { username: string; spins: number; upgradePoints?: number; avatar?: string; role?: string };
  onClose?: () => void;
}

export function Sidebar({ user, onClose }: SidebarProps) {
  const { logout, checkAuth } = useStore();
  const location = useLocation();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkAuth();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [checkAuth]);

  const handleLogin = () => {
    const authWindow = window.open("", "oauth_popup", "width=600,height=700");
    if (!authWindow) return alert("Please allow popups.");

    fetch("/api/auth/url")
      .then(res => res.json())
      .then(data => {
        if (data.url) authWindow.location.href = data.url;
        else { authWindow.close(); alert("Failed to connect."); }
      })
      .catch(() => authWindow.close());
  };

  const navLinks = [
    { name: "กล่องสุ่ม", path: "/", icon: <LayoutDashboard size={20} /> },
    { name: "อัปเกรด", path: "/upgrade", icon: <Swords size={20} /> },
    { name: "กระเป๋าของฉัน", path: "/inventory", icon: <PackageOpen size={20} /> },
    { name: "ประวัติ", path: "/history", icon: <HistoryIcon size={20} /> },
    { name: "ติดต่อแอดมิน", path: "/contact", icon: <Flame size={20} /> }
  ];

  return (
    <aside className="w-[280px] h-full flex flex-col bg-[#0f1015] border-r border-[#ffb700]/30 shadow-[10px_0_30px_rgba(0,0,0,0.6)] z-40 relative">
      <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#ffb700]/20 to-transparent pointer-events-none" />

      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 bg-[#0a0a0f] border-b-2 border-[#ffb700]/30">
        <Link to="/" className="flex items-center gap-3 group w-full">
          <div className="w-9 h-9 bg-gradient-to-br from-[#00ff00] to-[#00ff88] font-black text-black flex items-center justify-center rounded-xl shadow-[0_0_15px_rgba(0,255,0,0.4)]">
            <span>L</span>
          </div>
          <span className="font-black text-2xl text-white tracking-widest uppercase italic">
            LAND<span className="text-[#00ff00]">-SERIES</span>
          </span>
        </Link>
      </div>

      {/* User Section (Top) */}
      <div className="p-5 border-b border-[#ffb700]/30 bg-gradient-to-b from-[#14151c] to-[#0f1015]">
        {user ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#0a0a0f] border-2 border-[#ffb700]/50 p-0.5 shadow-[0_0_10px_rgba(255,183,0,0.2)]">
                {user.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover rounded-[10px]" />
                ) : (
                  <User size={20} className="text-gray-400 m-auto h-full" />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[14px] font-black text-white truncate uppercase tracking-wider">{user.username}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">กำลังเล่นอยู่</span>
                </div>
              </div>
            </div>

            <div className="mt-2 bg-[#050507] border border-[#ffb700]/30 p-3 flex flex-col gap-2 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Gacha Point 💰</span>
                <div className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                  <span className="text-blue-500 font-black">⚡</span>
                  <span className="font-black text-white tracking-wider text-[14px]">{Math.floor(user.spins)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">REFINE POINT 🛠</span>
                <div className="flex items-center gap-1.5 bg-[#ffb700]/10 px-2 py-0.5 rounded-lg border border-[#ffb700]/20">
                  <span className="text-[#ffb700] font-black">✨</span>
                  <span className="font-black text-white tracking-wider text-[14px]">{Math.floor(user.upgradePoints || 0)}</span>
                </div>
              </div>
            </div>

            <button onClick={logout} className="mt-1 w-full text-center py-2 text-[12px] font-bold text-gray-500 hover:text-white hover:bg-white/5 uppercase tracking-widest transition-colors rounded-xl border border-transparent hover:border-white/10">
              ล็อกเอาท์
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="w-full py-4 bg-[#0a0500] border-[2px] border-[#ffb700] text-[#ffb700] font-black uppercase tracking-widest text-[14px] rounded-xl hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,102,0,0.6),inset_0_0_20px_rgba(255,102,0,0.6)] hover:shadow-[0_0_30px_rgba(255,102,0,0.9),inset_0_0_30px_rgba(255,102,0,0.9)] hover:text-white"
          >
            ล็อกอินเข้าระบบ
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-6 space-y-1">
        <div className="px-4 mb-3 flex items-center gap-2">
          <div className="w-1 h-3 bg-[#ffb700] rounded-full shadow-[0_0_5px_rgba(255,183,0,0.5)]" />
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">เมนูหลัก</p>
        </div>
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              onClick={onClose}
              className={`flex items-center gap-4 px-4 py-3 font-bold tracking-wide text-[14px] rounded-xl transition-all duration-150 relative overflow-hidden group ${isActive
                ? "text-white bg-white/5"
                : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
                }`}
            >
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[60%] w-1 rounded-r-full bg-gradient-to-b from-[#ffb700] to-[#ff8c00] shadow-[0_0_10px_rgba(255,183,0,0.8)]" />}
              <span className={`relative z-10 ${isActive ? "text-[#ffb700] drop-shadow-[0_0_5px_rgba(255,183,0,0.5)]" : "text-gray-500 group-hover:text-gray-300"}`}>
                {link.icon}
              </span>
              <span className="relative z-10">{link.name}</span>

              {/* Hover sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
            </Link>
          );
        })}
      </div>

    </aside>
  );
}
