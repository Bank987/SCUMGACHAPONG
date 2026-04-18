import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store/useStore";
import { toast } from "sonner";
import { ArrowLeft, Zap, Sparkles } from "lucide-react";
import { initAudio, playTickSound, playRevealSound } from "../lib/audio";

interface Item {
  _id: string;
  name: string;
  image: string;
  rarity: string;
  color: string;
}

interface Case {
  _id: string;
  name: string;
  image: string;
  price: number;
  items: Item[];
}

export default function CaseOpening() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setSpins, isAuthenticated } = useStore();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isFastSpinning, setIsFastSpinning] = useState(false);
  const [isSlowingDown, setIsSlowingDown] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [spinResult, setSpinResult] = useState<Item | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animation state
  const [rollerItems, setRollerItems] = useState<Item[]>([]);
  const rollerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetch(`/api/cases/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Case not found");
        return res.json();
      })
      .then((data) => {
        setCaseData(data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("ไม่พบข้อมูลกล่อง");
        navigate("/");
      });

    // Load Roller Audio
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio("/audio/sound_gashapon.mp3");
      
      // Auto unlock check if we can
      audioPlayerRef.current.play().catch(() => {}).finally(() => {
          if (audioPlayerRef.current) {
              audioPlayerRef.current.pause();
              audioPlayerRef.current.currentTime = 0;
          }
      });
    }
  }, [id, navigate]);

  const generateRollerItems = (winningItem: Item) => {
    if (!caseData) return [];

    const items = [];
    // Generate 80 random items
    for (let i = 0; i < 80; i++) {
      const randomItem = caseData.items[Math.floor(Math.random() * caseData.items.length)];
      items.push(randomItem);
    }

    // Insert winning item at position 65
    items[65] = winningItem;

    return items;
  };

  const handleSpin = async () => {
    if (!isAuthenticated) {
      toast.error("ล็อกอินก่อนเปิดกล่องดิพี่!");
      return;
    }

    if (!caseData) return;

    if (user!.spins < caseData.price) {
      toast.error("Gacha Point ไม่พอว่ะ แจ้งแอดมินด่วนๆ");
      return;
    }

    setIsSpinning(true);
    setSpinResult(null);
    setIsFastSpinning(true);
    setIsSlowingDown(false);
    setShowFlash(false);
    setIsStopped(false);
    // initAudio(); // Disable old audio

    // Clear any existing fade out
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    // Play Roller Sound
    if (audioPlayerRef.current) {
      audioPlayerRef.current.volume = 1.0;
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current.play().catch(e => console.error("Audio play failed:", e));
    }

    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caseData._id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to spin");
      }

      setSpins(data.remainingSpins);
      const winningItem = data.item;

      // Setup animation
      const items = generateRollerItems(winningItem);
      setRollerItems(items);

      if (rollerRef.current) {
        rollerRef.current.style.transition = "none";
        rollerRef.current.style.transform = "translateX(0)";
      }

      setTimeout(() => {
        setIsFastSpinning(false);
        setIsSlowingDown(true);
      }, 4000);

      setTimeout(() => {
        if (rollerRef.current) {
          const itemWidth = 180 + 8; // 180px width + 8px gap (gap-2)
          const targetIndex = 65;
          const randomOffset = Math.floor(Math.random() * (itemWidth - 10)) - ((itemWidth - 10) / 2);
          // With paddingLeft: 50%, the roller's 0th item starts with its left edge perfectly in the center.
          // To center the 0th item, we shift it left by 180/2 = 90px.
          // To center targetIndex, we shift left by (targetIndex * itemWidth) + 90px.
          const distance = -(targetIndex * itemWidth) - 90 + randomOffset;

          rollerRef.current.style.transition = "transform 7s cubic-bezier(0.05, 0.9, 0.1, 1)";
          rollerRef.current.style.transform = `translateX(${distance}px)`;

          const startTime = performance.now();
          let lastPassedItem = 0;

          const checkPosition = () => {
            if (!rollerRef.current) return;
            const style = window.getComputedStyle(rollerRef.current);
            const transform = style.transform;

            if (transform && transform !== 'none') {
              const values = transform.split('(')[1].split(')')[0].split(',');
              const currentX = Math.abs(parseFloat(values[4]));
              const passedItems = Math.floor(currentX / itemWidth);

              if (passedItems > lastPassedItem) {
                // playTickSound(); // Disable tick sound tracking to use original behavior
                lastPassedItem = passedItems;
              }
            }

            // Dynamic Scaling for items near center
            const containerRect = rollerRef.current.parentElement?.getBoundingClientRect();
            const containerCenter = containerRect ? containerRect.left + containerRect.width / 2 : window.innerWidth / 2;

            itemsRef.current.forEach((item) => {
              if (!item) return;
              const rect = item.getBoundingClientRect();
              const itemCenter = rect.left + rect.width / 2;
              const dist = Math.abs(containerCenter - itemCenter);

              if (dist < 300) {
                const scale = 1 + (0.15 * (1 - dist / 300));
                const zIndex = 10 + Math.floor((1 - dist / 300) * 10);
                const brightness = 1 + (0.5 * (1 - dist / 300));
                item.style.transform = `scale(${scale})`;
                item.style.zIndex = zIndex.toString();
                item.style.filter = `brightness(${brightness})`;
              } else {
                item.style.transform = `scale(1)`;
                item.style.zIndex = '1';
                item.style.filter = `brightness(1)`;
              }
            });

            if (performance.now() - startTime < 7200) {
              requestAnimationFrame(checkPosition);
            } else {
              // Force winning item to be perfectly scaled at the end
              const winningEl = itemsRef.current[65];
              if (winningEl) {
                winningEl.style.transform = `scale(1.15)`;
                winningEl.style.zIndex = '20';
                winningEl.style.filter = `brightness(1.5)`;
              }
            }
          };
          requestAnimationFrame(checkPosition);

          setTimeout(() => {
            setIsSlowingDown(false);
            setShowFlash(true);
            setIsStopped(true);
            playRevealSound(); // Re-enabled reveal sound
            setSpinResult(winningItem);

            // Start fading out audio immediately when reveal happens
            if (audioPlayerRef.current) {
              let vol = 1.0;
              fadeIntervalRef.current = setInterval(() => {
                vol -= 0.05;
                if (vol <= 0) {
                  clearInterval(fadeIntervalRef.current!);
                  fadeIntervalRef.current = null;
                  audioPlayerRef.current!.pause();
                } else {
                  audioPlayerRef.current!.volume = vol;
                }
              }, 40); // 0.8-second fade out for smoother transition
            }

          }, 7200);

          setTimeout(() => {
            setShowFlash(false);
            setIsSpinning(false);
          }, 7800);
        }
      }, 50);

    } catch (error: any) {
      toast.error(error.message);
      setIsSpinning(false);
      if (error.message.includes("ถูกระงับ")) {
        setTimeout(() => {
          window.location.href = "/";
          // We can't easily call logout() here without adding it to dependencies,
          // but checkAuth on reload will clear the state since the server returns 403.
        }, 2000);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!caseData) return null;

  return (
    <div className="max-w-[1400px] mx-auto pb-20 pt-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-white/50 hover:text-[#ffb700] hover:-translate-x-1 mb-8 transition-all font-bold tracking-wider text-sm bg-white/5 px-4 py-2 rounded-full border border-[#ffb700]/30"
      >
        <ArrowLeft className="w-4 h-4" />
        ย้อนกลับไปหน้าก่อน
      </button>

      {/* Case Header (Sleek) */}
      <div className="flex flex-col items-center mb-12 relative bg-gradient-to-b from-[#1a1a24] to-[#0d0d12] border border-[#ffb700]/30 rounded-2xl py-12 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <motion.img
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          src={caseData.image}
          alt={caseData.name}
          className="h-56 object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] mb-6 relative z-10 animate-[float_4s_ease-in-out_infinite]"
        />
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wide mb-6 text-white drop-shadow-md">{caseData.name}</h1>

        <button
          onClick={handleSpin}
          disabled={isSpinning || (user ? user.spins < caseData.price : false)}
          className="group relative transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed rounded-2xl bg-[#0a0500] border-[2px] border-[#ffb700] shadow-[0_0_20px_rgba(255,102,0,0.6),inset_0_0_20px_rgba(255,102,0,0.6)] hover:shadow-[0_0_30px_rgba(255,102,0,0.9),inset_0_0_30px_rgba(255,102,0,0.9)]"
        >
          <div className="absolute inset-0 opacity-0 group-hover:animate-shine bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none -translate-x-full rounded-2xl"></div>
          <div className="relative z-10 px-6 md:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 w-full sm:w-auto sm:min-w-[280px]">
            <span className="text-lg md:text-xl font-black text-[#ffb700] group-hover:text-white transition-colors tracking-wide uppercase drop-shadow-[0_0_8px_rgba(255,183,0,0.5)]">
              {isSpinning ? "กำลังเปิด..." : "เปิดกล่อง"}
            </span>
            <div className="flex items-center gap-2 bg-[#ffb700]/10 px-4 py-2 rounded-xl border border-[#ffb700]/30 shadow-[inset_0_0_10px_rgba(255,183,0,0.2)]">
              <span className="text-base md:text-lg font-black text-[#ffb700] group-hover:text-white transition-colors drop-shadow-[0_0_5px_rgba(255,183,0,0.5)]">{caseData.price} SPINS</span>
            </div>
          </div>
        </button>
      </div>

      {/* Stop Flash */}
      {showFlash && (
        <div className="fixed inset-0 z-[100] pointer-events-none animate-[flash-burst_0.8s_ease-out_forwards]" />
      )}

      {/* Modern Spin Roller (CS2 Style) */}
      <div className={`relative mb-16 w-full ${showFlash ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
        <div className="relative bg-[#0d0d0d] border-y-2 border-[#ffb700]/30 py-6 shadow-[inset_0_0_50px_rgba(0,0,0,1),0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden w-full">

          {/* Cinematic Light Sweep */}
          <div className={`absolute inset-0 z-20 pointer-events-none overflow-hidden transition-opacity duration-1000 ${isSlowingDown && !isStopped ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute top-0 bottom-0 w-[150%] bg-gradient-to-r from-transparent via-[#ffb700]/40 to-transparent animate-[sweep_1.5s_linear_infinite]" />
          </div>

          {/* Center Line (CS2 Gold) */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-[#eab308] z-30 -translate-x-1/2 shadow-[0_0_10px_#eab308,0_0_2px_#eab308]"></div>

          {/* Center Line Triangles (Top and Bottom) */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-4 h-4 bg-[#eab308] z-30" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-4 h-4 bg-[#eab308] z-30" style={{ clipPath: 'polygon(50% 0, 0 100%, 100% 100%)' }}></div>

          {/* Fades */}
          <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent z-40 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent z-40 pointer-events-none"></div>

          <div className="h-[220px] overflow-hidden relative">
            <div
              ref={rollerRef}
              style={{ paddingLeft: '50%', paddingRight: '50%' }}
              className={`flex items-center h-full gap-2 w-max transition-[filter] duration-700 ${isFastSpinning ? 'blur-[2px]' : 'blur-0'}`}
            >
              {rollerItems.length > 0 ? (
                rollerItems.map((item, idx) => (
                  <div
                    key={idx}
                    ref={el => { itemsRef.current[idx] = el; }}
                    className={`w-[180px] h-[190px] shrink-0 bg-gradient-to-b from-[#222] to-[#111] flex flex-col items-center justify-center p-4 relative overflow-hidden shadow-lg transition-colors duration-300 ${isStopped && idx === 65 ? 'ring-2 ring-[#ffb700] bg-gradient-to-b from-[#443311] to-[#221100]' : ''}`}
                  >
                    {/* Rarity Bottom Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-2" style={{ backgroundColor: item.color, boxShadow: `0 -5px 15px ${item.color}60` }}></div>

                    {/* Background Glow based on rarity */}
                    <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ background: `radial-gradient(circle at center, ${item.color} 0%, transparent 70%)` }}></div>

                    <img src={item.image} alt={item.name} className="max-h-24 object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] mb-4 relative z-10" />
                    <p className="text-[13px] text-center font-bold truncate w-full text-gray-200 tracking-wide relative z-10">{item.name}</p>
                  </div>
                ))
              ) : (
                Array.from({ length: 15 }).map((_, idx) => (
                  <div key={idx} className="w-[180px] h-[190px] shrink-0 bg-gradient-to-b from-[#222] to-[#111] flex items-center justify-center opacity-50 shadow-inner border-b-4 border-[#333]">
                    <div className="text-white/10 font-black text-5xl">?</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>



        {/* Winning Item Overlay (No UI, just item and glow) */}
        <AnimatePresence>
          {isStopped && spinResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center"
            >
              {/* Darken background slightly to make item pop, minimal blur to keep roller visible */}
              <div
                className="absolute inset-0 bg-[#000000cc] backdrop-blur-[2px] cursor-pointer"
                onClick={() => {
                  setIsStopped(false);
                  setSpinResult(null);
                }}
              ></div>

              {/* White Flash Burst (Quick) */}
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0 bg-white z-0 pointer-events-none mix-blend-overlay"
              ></motion.div>

              {/* Exact Horizontal Lighting Flare from Image */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center justify-center pointer-events-none mix-blend-screen z-0"
              >
                {/* Ambient large orange glow behind */}
                <div className="absolute w-[100vw] h-[400px] bg-[#ff4500] blur-[150px] opacity-30 rounded-[100%]"></div>

                {/* Wide orange horizontal streak */}
                <div className="absolute w-[100vw] h-[100px] bg-gradient-to-r from-transparent via-[#ff5500] to-transparent blur-[40px] opacity-80"></div>

                {/* Bright yellow horizontal streak */}
                <div className="absolute w-[100vw] h-[25px] bg-gradient-to-r from-transparent via-[#ffb700] to-transparent blur-[15px] opacity-100"></div>

                {/* Core intense white/yellow line */}
                <div className="absolute w-[100vw] h-[3px] bg-gradient-to-r from-transparent via-[#ffffff] to-transparent blur-[3px]"></div>
              </motion.div>

              {/* Bouncing Item */}
              <motion.div
                initial={{ scale: 0.5, y: 50, opacity: 0 }}
                animate={{ scale: 1.3, y: [0, -10, 0], opacity: 1 }}
                transition={{
                  scale: { type: "spring", damping: 15, stiffness: 200 },
                  y: { repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }
                }}
                className="relative z-10 flex flex-col items-center"
              >
                {/* Intense Core Glow behind the item */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[80px] rounded-[100%] blur-[20px] pointer-events-none z-0 mix-blend-screen"
                  style={{ backgroundColor: spinResult.color || '#ffb700' }}
                ></motion.div>

                {/* Outer Diffused Glow */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[120px] rounded-[100%] blur-[45px] pointer-events-none z-0"
                  style={{ backgroundColor: spinResult.color || '#ffb700' }}
                ></motion.div>

                <img
                  src={spinResult.image}
                  alt={spinResult.name}
                  className="h-32 md:h-44 object-contain relative z-10"
                  style={{
                    filter: `drop-shadow(0 15px 20px rgba(0,0,0,0.8)) drop-shadow(0 0 20px ${spinResult.color || '#ffb700'}) drop-shadow(0 0 40px ${spinResult.color || '#ffb700'})`
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Items List */}
      <div>
        <h3 className="text-2xl font-bold tracking-wide flex items-center gap-3 mb-8 text-white/90 bg-[#111218] w-max px-6 py-3 rounded-full border border-[#ffb700]/30">
          <div className="w-3 h-3 bg-[#ffb700] rounded-full shadow-[0_0_10px_#ffb700]"></div>
          มีของอะไรในกล่องบ้าง?
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {caseData.items.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#111218] border border-[#ffb700]/20 border-b-[3px] rounded-[16px] p-5 flex flex-col items-center relative overflow-hidden group hover:bg-[#161720] transition-colors"
              style={{ borderBottomColor: item.color }}
            >
              <div className="h-20 w-full flex items-center justify-center mb-3 relative z-10">
                <img src={item.image} alt={item.name} className="max-h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
              </div>
              <p className="text-[11px] text-center font-bold text-gray-300 truncate w-full" title={item.name}>{item.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
