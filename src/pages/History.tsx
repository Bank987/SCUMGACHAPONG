import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { User, Zap, History as HistoryIcon, Clock, Package } from "lucide-react";

export default function History() {
  const { isAuthenticated, user } = useStore();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    fetch("/api/spin/history")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data);
        } else {
          setHistory([]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] max-w-7xl mx-auto">
        <h2 className="text-3xl font-black tracking-tight text-white mb-3">เข้าไม่ได้เว้ย!</h2>
        <p className="text-gray-400 font-bold tracking-wide">ล็อกอินก่อนดิวะ ถึงจะดูคลังเก็บของตัวเองได้</p>
      </div>
    );
  }

  const totalSpins = history.length;

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-8 pt-4">

      {/* Profile Header Segment (Rounded Edge) */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-[#14151c] border border-[#ffb700]/30 rounded-[24px] p-8 flex items-center gap-6 shadow-[0_0_15px_rgba(255,183,0,0.1)]">
          <div className="w-20 h-20 rounded-[18px] bg-[#1b1d26] border border-[#ffb700]/30 overflow-hidden flex items-center justify-center shrink-0">
            {user?.avatar ? (
              <img referrerPolicy="no-referrer" src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <User size={32} className="text-gray-400" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-100 tracking-wide uppercase">{user?.username}</h1>
            <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">User ID: {user?._id || 'HIDDEN'}</p>
          </div>
        </div>

        <div className="flex-[0.5] bg-[#14151c] border border-[#ffb700]/30 rounded-[24px] p-8 flex flex-col justify-center shadow-[0_0_15px_rgba(255,183,0,0.1)]">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-[#ffb700]" />
            <span className="text-[13px] font-bold text-gray-400 tracking-wide">SPINS เหลือ</span>
          </div>
          <p className="text-4xl font-black text-white">{Math.floor(user?.spins || 0)}</p>
        </div>

        <div className="flex-[0.5] bg-[#14151c] border border-[#ffb700]/30 rounded-[24px] p-8 flex flex-col justify-center shadow-[0_0_15px_rgba(255,183,0,0.1)]">
          <div className="flex items-center gap-2 mb-3">
            <Package size={16} className="text-[#ffb700]" />
            <span className="text-[13px] font-bold text-gray-400 tracking-wide">เปิดไปแล้ว (กล่อง)</span>
          </div>
          <p className="text-4xl font-black text-white">{totalSpins}</p>
        </div>
      </div>

      <div className="w-full h-px bg-[#ffb700]/20" />

      {/* History List Section */}
      <div className="bg-[#14151c] border border-[#ffb700]/30 rounded-[24px] overflow-hidden shadow-[0_0_15px_rgba(255,183,0,0.1)]">
        <div className="px-8 py-6 border-b border-[#ffb700]/30 flex gap-3 items-center">
          <HistoryIcon size={20} className="text-[#ffb700]" />
          <h2 className="text-xl font-bold text-white tracking-wide">ประวัติการดรอปของ</h2>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-[#1a1b23] rounded-[16px] animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-bold text-[16px] tracking-wide">คลังโล่งจัด ยังไม่ได้สุ่มของเลยไปกดสุ่มก่อนไป!</p>
          </div>
        ) : (
          <div className="divide-y divide-[#ffb700]/20">
            {history.map((item, idx) => {
              let badgeColor = "bg-gray-500/10 text-gray-400 border-gray-500/20";
              if (item.itemRarity === 'legendary') badgeColor = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
              if (item.itemRarity === 'epic') badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
              if (item.itemRarity === 'rare') badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";

              return (
                <div key={idx} className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-8 py-5 gap-4 hover:bg-white/[0.02] transition-colors">

                  {/* Left: Item Info */}
                  <div className="flex items-center gap-4 md:gap-5 w-full md:w-auto">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-[14px] bg-[#181920] border border-[#ffb700]/20 flex items-center justify-center overflow-hidden flex-shrink-0 p-2 shadow-inner">
                      <img referrerPolicy="no-referrer" src={item.itemImage} alt={item.itemName} className="max-w-full max-h-full object-contain drop-shadow-md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] md:text-[16px] font-bold text-white tracking-wide truncate">{item.itemName}</h3>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2">
                        <span className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeColor}`}>
                          {item.itemRarity || 'Unknown'}
                        </span>
                        <span className="text-[11px] md:text-[12px] font-bold text-gray-500 truncate">
                          จากกล่อง {item.caseId?.name || 'Case'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Date Info */}
                  <div className="text-left md:text-right flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-white/5 md:border-0">
                    <div className="flex items-center gap-1.5 text-gray-400 mb-0 md:mb-1">
                      <Clock size={14} />
                      <span className="text-[12px] md:text-[13px] font-bold">
                        {new Date(item.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <span className="text-[11px] md:text-[12px] text-gray-500 font-bold tracking-wider">
                      เวลา {new Date(item.createdAt).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
