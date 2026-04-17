import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface Drop {
    _id: string;
    user: string;
    avatar: string | null;
    itemName: string;
    itemImage: string;
    itemColor: string;
    itemRarity: string;
    spunAt: string;
}

export function LiveDropTicker() {
    const [drops, setDrops] = useState<Drop[]>([]);

    useEffect(() => {
        // Polling every 10 seconds for real-time vibe
        const fetchRecentDrops = () => {
            fetch("/api/spin/history/all")
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        setDrops(data);
                    }
                })
                .catch(err => console.error("Failed to fetch live drops:", err));
        };

        fetchRecentDrops();
        const interval = setInterval(fetchRecentDrops, 10000);
        return () => clearInterval(interval);
    }, []);

    // Display dummy data temporarily if the DB has no drops yet.
    const displayDrops = drops.length > 0 ? drops : [
        { _id: '1', user: "System", avatar: null, itemName: "AWP | รอสุ่มคนแรก...", itemImage: "https://raw.githubusercontent.com/steam-database/GameTracking-CS2/master/Protobufs/steammessages_base.proto", itemColor: "#b0b0b0", itemRarity: "common", spunAt: new Date().toISOString() },
    ];

    // We duplicate the array multiple times to ensure the seamless scrolling CSS animation never runs out of content.
    const scrollingDrops = [...displayDrops, ...displayDrops, ...displayDrops, ...displayDrops];

    return (
        <div className="w-full h-[66px] bg-[#0c0d12] border-b border-white/5 relative overflow-hidden flex items-center shadow-[0_5px_20px_rgba(0,0,0,0.8)] z-30">
            {/* Edge Fades */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0c0d12] via-[#0c0d12]/90 to-transparent z-20 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0c0d12] via-[#0c0d12]/90 to-transparent z-20 pointer-events-none" />

            {/* Live Label */}
            <div className="absolute left-0 top-0 bottom-0 px-6 bg-[#0c0d12] flex items-center z-30 border-r border-white/5 shadow-[5px_0_15px_rgba(0,0,0,0.8)]">
                <div className="flex items-center gap-2 pr-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-[pulse_1.5s_infinite] shadow-[0_0_10px_#ef4444]" />
                    <span className="text-[12px] font-black uppercase text-white tracking-widest flex items-center gap-1.5 drop-shadow-sm">
                        คนเปิดล่าสุด
                    </span>
                </div>
            </div>

            {/* Marquee Track using GPU-friendly infinite CSS animation */}
            <div className="flex items-center pl-[200px] w-full mt-1">
                <div className="flex shrink-0 animate-[ticker_60s_linear_infinite] gap-3">
                    {scrollingDrops.map((drop, idx) => (
                        <div
                            key={`${drop._id}-${idx}`}
                            className="flex items-center gap-3 pl-2 pr-5 py-1.5 bg-[#14151c] rounded-xl shrink-0 cursor-pointer hover:bg-white/5 transition-colors border border-white/5 border-b-[3px] shadow-sm relative group overflow-hidden"
                            style={{ borderBottomColor: drop.itemColor || '#fff' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="w-10 h-10 rounded-lg bg-[#1a1c23] border border-white/5 flex items-center justify-center shrink-0 p-1 relative shadow-inner">
                                <img src={drop.itemImage} className="max-w-full max-h-full object-contain drop-shadow-md z-10 group-hover:scale-110 transition-transform" alt={drop.itemName} />
                            </div>
                            <div className="flex flex-col">
                                <span
                                    className="text-[13px] font-bold truncate max-w-[150px] tracking-wide"
                                    style={{ color: drop.itemColor || '#fff' }}
                                >
                                    {drop.itemName}
                                </span>
                                <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">
                                    โดย {drop.user}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
        </div>
    );
}
