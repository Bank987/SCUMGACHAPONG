import { useState, useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import { toast } from "sonner";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { ArrowRight, Plus, Shield, Swords, Trash2, Package, ArrowUpCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { initAudio, playTickSound, playUpgradeSuccessSound, playUpgradeFailSound, playUpgradeSpinSound } from "../lib/audio";

interface InventoryItem {
    _id: string;
    caseName: string;
    itemName: string;
    itemImage: string;
    itemRarity: string;
    itemColor: string;
    upgradeLevel?: number;
}

const UPGRADE_RATES: Record<number, { success: number, stay: number, downgrade: number, downgradeTo: number }> = {
    0: { success: 0.60, stay: 0.40, downgrade: 0.00, downgradeTo: 0 },
    1: { success: 0.55, stay: 0.45, downgrade: 0.00, downgradeTo: 1 },
    2: { success: 0.50, stay: 0.50, downgrade: 0.00, downgradeTo: 2 },
    3: { success: 0.40, stay: 0.50, downgrade: 0.10, downgradeTo: 2 },
    4: { success: 0.40, stay: 0.50, downgrade: 0.10, downgradeTo: 3 },
    5: { success: 0.30, stay: 0.55, downgrade: 0.15, downgradeTo: 4 },
    6: { success: 0.30, stay: 0.55, downgrade: 0.15, downgradeTo: 5 },
    7: { success: 0.20, stay: 0.60, downgrade: 0.20, downgradeTo: 6 },
    8: { success: 0.20, stay: 0.60, downgrade: 0.20, downgradeTo: 7 },
    9: { success: 0.10, stay: 0.60, downgrade: 0.30, downgradeTo: 8 },
};

export default function Upgrade() {
    const { user, isAuthenticated } = useStore();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);

    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    const [isSpinning, setIsSpinning] = useState(false);
    const isSpinningRef = useRef(false);
    const [resultStatus, setResultStatus] = useState<'success' | 'stay' | 'downgrade' | null>(null);
    const [flash, setFlash] = useState<'success' | 'stay' | 'downgrade' | null>(null);
    const controls = useAnimation();

    useEffect(() => {
        if (!isAuthenticated) return;

        // Fetch inventory
        fetch("/api/spin/inventory")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setInventory(data);
                } else {
                    console.error("Inventory fetch returned non-array:", data);
                    toast.error(data.error || "Failed to load inventory");
                }
            })
            .catch(console.error);
    }, [isAuthenticated]);

    const handleSourceToggle = (item: InventoryItem) => {
        if (isSpinning) return;
        if (selectedItem?._id === item._id) {
            setSelectedItem(null);
        } else {
            setSelectedItem(item);
        }
    };

    const isMaxLevel = (selectedItem?.upgradeLevel || 0) >= 10;

    const lastTickAngle = useRef(0);

    const handleUpgrade = async () => {
        if (isSpinningRef.current) return;

        if (!selectedItem) {
            toast.error("Please select an item to upgrade");
            return;
        }

        const currentLvl = selectedItem.upgradeLevel || 0;
        if (currentLvl >= 10) {
            toast.error("Item is already at max level (+10)");
            return;
        }

        initAudio();
        isSpinningRef.current = true;
        setIsSpinning(true);
        setResultStatus(null);
        setFlash(null);
        lastTickAngle.current = 0;

        try {
            const res = await fetch("/api/spin/upgrade-item", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itemId: selectedItem._id
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upgrade failed");

            const status = data.status; // 'success', 'stay', 'downgrade'
            const rate = UPGRADE_RATES[currentLvl];

            // Calculate rotation
            const successAngle = rate.success * 360;
            const stayAngle = rate.stay * 360;
            // downgradeAngle is the rest

            const baseRotations = 360 * 15;

            const finalAngle = baseRotations + (Math.random() * 360);

            // Set a fixed fast spin duration
            const spinDuration = 8.3;

            // Play the spin sound
            playUpgradeSpinSound();

            // Play the result sound immediately (audio contains the suspense/spin)
            if (status === 'success') {
                playUpgradeSuccessSound();
            } else {
                playUpgradeFailSound();
            }

            await controls.start({
                rotate: [0, -60, finalAngle, finalAngle - 2, finalAngle],
                transition: {
                    duration: spinDuration,
                    times: [0, 0.15, 0.95, 0.98, 1], // Deeper wind-up, heavy stop with slight mechanical bounce
                    ease: ["easeInOut", [0.8, 0.0, 0.05, 1], "easeOut", "easeInOut"] // Extreme inertia
                }
            });

            setResultStatus(status);

            if (status === 'success') {
                setFlash('success');
                toast.success(`Upgrade Successful! Item is now +${data.newLevel}`);
            } else if (status === 'stay') {
                setFlash('stay');
                toast.error("Upgrade Failed! Item level remains the same.");
            } else {
                setFlash('downgrade');
                toast.error(`Upgrade Failed! Item dropped to +${data.newLevel}`);
            }

            // Update inventory
            fetch("/api/spin/inventory")
                .then((res) => res.json())
                .then((invData) => {
                    if (Array.isArray(invData)) {
                        setInventory(invData);
                        // Update selected item to reflect new level
                        const updatedItem = invData.find((i: any) => i._id === selectedItem._id);
                        if (updatedItem) setSelectedItem(updatedItem);
                    }
                });

        } catch (err: any) {
            toast.error(err.message);
            setIsSpinning(false);
            isSpinningRef.current = false;
            if (err.message.includes("ถูกระงับ")) {
                setTimeout(() => {
                    window.location.href = "/";
                }, 2000);
            }
        }
    };

    const resetSpinner = () => {
        setResultStatus(null);
        setFlash(null);
        setIsSpinning(false);
        isSpinningRef.current = false;
        controls.set({ rotate: 0 });
    };

    if (!isAuthenticated) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <Shield className="w-16 h-16 text-zinc-600 mx-auto" />
                    <h2 className="text-2xl font-bold text-white">Please login to upgrade items</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative bg-transparent overflow-hidden">
            {/* Sleek Professional Background matching site theme */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Subtle Ambient Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1500px] h-[1500px] bg-[radial-gradient(circle_at_center,rgba(255,183,0,0.03)_0%,transparent_60%)]" />
                {/* Noise Texture */}
                <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
            </div>

            <div className="max-w-[1400px] mx-auto space-y-8 relative z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-widest uppercase italic">
                            <Swords className="w-8 h-8 text-[#ffb700]" />
                            Item Upgrade
                        </h1>
                        <p className="text-gray-400 mt-2 font-bold text-sm uppercase tracking-wider">Enhance your items to higher levels. Beware of downgrades!</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Inventory Selection */}
                    <div className={cn(
                        "lg:col-span-4 bg-[#0a0a0f]/90 backdrop-blur-xl border border-[#ffb700]/20 rounded-2xl p-5 flex flex-col h-[500px] lg:h-[700px] shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all duration-500",
                        isSpinning && "opacity-50 grayscale-[30%] pointer-events-none"
                    )}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
                                <Package className="w-4 h-4 text-[#ffb700]" /> Select Item
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {inventory.filter(item => item.caseName === "System").length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-3">
                                    <Package className="w-10 h-10 opacity-20" />
                                    <p className="font-bold uppercase tracking-widest text-xs">Inventory Empty</p>
                                </div>
                            ) : (
                                inventory.filter(item => item.caseName === "System").map((item) => {
                                    const isSelected = selectedItem?._id === item._id;
                                    const lvl = item.upgradeLevel || 0;
                                    return (
                                        <div
                                            key={item._id}
                                            onClick={() => handleSourceToggle(item)}
                                            className={cn(
                                                "flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300 border group relative overflow-hidden",
                                                isSelected
                                                    ? "bg-[#ffb700]/10 border-[#ffb700]/50 shadow-[0_0_15px_rgba(255,183,0,0.15)]"
                                                    : "bg-[#050507] border-white/5 hover:bg-white/[0.02] hover:border-[#ffb700]/30"
                                            )}
                                        >
                                            <div className="w-12 h-12 bg-[#0a0a0f] rounded-lg flex items-center justify-center p-2 border border-white/5 group-hover:scale-105 transition-transform duration-500 shadow-inner relative">
                                                <img src={item.itemImage} alt={item.itemName} className="w-full h-full object-contain drop-shadow-md" />
                                                <div className="absolute -top-2 -right-2 bg-[#ffb700] text-black text-[10px] font-black px-1.5 py-0.5 rounded-md border border-[#0a0a0f]">
                                                    +{lvl}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-200 truncate group-hover:text-white transition-colors uppercase tracking-wider">{item.itemName}</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: item.itemColor || '#ccc' }}>{item.itemRarity}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Center: Upgrade Spinner */}
                    <div className={cn(
                        "lg:col-span-4 bg-[#0a0a0f]/90 backdrop-blur-xl border border-[#ffb700]/20 rounded-2xl p-8 flex flex-col items-center justify-between relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] h-[500px] lg:h-[700px] transition-all duration-500"
                    )}>
                        {/* Professional Flash Effect */}
                        <div className={cn(
                            "absolute inset-0 z-50 pointer-events-none transition-all duration-500 mix-blend-screen flex items-center justify-center",
                            flash ? "opacity-100" : "opacity-0"
                        )}>
                            <div className={cn(
                                "absolute w-[1200px] h-[1200px] transition-transform duration-500 ease-out",
                                flash === 'success' ? "bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.9)_0%,rgba(16,185,129,0.5)_30%,transparent_70%)] scale-100" :
                                    flash === 'stay' ? "bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.9)_0%,rgba(249,115,22,0.5)_30%,transparent_70%)] scale-100" :
                                        "bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.9)_0%,rgba(220,38,38,0.5)_30%,transparent_70%)] scale-100",
                                !flash && "scale-0"
                            )} />
                            {/* Blinding white core */}
                            <div className={cn(
                                "absolute w-[600px] h-[600px] transition-all duration-300 ease-out bg-[radial-gradient(circle_at_center,rgba(255,255,255,1)_0%,transparent_50%)]",
                                flash ? "scale-100 opacity-100" : "scale-0 opacity-0"
                            )} />
                            {/* Sharp horizontal light sweep */}
                            <div className={cn(
                                "absolute w-[200%] h-[4px] transition-all duration-700 ease-out",
                                flash === 'success' ? "bg-[#10b981] scale-x-100 opacity-0 shadow-[0_0_60px_10px_rgba(16,185,129,1)]" :
                                    flash === 'stay' ? "bg-[#f97316] scale-x-100 opacity-0 shadow-[0_0_60px_10px_rgba(249,115,22,1)]" :
                                        "bg-[#dc2626] scale-x-0 opacity-100 shadow-[0_0_60px_10px_rgba(220,38,38,1)]"
                            )} />
                        </div>

                        {/* Sleek Result Overlay */}
                        {resultStatus !== null && (
                            <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none bg-[#0a0a0f]/80 backdrop-blur-md">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5, filter: "brightness(3) blur(10px)" }}
                                    animate={{ opacity: 1, scale: 1, filter: "brightness(1) blur(0px)" }}
                                    transition={{ duration: 0.4, type: "spring", bounce: 0.5 }}
                                    className="text-center relative w-full px-4"
                                >
                                    {/* Massive background glow for the text */}
                                    <div className={cn(
                                        "absolute inset-0 blur-[80px] opacity-100 -z-10",
                                        resultStatus === 'success' ? "bg-[#10b981]" :
                                            resultStatus === 'stay' ? "bg-[#f97316]" :
                                                "bg-[#dc2626]"
                                    )} />

                                    <h2 className={cn(
                                        "text-3xl sm:text-4xl md:text-6xl font-black tracking-[0.1em] md:tracking-[0.15em] uppercase italic text-white break-words",
                                        resultStatus === 'success' ? "drop-shadow-[0_0_40px_rgba(16,185,129,1)] drop-shadow-[0_0_80px_rgba(16,185,129,0.8)]" :
                                            resultStatus === 'stay' ? "drop-shadow-[0_0_40px_rgba(249,115,22,1)] drop-shadow-[0_0_80px_rgba(249,115,22,0.8)]" :
                                                "drop-shadow-[0_0_40px_rgba(220,38,38,1)] drop-shadow-[0_0_80px_rgba(220,38,38,0.8)]"
                                    )}>
                                        {resultStatus === 'success' ? "Success" : resultStatus === 'stay' ? "Failed" : "Downgraded"}
                                    </h2>
                                </motion.div>
                            </div>
                        )}

                        {/* Top Stats */}
                        <div className="w-full flex justify-between items-center bg-[#050507] rounded-xl border border-[#ffb700]/20 p-4 shadow-inner">
                            <div className="text-center flex-1">
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">Current Level</p>
                                <p className="text-xl font-mono font-black text-white">+{selectedItem?.upgradeLevel || 0}</p>
                            </div>
                            <div className="px-4">
                                <ArrowRight className={cn("w-5 h-5 transition-colors", isSpinning ? "text-[#ffb700] animate-pulse" : "text-gray-600")} />
                            </div>
                            <div className="text-center flex-1">
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">Target Level</p>
                                <p className="text-xl font-mono font-black text-[#ffb700]">{isMaxLevel ? "MAX" : `+${selectedItem ? (selectedItem.upgradeLevel || 0) + 1 : 0}`}</p>
                            </div>
                        </div>

                        {/* The Spinner UI - Professional & Sleek */}
                        <div className="relative w-72 h-72 flex items-center justify-center my-8">
                            {/* Outer Thin Ring */}
                            <div className="absolute inset-0 rounded-full border-2 border-[#ffb700]/10 shadow-[inset_0_0_30px_rgba(255,183,0,0.05)]" />

                            {/* SVG Circle - Ignition Style Spinner */}
                            <AnimatePresence>
                                {selectedItem && (
                                    <motion.div
                                        className="absolute inset-0 w-full h-full"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
                                    >
                                        <div className="absolute inset-0 w-full h-full animate-[spin_10s_linear_infinite]">
                                            <motion.svg
                                                className="absolute inset-0 w-full h-full"
                                                viewBox="0 0 100 100"
                                                initial={{ scale: 0.5, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 50,
                                                    damping: 12,
                                                    mass: 1.5
                                                }}
                                            >
                                                {/* Faint background track */}
                                                <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,183,0,0.1)" strokeWidth="2" />

                                                {/* The main glowing segment */}
                                                <motion.circle
                                                    cx="50" cy="50" r="46"
                                                    fill="none"
                                                    stroke="#ffb700"
                                                    strokeWidth="3"
                                                    strokeDasharray="100 200"
                                                    className="drop-shadow-[0_0_12px_rgba(255,183,0,0.8)]"
                                                    strokeLinecap="round"
                                                    initial={{ strokeDashoffset: 289 }}
                                                    animate={{ strokeDashoffset: 0 }}
                                                    transition={{ duration: 1.5, ease: [0.25, 1, 0.5, 1] }}
                                                />

                                                {/* Ignition Flash (Shockwave) */}
                                                <motion.circle
                                                    cx="50" cy="50" r="46"
                                                    fill="none"
                                                    stroke="#ffb700"
                                                    strokeWidth="6"
                                                    initial={{ scale: 0.8, opacity: 1 }}
                                                    animate={{ scale: 1.1, opacity: 0 }}
                                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                                    style={{ transformOrigin: "center" }}
                                                />
                                            </motion.svg>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Center Hub */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                                <div className="w-28 h-28 bg-gradient-to-b from-[#14151c] to-[#0a0a0f] rounded-full border-2 border-[#ffb700]/20 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                                    <span className="text-3xl font-black text-white tracking-tight">
                                        {selectedItem ? (isMaxLevel ? 0 : (UPGRADE_RATES[selectedItem.upgradeLevel || 0].success * 100).toFixed(0)) : 0}<span className="text-lg text-[#10b981]">%</span>
                                    </span>
                                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-1">Success</span>
                                </div>
                            </div>

                            {/* The spinning needle */}
                            <motion.div
                                className="absolute inset-0 z-10"
                                animate={controls}
                                style={{ originX: 0.5, originY: 0.5, willChange: "transform" }}
                                onUpdate={(latest) => {
                                    if (latest.rotate !== undefined) {
                                        const currentAngle = typeof latest.rotate === 'number' ? latest.rotate : parseFloat(latest.rotate as string);
                                        if (Math.abs(currentAngle - lastTickAngle.current) >= 30) {
                                            lastTickAngle.current = currentAngle;
                                        }
                                    }
                                }}
                            >
                                {/* Sleek Needle */}
                                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[3px] h-[35px] bg-white shadow-[0_0_15px_3px_rgba(255,255,255,0.6)] rounded-full" />
                                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[1px] h-[35px] bg-white" />
                            </motion.div>
                        </div>

                        {/* Action Area */}
                        <div className="w-full relative z-20 h-16 flex items-center justify-center">
                            {resultStatus !== null ? (
                                <div className="w-full animate-in fade-in duration-500">
                                    <button
                                        onClick={resetSpinner}
                                        className="w-full py-3 bg-[#0a0500] border-[2px] border-[#ffb700] text-[#ffb700] font-black uppercase tracking-widest text-[14px] rounded-xl hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,102,0,0.4),inset_0_0_20px_rgba(255,102,0,0.4)] hover:shadow-[0_0_30px_rgba(255,102,0,0.6),inset_0_0_30px_rgba(255,102,0,0.6)] hover:text-white"
                                    >
                                        Continue
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleUpgrade}
                                    disabled={isSpinning || !selectedItem || (selectedItem.upgradeLevel || 0) >= 10}
                                    className={cn(
                                        "w-full py-3 rounded-xl font-black text-[14px] uppercase tracking-widest transition-all duration-300 border-[2px]",
                                        isSpinning || !selectedItem || (selectedItem.upgradeLevel || 0) >= 10
                                            ? "bg-[#050507] text-gray-600 cursor-not-allowed border-white/5"
                                            : "bg-[#0a0500] border-[#ffb700] text-[#ffb700] hover:scale-[1.02] shadow-[0_0_20px_rgba(255,102,0,0.6),inset_0_0_20px_rgba(255,102,0,0.6)] hover:shadow-[0_0_30px_rgba(255,102,0,0.9),inset_0_0_30px_rgba(255,102,0,0.9)] hover:text-white"
                                    )}
                                >
                                    {isSpinning ? "Processing..." : (selectedItem?.upgradeLevel || 0) >= 10 ? "คุณถึงเทียร์สูงสุดแล้ว" : "Initiate Upgrade"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Target Selection / Preview */}
                    <div className={cn(
                        "lg:col-span-4 bg-[#0a0a0f]/90 backdrop-blur-xl border border-[#ffb700]/20 rounded-2xl p-5 flex flex-col h-[500px] lg:h-[700px] shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all duration-500",
                        isSpinning && "opacity-50 grayscale-[30%] pointer-events-none"
                    )}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
                                <ArrowUpCircle className="w-4 h-4 text-[#ffb700]" /> Upgrade Preview
                            </h2>
                        </div>

                        {selectedItem ? (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                                {/* Current Item */}
                                <div className="p-6 bg-[#050507] rounded-xl border border-white/10 flex flex-col items-center relative group overflow-hidden shadow-inner w-full">
                                    <div className="w-24 h-24 flex items-center justify-center mb-4 relative z-10">
                                        <img src={selectedItem.itemImage} alt={selectedItem.itemName} className="max-w-full max-h-full object-contain drop-shadow-xl opacity-50" />
                                    </div>
                                    <p className="text-center font-bold text-gray-400 text-sm relative z-10 uppercase tracking-wider">{selectedItem.itemName}</p>
                                    <div className="mt-2 px-4 py-1 bg-[#0a0a0f] rounded-lg text-xs font-mono font-black text-gray-500 border border-white/5 relative z-10">
                                        Current: +{selectedItem.upgradeLevel || 0}
                                    </div>
                                </div>

                                <ArrowRight className="w-8 h-8 text-[#ffb700] animate-pulse rotate-90 lg:rotate-0" />

                                {/* Upgraded Item */}
                                <div className="p-6 bg-[#050507] rounded-xl border border-[#ffb700]/30 flex flex-col items-center relative group overflow-hidden shadow-[inset_0_0_20px_rgba(255,183,0,0.05)] w-full">
                                    <div className="w-32 h-32 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-700 ease-out relative z-10">
                                        <img src={selectedItem.itemImage} alt={selectedItem.itemName} className="max-w-full max-h-full object-contain drop-shadow-[0_0_15px_rgba(255,183,0,0.5)]" />
                                    </div>
                                    <p className="text-center font-bold text-white text-lg relative z-10 uppercase tracking-wider">{selectedItem.itemName}</p>
                                    <div className="mt-4 px-6 py-2 bg-[#0a0a0f] rounded-lg text-sm font-mono font-black text-[#ffb700] border border-[#ffb700]/20 relative z-10 shadow-inner">
                                        {isMaxLevel ? "MAX LEVEL" : `Next: +${(selectedItem.upgradeLevel || 0) + 1}`}
                                    </div>
                                </div>

                                {/* Probabilities */}
                                <div className="w-full grid grid-cols-3 gap-2 mt-4">
                                    <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg p-2 text-center">
                                        <p className="text-[9px] text-[#10b981] font-bold uppercase tracking-widest mb-1">Success</p>
                                        <p className="text-sm font-mono font-black text-white">{isMaxLevel ? "0" : (UPGRADE_RATES[selectedItem.upgradeLevel || 0].success * 100).toFixed(0)}%</p>
                                    </div>
                                    <div className="bg-[#f97316]/10 border border-[#f97316]/30 rounded-lg p-2 text-center">
                                        <p className="text-[9px] text-[#f97316] font-bold uppercase tracking-widest mb-1">Fail (Stay)</p>
                                        <p className="text-sm font-mono font-black text-white">{isMaxLevel ? "0" : (UPGRADE_RATES[selectedItem.upgradeLevel || 0].stay * 100).toFixed(0)}%</p>
                                    </div>
                                    <div className="bg-[#991b1b]/10 border border-[#991b1b]/30 rounded-lg p-2 text-center">
                                        <p className="text-[9px] text-[#ef4444] font-bold uppercase tracking-widest mb-1">Downgrade</p>
                                        <p className="text-sm font-mono font-black text-white">{isMaxLevel ? "0" : (UPGRADE_RATES[selectedItem.upgradeLevel || 0].downgrade * 100).toFixed(0)}%</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 space-y-4">
                                <ArrowUpCircle className="w-12 h-12 opacity-20" />
                                <p className="font-bold uppercase tracking-widest text-xs text-center">Select an item from your<br />inventory to preview upgrade</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
