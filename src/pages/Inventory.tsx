import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { toast } from "sonner";
import { Package, ArrowUpCircle, Shield } from "lucide-react";
import { motion } from "framer-motion";

interface InventoryItem {
    _id: string;
    caseName: string;
    itemName: string;
    itemImage: string;
    itemRarity: string;
    itemColor: string;
    upgradeLevel: number;
    createdAt: string;
}

export default function Inventory() {
    const { user, isAuthenticated, setUpgradePoints } = useStore();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [upgradingId, setUpgradingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        fetch("/api/spin/inventory")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setItems(data);
                } else {
                    console.error("Inventory fetch returned non-array:", data);
                    toast.error(data.error || "Failed to load inventory");
                    setItems([]);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch inventory", err);
                setLoading(false);
            });
    }, [isAuthenticated]);

    const handleUpgrade = async (item: InventoryItem) => {
        if (!isAuthenticated) return;

        const cost = 10 + ((item.upgradeLevel || 0) * 5);
        if ((user?.upgradePoints || 0) < cost) {
            toast.error(`REFINE POINT ไม่พอ! (ใช้ ${cost} แต้ม)`);
            return;
        }

        setUpgradingId(item._id);
        try {
            const res = await fetch("/api/spin/upgrade-item", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId: item._id })
            });
            const data = await res.json();

            if (res.ok) {
                setUpgradePoints(data.remainingPoints);
                if (data.success) {
                    toast.success(`ตีบวกสำเร็จ! ตอนนี้เป็น +${data.newLevel} แล้ว!`);
                    setItems(items.map(i => i._id === item._id ? { ...i, upgradeLevel: data.newLevel } : i));
                } else {
                    toast.error("ตีบวกแหก! แต้มหายฟรีๆ");
                }
            } else {
                toast.error(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (e) {
            toast.error("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
        } finally {
            setUpgradingId(null);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="max-w-6xl mx-auto py-20 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">กรุณาล็อกอินก่อนเข้าดูกระเป๋า</h2>
            </div>
        );
    }

    if (loading) {
        return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#ffb700] border-t-transparent rounded-full animate-spin"></div></div>;
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-3 mb-8">
                <Package className="w-8 h-8 text-[#ffb700]" />
                <h1 className="text-3xl font-black text-white uppercase italic tracking-wider">กระเป๋าของฉัน</h1>
            </div>

            {items.length === 0 ? (
                <div className="bg-[#111218]/80 border border-[#ffb700]/20 rounded-[24px] p-12 text-center">
                    <p className="text-gray-400 text-lg">ยังไม่มีของในกระเป๋า ไปเปิดกล่องกันเถอะ!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {items.map((item) => {
                        const level = item.upgradeLevel || 0;
                        const cost = 10 + (level * 5);
                        const isMaxLevel = level >= 10;

                        return (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#1a1b23] border border-white/5 rounded-xl overflow-hidden relative group"
                                style={{
                                    boxShadow: level > 0 ? `0 0 ${level * 2}px ${item.itemColor}40` : 'none',
                                    borderColor: level > 5 ? item.itemColor : 'rgba(255,255,255,0.05)'
                                }}
                            >
                                {/* Level Badge */}
                                <div className="absolute top-2 left-2 z-10 bg-black/80 px-2 py-1 rounded-md border border-white/10 flex items-center gap-1">
                                    <Shield className="w-3 h-3" style={{ color: item.itemColor }} />
                                    <span className="text-xs font-bold" style={{ color: item.itemColor }}>+{level}</span>
                                </div>

                                {item.caseName === "System" && (
                                    <div className="absolute top-2 right-2 z-10 bg-black/80 px-2 py-1 rounded-md border border-white/10 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                    </div>
                                )}

                                <div className="aspect-square p-4 flex items-center justify-center relative bg-gradient-to-b from-transparent to-black/40">
                                    <div
                                        className="absolute inset-0 opacity-20"
                                        style={{ background: `radial-gradient(circle at center, ${item.itemColor} 0%, transparent 70%)` }}
                                    />
                                    <img
                                        src={item.itemImage}
                                        alt={item.itemName}
                                        className="w-full h-full object-contain relative z-10 drop-shadow-2xl transition-transform group-hover:scale-110"
                                        style={{ filter: level > 0 ? `drop-shadow(0 0 ${level * 3}px ${item.itemColor})` : 'none' }}
                                    />
                                </div>

                                <div className="p-3 border-t border-white/5 bg-black/40">
                                    <p className="text-xs text-gray-400 truncate">{item.caseName}</p>
                                    <h3 className="text-sm font-bold text-white truncate" style={{ color: item.itemColor }}>
                                        {item.itemName}
                                    </h3>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
