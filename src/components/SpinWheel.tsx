import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ItemCard } from "./ItemCard";

interface Item {
    _id: string;
    name: string;
    image: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    price?: number;
}

interface SpinWheelProps {
    items: Item[];
    isSpinning: boolean;
    winningItem: Item | null;
    onSpinEnd: () => void;
}

export function SpinWheel({ items, isSpinning, winningItem, onSpinEnd }: SpinWheelProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [spinItems, setSpinItems] = useState<Item[]>([]);
    const ITEM_WIDTH = 192;
    const SPIN_DURATION = 6.0;

    useEffect(() => {
        if (!isSpinning && !winningItem && items?.length > 0) {
            const initialItems = Array.from({ length: 60 }).map(() =>
                items[Math.floor(Math.random() * items.length)]
            );
            setSpinItems(initialItems);
        }
    }, [items, isSpinning, winningItem]);

    useEffect(() => {
        if (isSpinning && winningItem && items?.length > 0) {
            const prefix = Array.from({ length: 45 }).map(() => items[Math.floor(Math.random() * items.length)]);
            const suffix = Array.from({ length: 15 }).map(() => items[Math.floor(Math.random() * items.length)]);
            setSpinItems([...prefix, winningItem, ...suffix]);
        }
    }, [isSpinning, winningItem, items]);

    return (
        <div className="relative w-full overflow-hidden bg-[#0a0a0e] border-y border-white/10 py-14 my-12 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">

            {/* Deep Shadows to mimic authentic machine cylinder */}
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-gradient-to-r from-[#050507] via-[#050507]/90 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-[#050507] via-[#050507]/90 to-transparent z-10 pointer-events-none" />

            {/* Target Marker - Glowing Laser */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-400 z-20 -translate-x-1/2 shadow-[0_0_20px_#3b82f6] opacity-90" />

            <div ref={containerRef} className="flex relative items-center h-[200px] perspective-1000" style={{ width: "200vw" }}>
                <motion.div
                    className={`flex gap-4 px-1/2 will-change-transform transform-gpu`}
                    initial={{ x: 0 }}
                    animate={
                        isSpinning
                            ? { x: -(45 * ITEM_WIDTH) - (ITEM_WIDTH / 2) + ((containerRef.current?.clientWidth || 0) / 2) }
                            : { x: 0 }
                    }
                    transition={
                        isSpinning
                            ? { duration: SPIN_DURATION, ease: [0.12, 0.88, 0.2, 1] }
                            : { duration: 0 }
                    }
                    onAnimationComplete={() => {
                        if (isSpinning) {
                            setTimeout(onSpinEnd, 500);
                        }
                    }}
                >
                    {spinItems.map((item, idx) => (
                        <div key={`${item?._id}-${idx}`} className="w-[176px] shrink-0 transform-gpu">
                            <ItemCard item={item} isSpinning={isSpinning} />
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
