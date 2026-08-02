import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useStore } from "./store/useStore";
import { Sidebar } from "./components/Sidebar";
import { SpotlightSidebar } from "./components/SpotlightSidebar";
import Dashboard from "./pages/Dashboard";
import CaseOpening from "./pages/CaseOpening";
import Admin from "./pages/Admin";
import History from "./pages/History";
import Contact from "./pages/Contact";
import Inventory from "./pages/Inventory";
import Upgrade from "./pages/Upgrade";
import WeaponLicense from "./pages/WeaponLicense";
import Tasks from "./pages/Tasks";
import { Toaster } from "./components/ui/sonner";
import { Home, PackageOpen, Swords, User, MessageSquare, BadgeCheck, ClipboardList } from "lucide-react";
import { ServerLoader } from "./components/ServerLoader";

export default function App() {
  const { checkAuth, fetchSettings, backgroundImage, isLoading, user, setUser } = useStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isServerReady, setIsServerReady] = useState(false);
  const [gameName, setGameName] = useState("");
  const [nameError, setNameError] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    // Handle fallback query param token
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    if (urlToken) {
      localStorage.setItem("token", urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Only fetch user & settings if the server is awake and ready
    if (isServerReady) {
      checkAuth();
      fetchSettings();
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        if (event.data.token) {
          localStorage.setItem("token", event.data.token);
        }
        checkAuth();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [checkAuth, fetchSettings, isServerReady]);

  if (!isServerReady) {
    return <ServerLoader onReady={() => setIsServerReady(true)} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111218] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-t-purple-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const saveGameName = async (event: React.FormEvent) => {
    event.preventDefault();
    setNameError("");
    setIsSavingName(true);
    try {
      const res = await fetch("/api/auth/game-name", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameName })
      });
      const data = await res.json();
      if (!res.ok) {
        setNameError(data.error || "ไม่สามารถบันทึกชื่อได้");
        return;
      }
      setUser(data);
    } catch {
      setNameError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setIsSavingName(false);
    }
  };

  // Fallback beautiful gaming background
  const finalBg = backgroundImage || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070";

  return (
    <BrowserRouter>
      <div className="flex h-screen w-full font-sans text-gray-200 selection:bg-purple-600/30 overflow-hidden relative">

        {/* Core Game Background (Brightened up to not be a black void) */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[#0f1015]" />
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.6] mix-blend-screen"
            style={{ backgroundImage: `url('${finalBg}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-transparent to-transparent opacity-80" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row w-full h-full">
          {/* Mobile Header (Sleek, No Hamburger) */}
          <div className="md:hidden flex items-center justify-between h-[60px] px-3 bg-[#0a0a0f] border-b border-white/5 z-50 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#00ff00] to-[#00ff88] font-black text-black flex items-center justify-center rounded-lg shadow-[0_0_10px_rgba(0,255,0,0.4)]">
                <span className="text-sm">L</span>
              </div>
              <span className="font-black text-lg text-white tracking-widest uppercase italic hidden sm:block">
                LAND<span className="text-[#00ff00]">-SERIES</span>
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="grid grid-cols-4 gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <span className="text-[#3b82f6] text-[10px] font-black">⚡</span>
                      <span className="text-white text-xs font-bold leading-none">{Math.floor(user.spins)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[#ffb700] text-[10px] font-black">✨</span>
                      <span className="text-white text-xs font-bold leading-none">{Math.floor(user.upgradePoints || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BadgeCheck className="h-3 w-3 text-emerald-400" />
                      <span className="text-white text-xs font-bold leading-none">{Math.floor(user.levelTickets || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ClipboardList className="h-3 w-3 text-violet-400" />
                      <span className="text-white text-xs font-bold leading-none">{Math.floor(user.taskPoints || 0)}</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg border border-[#ffb700]/50 overflow-hidden bg-[#050507]">
                    {user.avatar ? <img referrerPolicy="no-referrer" src={user.avatar} className="w-full h-full object-cover"/> : <User className="text-gray-400 p-1 w-full h-full" />}
                  </div>
                </div>
              ) : (
                <button onClick={() => {
                  const authWindow = window.open("", "oauth_popup", "width=600,height=700");
                  if (!authWindow) return alert("Please allow popups.");
                  fetch("/api/auth/url").then(res => res.json()).then(data => {
                    if (data.url) authWindow.location.href = data.url; else { authWindow.close(); alert("Failed to connect."); }
                  }).catch(() => authWindow.close());
                }} className="text-[10px] bg-gradient-to-r from-[#ffb700] to-[#ff8c00] text-black px-3 py-1.5 rounded-lg font-black tracking-widest uppercase shadow-[0_0_10px_rgba(255,183,0,0.4)]">
                  เข้าสู่ระบบ
                </button>
              )}
            </div>
          </div>

          {/* Desktop Sidebar (Hidden on mobile) */}
          <div className="hidden md:block fixed md:relative z-50 h-full transition-transform duration-300 ease-in-out">
            <Sidebar user={user} onClose={() => setIsSidebarOpen(false)} />
          </div>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden !scrollbar-hide pb-24 md:pb-6 pt-6 px-4 md:px-8 shadow-[inset_10px_0_30px_rgba(0,0,0,0.5)]">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/case/:id" element={<CaseOpening />} />
                <Route path="/history" element={<History />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/upgrade" element={<Upgrade />} />
                <Route path="/weapon-license" element={<WeaponLicense />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            
            {/* Nav Component rendered as part of layout */}
            <MobileBottomNav user={user} />
          </div>

          {/* Spotlight Sidebar */}
          <SpotlightSidebar />
        </div>

        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "linear-gradient(135deg, #161720, #0a0500)",
              border: "1px solid rgba(255, 183, 0, 0.5)",
              color: "#fff",
              borderRadius: "4px",
              boxShadow: "0 0 20px rgba(255,183,0,0.3)"
            }
          }}
        />
        {user && !user.gameName && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
            <form onSubmit={saveGameName} className="w-full max-w-md rounded-[28px] border border-[#ffb700]/30 bg-[#111218] p-8 shadow-[0_0_50px_rgba(255,183,0,0.18)]">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#ffb700]">Welcome</p>
              <h2 className="mt-3 text-2xl font-black text-white">ในเกมคุณชื่ออะไร?</h2>
              <p className="mt-2 text-sm text-gray-400">ชื่อนี้จะช่วยให้แอดมินจำคุณได้ และต้องไม่ซ้ำกับผู้เล่นอื่น</p>
              <input
                autoFocus
                maxLength={32}
                value={gameName}
                onChange={(event) => setGameName(event.target.value)}
                placeholder="กรอกชื่อในเกม 2-32 ตัวอักษร"
                className="mt-6 w-full rounded-xl border border-white/10 bg-[#090a0e] px-4 py-3 text-white outline-none focus:border-[#ffb700]"
              />
              {nameError && <p className="mt-2 text-sm font-bold text-red-400">{nameError}</p>}
              <button disabled={isSavingName} className="mt-5 w-full rounded-xl bg-[#ffb700] py-3 font-black text-black transition hover:bg-[#ffc733] disabled:cursor-wait disabled:opacity-60">
                {isSavingName ? "กำลังบันทึก..." : "ยืนยันชื่อในเกม"}
              </button>
            </form>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

function MobileBottomNav({ user }: any) {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0f] backdrop-blur-xl border-t border-white/5 z-50">
      <div className="grid grid-cols-6 items-end h-[70px] pb-2 px-1 relative">
        <NavSlot path="/" currentPath={path} label="หน้าหลัก" icon={<Home size={24} />} isExact />
        <NavSlot path="/inventory" currentPath={path} label="กระเป๋า" icon={<PackageOpen size={24} />} />
        <NavSlot path="/tasks" currentPath={path} label="ภารกิจ" icon={<ClipboardList size={24} />} />
        <NavSlot path="/upgrade" currentPath={path} label="ตีบวก" icon={<Swords size={24} />} />
        <NavSlot path="/weapon-license" currentPath={path} label="ใบอนุญาต" icon={<BadgeCheck size={24} />} />
        <NavSlot path="/contact" currentPath={path} label="ติดต่อ" icon={<MessageSquare size={24} />} />
      </div>
    </div>
  );
}

function NavSlot({ path, currentPath, label, icon, isExact = false }: { path: string, currentPath: string, label: string, icon: React.ReactNode, isExact?: boolean }) {
  const active = isExact ? currentPath === path : currentPath.startsWith(path);

  return (
    <Link to={path} className="flex flex-col items-center justify-end h-full gap-1.5 min-w-0 pb-1 relative z-10 group">
      {active && <div className="absolute top-0 w-6 h-[3px] bg-[#ffb700] rounded-b-md shadow-[0_0_8px_#ffb700]" />}
      <div className={`transition-colors ${active ? "text-[#ffb700]" : "text-gray-500"}`}>
        {icon}
      </div>
      <span className={`max-w-full truncate px-0.5 text-[9px] font-bold transition-colors ${active ? "text-[#ffb700]" : "text-gray-500"}`}>
        {label}
      </span>
    </Link>
  );
}
