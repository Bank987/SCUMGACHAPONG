import { useStore } from "../store/useStore";

export function SpotlightSidebar() {
    const { spotlightImages } = useStore();

    if (!spotlightImages || spotlightImages.length === 0) return null;

    return (
        <aside className="hidden xl:flex w-[300px] h-full flex-col bg-[#0f1015]/80 backdrop-blur-md border-l border-[#ffb700]/30 shadow-[-10px_0_30px_rgba(0,0,0,0.6)] z-40 p-4 gap-4 overflow-y-auto !scrollbar-hide">
            {spotlightImages.map((img, idx) => (
                <div key={idx} className="w-full rounded-2xl overflow-hidden border border-[#ffb700]/30 shadow-lg relative group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none" />
                    <img src={img} alt={`Spotlight ${idx + 1}`} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute bottom-4 left-4 z-20">
                        <span className="px-2 py-1 bg-[#ffb700]/20 text-[#ffb700] border border-[#ffb700]/30 rounded text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                            Legendary
                        </span>
                    </div>
                </div>
            ))}
        </aside>
    );
}

print 