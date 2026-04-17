import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
import { Toaster } from "./components/ui/sonner";
import { Menu, X } from "lucide-react";
import { ServerLoader } from "./components/ServerLoader";

export default function App() {
  const { checkAuth, fetchSettings, backgroundImage, isLoading, user } = useStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isServerReady, setIsServerReady] = useState(false);

  useEffect(() => {
    // Only fetch user & settings if the server is awake and ready
    if (isServerReady) {
      checkAuth();
      fetchSettings();
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
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
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between h-16 px-4 bg-[#0a0a0f] border-b border-[#ffb700]/30 z-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#00ff00] to-[#00ff88] font-black text-black flex items-center justify-center rounded-lg shadow-[0_0_10px_rgba(0,255,0,0.4)]">
                <span className="text-sm">L</span>
              </div>
              <span className="font-black text-xl text-white tracking-widest uppercase italic">
                LAND<span className="text-[#00ff00]">-SERIES</span>
              </span>
            </div>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-[#ffb700] p-2">
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Intense Sidebar */}
          <div className={`fixed md:relative z-50 h-full transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <Sidebar user={user} onClose={() => setIsSidebarOpen(false)} />
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden !scrollbar-hide pb-20 pt-6 px-4 md:px-8 shadow-[inset_10px_0_30px_rgba(0,0,0,0.5)]">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/case/:id" element={<CaseOpening />} />
                <Route path="/history" element={<History />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/upgrade" element={<Upgrade />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
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
      </div>
    </BrowserRouter>
  );
}
