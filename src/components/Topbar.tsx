import { useEffect } from "react";
import { useStore } from "../store/useStore";
import { Button } from "./ui/button";
import { LogOut, Coins } from "lucide-react";

export default function Topbar() {
  const { user, isAuthenticated, logout, checkAuth } = useStore();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkAuth();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [checkAuth]);

  const handleLogin = async () => {
    // 1. Open popup synchronously to bypass browser popup blockers
    const authWindow = window.open("", "oauth_popup", "width=600,height=700");

    if (!authWindow) {
      alert("Please allow popups to login with Discord.");
      return;
    }

    try {
      // 2. Fetch the URL asynchronously
      const res = await fetch("/api/auth/url");
      const data = await res.json();

      if (data.url) {
        // 3. Set the popup's location to the OAuth URL
        authWindow.location.href = data.url;
      } else {
        console.error("No URL returned:", data);
        authWindow.close();
        alert(data.error || "Failed to get Discord login URL. Please check if DISCORD_CLIENT_ID is set.");
      }
    } catch (error) {
      console.error("Failed to get auth URL", error);
      authWindow.close();
      alert("Failed to connect to the server.");
    }
  };

  return (
    <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 z-20 bg-[#0a0a0a]/80 backdrop-blur-xl relative">
      {/* Tech accents */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-gradient-to-r from-transparent via-[#FFD700]/30 to-transparent"></div>

      <div className="flex items-center gap-4">
        {/* Search or Breadcrumbs could go here */}
        <div className="hidden md:flex items-center gap-2 text-white/30 text-xs font-mono uppercase tracking-widest">
          <span className="w-2 h-2 bg-[#FF4444] rounded-sm animate-pulse"></span>
          System Online // Secure Connection
        </div>
      </div>

      <div className="flex items-center gap-6">
        {isAuthenticated && user ? (
          <>
            <div className="flex items-center gap-3 bg-gradient-to-r from-white/5 to-transparent px-4 py-2 rounded-xl border border-white/10">
              <Coins className="w-5 h-5 text-[#FFD700]" />
              <div className="flex flex-col">
                <span className="text-[10px] text-[#FFD700] font-black uppercase tracking-widest leading-none mb-1">Gacha Point</span>
                <span className="text-sm font-bold leading-none">{user.spins}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold uppercase tracking-wider">{user.username}</span>
                <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">{user.role}</span>
              </div>
              <img
                src={user.avatar}
                alt={user.username}
                className="w-10 h-10 rounded-lg border-2 border-white/10"
              />
              <Button variant="ghost" size="icon" onClick={logout} className="text-white/50 hover:text-[#FF4444] hover:bg-[#FF4444]/10 ml-2 rounded-xl">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={handleLogin} className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold uppercase tracking-wider text-sm px-6 py-5 rounded-xl transition-all shadow-[0_0_20px_rgba(88,101,242,0.3)] hover:shadow-[0_0_30px_rgba(88,101,242,0.5)]">
            Login with Discord
          </Button>
        )}
      </div>
    </header>
  );
}
