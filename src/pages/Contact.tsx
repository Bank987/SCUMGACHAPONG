import { ExternalLink, MessageCircle, Heart } from "lucide-react";

export default function Contact() {
    return (
        <div className="max-w-4xl mx-auto space-y-10 pt-10">

            {/* Header Banner */}
            <div className="relative overflow-hidden bg-[#0c0d12] border-2 border-[#ffb700]/30 p-10 md:p-16 shadow-[0_0_30px_rgba(255,183,0,0.15)] text-center rounded-[30px]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,183,0,0.15)_0%,transparent_100%)] pointer-events-none" />
                <h1 className="relative z-10 text-4xl md:text-5xl font-black tracking-tight mb-4 text-white drop-shadow-[0_4px_10px_rgba(0,0,0,1)] flex items-center justify-center gap-3">
                    ติดต่อ <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffb700] to-[#ff8c00]">แอดมิน</span>
                </h1>
                <p className="relative z-10 text-[15px] font-bold text-gray-400 max-w-lg mx-auto">
                    คลิกที่ Discord @allinone11  ด่านล่างนี้
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto mb-6">
                {/* Facebook */}
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="group relative bg-[#111218] border border-[#ffb700]/30 p-8 flex flex-col items-center justify-center gap-5 transition-all hover:border-[#1877F2] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(24,119,242,0.2)] rounded-[24px]">
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(24,119,242,0.1)_0%,transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity rounded-[24px]" />

                    <div className="w-20 h-20 bg-[#1877F2]/10 rounded-[20px] flex items-center justify-center shadow-[0_0_20px_rgba(24,119,242,0.2)] group-hover:scale-110 transition-transform">
                        <svg className="w-10 h-10 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                        </svg>
                    </div>

                    <div className="text-center relative z-10">
                        <h3 className="text-xl font-black text-white mb-2">Facebook แฟนเพจ</h3>
                        <span className="text-sm font-bold text-gray-500 flex items-center justify-center gap-1.5 bg-white/5 py-1.5 px-4 rounded-full border border-[#ffb700]/30">
                            ทักแชท Inbox แอดมิน <ExternalLink size={14} />
                        </span>
                    </div>
                </a>

                {/* YouTube */}
                <a href="https://www.youtube.com/@ASHENLAND/videos" target="_blank" rel="noreferrer" className="group relative bg-[#111218] border border-[#ffb700]/30 p-8 flex flex-col items-center justify-center gap-5 transition-all hover:border-[#FF0000] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(255,0,0,0.2)] rounded-[24px]">
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(255,0,0,0.1)_0%,transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity rounded-[24px]" />

                    <div className="w-20 h-20 bg-[#FF0000]/10 rounded-[20px] flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.2)] group-hover:scale-110 transition-transform">
                        <svg className="w-10 h-10 text-[#FF0000]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path fillRule="evenodd" d="M21.582 6.186a2.686 2.686 0 0 0-1.884-1.897C17.94 3.84 12 3.84 12 3.84s-5.94 0-7.698.449a2.686 2.686 0 0 0-1.884 1.897c-.44 1.764-.44 5.444-.44 5.444s0 3.68.44 5.444a2.686 2.686 0 0 0 1.884 1.897c1.758.449 7.698.449 7.698.449s5.94 0 7.698-.449a2.686 2.686 0 0 0 1.884-1.897c.44-1.764.44-5.444.44-5.444s0-3.68-.44-5.444ZM9.855 14.88V8.38l6.267 3.25-6.267 3.25Z" clipRule="evenodd" />
                        </svg>
                    </div>

                    <div className="text-center relative z-10">
                        <h3 className="text-xl font-black text-white mb-2">ช่อง YouTube</h3>
                        <span className="text-sm font-bold text-gray-500 flex items-center justify-center gap-1.5 bg-white/5 py-1.5 px-4 rounded-full border border-[#ffb700]/30">
                            ดูวิดีโอของเรา <ExternalLink size={14} />
                        </span>
                    </div>
                </a>
            </div>

            {/* Discord (Username Only) Center Bottom */}
            <div className="flex justify-center">
                <div className="group relative bg-[#111218] border border-[#ffb700]/30 p-8 flex flex-col items-center justify-center gap-5 transition-all hover:border-[#5865F2] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(88,101,242,0.2)] rounded-[24px] w-full max-w-sm">
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(88,101,242,0.1)_0%,transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity rounded-[24px]" />

                    <div className="w-20 h-20 bg-[#5865F2]/10 rounded-[20px] flex items-center justify-center shadow-[0_0_20px_rgba(88,101,242,0.2)] group-hover:scale-110 transition-transform">
                        <svg className="w-10 h-10 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path fillRule="evenodd" d="M19.73 4.87a18.2 18.2 0 0 0-4.6-1.44c-.21.38-.44.88-.6 1.3-1.6-.24-3.14-.24-4.7 0-.17-.43-.4-.93-.62-1.31a18.22 18.22 0 0 0-4.6 1.44A13.05 13.05 0 0 0 2 15.72a18.3 18.3 0 0 0 5.63 2.87c.46-.62.86-1.28 1.2-1.98-.65-.25-1.28-.55-1.87-.89.15-.11.3-.23.45-.35 3.54 1.64 7.37 1.64 10.9 0 .15.12.3.24.45.35-.6.34-1.22.64-1.87.89.35.7.75 1.36 1.2 1.98a18.3 18.3 0 0 0 5.63-2.87 13.1 13.1 0 0 0-2.38-10.85ZM8.52 13.33c-1.04 0-1.88-.93-1.88-2.07s.83-2.06 1.88-2.06c1.06 0 1.9.94 1.88 2.06 0 1.14-.83 2.07-1.88 2.07Zm6.96 0c-1.04 0-1.88-.93-1.88-2.07s.83-2.06 1.88-2.06c1.06 0 1.9.94 1.88 2.06 0 1.14-.83 2.07-1.88 2.07Z" clipRule="evenodd" />
                        </svg>
                    </div>

                    <div className="text-center relative z-10 w-full">
                        <h3 className="text-xl font-black text-white mb-2">Discord </h3>
                        <div className="w-full text-sm font-bold text-gray-200 flex items-center justify-center gap-2 bg-black/40 py-2 px-4 rounded-xl border border-[#5865F2]/30 select-all cursor-text hover:bg-black/60 hover:border-[#5865F2]/80 transition-colors">
                            @allinone11
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
