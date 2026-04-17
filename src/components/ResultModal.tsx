import { motion, AnimatePresence } from "framer-motion";
import { ItemCard } from "./ItemCard";

interface ResultModalProps {
    isOpen: boolean;
    item: any;
    onClose: () => void;
}

export function ResultModal({ isOpen, item, onClose }: ResultModalProps) {
    if (!isOpen || !item) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#050507]/90 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.90, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 15 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="w-full max-w-[420px] bg-gradient-to-b from-[#14151c] to-[#0a0a0f] border border-white/10 rounded-[24px] shadow-[0_30px_100px_rgba(0,0,0,1)] relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Glossy Header Highlight */}
                        <div className="absolute inset-x-0 top-0 h-[100px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                        <div className="p-10 flex flex-col items-center relative z-10">

                            <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-1 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                Acquired
                            </h2>
                            <p className="text-[13px] font-bold text-blue-400 uppercase tracking-widest mb-10">Premium Drop</p>

                            <div className="w-full h-64 mb-10 transform-gpu hover:scale-105 transition-transform duration-500">
                                <ItemCard item={item} />
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[15px] font-black tracking-widest uppercase rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-[0_10px_40px_rgba(59,130,246,0.2)]"
                            >
                                Inspect Storage
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
