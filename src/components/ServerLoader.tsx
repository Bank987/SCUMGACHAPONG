import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ServerLoader({ onReady }: { onReady: () => void }) {
    const [tipsIndex, setTipsIndex] = useState(0);
    const [isWaking, setIsWaking] = useState(true);

    const tips = [
        "กำลังเสียบปลั๊กเซิร์ฟเวอร์บน Render...",
        "Free Tier อาจใช้เวลาตื่น 30-50 วินาที...",
        "กำลังเรียกพลังแห่งกาชาปอง...",
        "อย่าเพิ่งรีเฟรชหน้านะ! พี่แอดมินกำลังปั่นไฟเซิร์ฟ...",
        "กำลังเชื่อมต่อดาต้าเบส...",
    ];

    useEffect(() => {
        const tipInterval = setInterval(() => {
            setTipsIndex((prev) => (prev + 1) % tips.length);
        }, 4000);
        return () => clearInterval(tipInterval);
    }, [tips.length]);

    useEffect(() => {
        let mounted = true;

        const pingServer = async () => {
            try {
                const res = await window.fetch("/api/health");
                if (res.ok) {
                    if (mounted) {
                        setIsWaking(false);
                        setTimeout(onReady, 1000); // 1 sec delay to fade out
                    }
                    return true;
                }
            } catch (err) {
                // failed to fetch, still sleeping
            }
            return false;
        };

        const loop = async () => {
            const ok = await pingServer();
            if (!ok && mounted) {
                setTimeout(loop, 3000);
            }
        };

        loop();

        return () => {
            mounted = false;
        };
    }, [onReady]);

    return (
        <AnimatePresence>
            {isWaking && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0d0d12] overflow-hidden"
                >
                    {/* Ambient Glow */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-[#ffb700] rounded-full blur-[120px] opacity-20 animate-pulse" />
                    </div>

                    {/* Gacha Elements */}
                    <div className="relative z-10 flex flex-col items-center">
                        {/* Bobbing Capsule SVG */}
                        <motion.div
                            animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                            className="relative w-32 h-32 mb-8"
                        >
                            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Capsule Bottom */}
                                <path d="M20 50 C20 75 35 90 50 90 C65 90 80 75 80 50 Z" fill="#E6E6E6" />
                                <path d="M20 50 C20 75 35 90 50 90 C65 90 80 75 80 50 Z" fill="url(#bottomGrad)" />
                                {/* Capsule Top */}
                                <path d="M20 50 C20 25 35 10 50 10 C65 10 80 25 80 50 Z" fill="#ffb700" />
                                <path d="M20 50 C20 25 35 10 50 10 C65 10 80 25 80 50 Z" fill="url(#topGrad)" opacity="0.8" />
                                {/* Center Ring */}
                                <rect x="18" y="48" width="64" height="4" rx="2" fill="#333333" />
                                {/* Highlight */}
                                <ellipse cx="40" cy="25" rx="8" ry="4" transform="rotate(-30 40 25)" fill="white" opacity="0.6" />

                                <defs>
                                    <linearGradient id="topGrad" x1="20" y1="10" x2="80" y2="50">
                                        <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="black" stopOpacity="0.2" />
                                    </linearGradient>
                                    <linearGradient id="bottomGrad" x1="20" y1="50" x2="80" y2="90">
                                        <stop offset="0%" stopColor="white" stopOpacity="0.6" />
                                        <stop offset="100%" stopColor="black" stopOpacity="0.3" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Magic Sparkles */}
                            <motion.div
                                className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full blur-[2px]"
                                animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                            />
                            <motion.div
                                className="absolute bottom-5 left-2 w-2 h-2 bg-white rounded-full blur-[1px]"
                                animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
                                transition={{ repeat: Infinity, duration: 2, delay: 0.8 }}
                            />
                        </motion.div>

                        {/* Title */}
                        <h1 className="text-3xl font-black text-white tracking-widest uppercase italic mb-2 drop-shadow-[0_0_10px_rgba(255,183,0,0.5)]">
                            WAKING UP SERVER...
                        </h1>

                        {/* Spinning Indicator */}
                        <div className="flex items-center gap-3 mt-4">
                            <div className="w-5 h-5 border-2 border-t-[#ffb700] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={tipsIndex}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="text-gray-400 font-medium text-sm"
                                >
                                    {tips[tipsIndex]}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Build Info */}
                    <div className="absolute bottom-8 text-xs font-bold text-gray-600 tracking-widest uppercase">
                        Frontend: Vercel | Backend: Render
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
