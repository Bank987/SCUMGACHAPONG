interface Item {
    name: string;
    image: string;
    rarity: "common" | "rare" | "epic" | "legendary";
}

interface ItemCardProps {
    item: Item;
    isSpinning?: boolean;
}

export function ItemCard({ item, isSpinning }: ItemCardProps) {
    const getRarityConfig = () => {
        switch (item.rarity) {
            case "legendary":
                return {
                    border: "border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)] group-hover:border-yellow-400 group-hover:shadow-[0_0_30px_rgba(234,179,8,0.4)]",
                    text: "text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]",
                    glow: "bg-yellow-500/20"
                };
            case "epic":
                return {
                    border: "border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)] group-hover:border-purple-400 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]",
                    text: "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]",
                    glow: "bg-purple-500/20"
                };
            case "rare":
                return {
                    border: "border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover:border-blue-400 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]",
                    text: "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]",
                    glow: "bg-blue-500/20"
                };
            default:
                return {
                    border: "border-white/10 group-hover:border-white/30",
                    text: "text-gray-300",
                    glow: "bg-white/5"
                };
        }
    };

    const config = getRarityConfig();

    return (
        <div
            className={`group relative h-[180px] flex flex-col items-center justify-between p-4 rounded-xl border-2 bg-gradient-to-b from-[#14151c] to-[#0a0a0f] transition-all duration-300 overflow-hidden transform-gpu will-change-transform ${config.border} ${isSpinning ? 'opacity-[0.8] scale-[0.98]' : 'hover:scale-[1.05] opacity-100 z-10'}`}
        >
            {/* Shine Sweep Overlay */}
            <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:animate-shine pointer-events-none" />

            {/* Internal Rarity Glow Blur */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full blur-[40px] pointer-events-none ${config.glow}`} />

            {/* Rarity Label */}
            <div className="absolute top-2 left-2 flex items-center bg-black/60 px-2 py-0.5 rounded border border-white/10 backdrop-blur-md">
                <span className={`text-[10px] font-black uppercase tracking-widest ${config.text}`}>{item.rarity}</span>
            </div>

            <div className="relative flex-1 flex items-center justify-center w-full mt-6 z-10">
                <img
                    src={item.image || "https://via.placeholder.com/150"}
                    alt={item.name}
                    className="max-h-[85px] object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] transform transition-transform duration-300 group-hover:scale-110"
                />
            </div>

            <div className="relative w-full text-center mt-3 z-10 bg-black/40 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm">
                <p className={`text-[12px] font-black tracking-wide truncate ${config.text}`}>{item.name}</p>
            </div>
        </div>
    );
}
