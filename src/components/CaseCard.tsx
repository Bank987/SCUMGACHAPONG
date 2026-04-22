import React from "react";
import { Link } from "react-router-dom";

interface CaseCardProps {
    id: string;
    name: string;
    price: number;
    image: string;
}

export const CaseCard: React.FC<CaseCardProps> = ({ id, name, price, image }) => {
    // Randomly apply a diagonal banner for simulation
    const isHot = Math.random() > 0.7;

    return (
        <Link to={`/case/${id}`} className="block relative focus:outline-none rounded-2xl">
            <div className="group bg-[#111218] rounded-2xl border-[2px] border-[#1a1b24] overflow-hidden transition-all duration-200 hover:border-[#ffb700] hover:shadow-[0_0_20px_rgba(255,102,0,0.6),inset_0_0_20px_rgba(255,102,0,0.6)] hover:-translate-y-2 relative">

                {/* Diagonal Ribbon */}
                {isHot && (
                    <div className="absolute top-4 -left-10 w-36 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest text-center py-1 transform -rotate-45 z-20 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                        🔥 คนกดเยอะ
                    </div>
                )}

                {/* Display Area */}
                <div className="relative h-44 w-full flex items-center justify-center p-6 bg-gradient-to-b from-[#161720] to-[#0f1015]">
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(255,102,0,0.2)_0%,transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity" />

                    <img
                        referrerPolicy="no-referrer"
                        src={image}
                        alt={name}
                        className="w-full h-full object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] transform transition-transform duration-300 group-hover:scale-110 relative z-10"
                    />
                </div>

                {/* Footer Area */}
                <div className="p-4 bg-[#0a0a0f] border-t border-[#1a1b24] flex flex-col items-center justify-center text-center group-hover:bg-[#0c0d15] transition-colors rounded-b-2xl">
                    <h3 className="text-[14px] font-bold text-gray-200 truncate w-full px-2 mb-3">{name}</h3>

                    <div className="bg-[#ffb700]/10 border border-[#ffb700]/30 px-6 py-2 rounded-[10px] flex items-center justify-center gap-1.5 w-full max-w-[140px] group-hover:border-[#ffb700]/60 group-hover:shadow-[inset_0_0_10px_rgba(255,183,0,0.2)] transition-all">
                        <span className="text-[16px] font-black text-white">{Math.floor(price)}</span>
                        <span className="text-[#ffb700] text-[12px] font-bold">SPINS</span>
                    </div>
                </div>

            </div>
        </Link>
    );
}
