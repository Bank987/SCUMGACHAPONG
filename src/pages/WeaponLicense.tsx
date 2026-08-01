import { useEffect, useRef, useState, type ReactNode } from "react";
import { BadgeCheck, ChevronRight, CircleCheck, Fingerprint, LockKeyhole, ShieldCheck, TicketCheck, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { initLicenseAudio, playLicenseFailSound, playLicenseSuccessSound } from "../lib/audio";
import { useStore } from "../store/useStore";

interface LicenseData {
  level: number;
  tickets: number;
  name: string;
  image: string;
  levelNames: string[];
  rates: number[] | Record<string, number>;
}

interface UpgradeResult {
  success: boolean;
  currentLevel: number;
  levelName: string;
  remainingTickets: number;
  rate: number;
}

const asPercent = (rate: number | undefined) => {
  const value = Number(rate || 0);
  return value <= 1 ? value * 100 : value;
};

export default function WeaponLicense() {
  const { isAuthenticated, setLevelTickets, weaponLicenseName, weaponLicenseImage, weaponLicenseLevelNames } = useStore();
  const [license, setLicense] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [result, setResult] = useState<UpgradeResult | null>(null);
  const [resultRevealed, setResultRevealed] = useState(false);
  const revealTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetch("/api/spin/weapon-license")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "ไม่สามารถโหลดข้อมูลใบอนุญาตได้");
        setLicense(data);
        setLevelTickets(Number(data.tickets || 0));
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated, setLevelTickets]);

  useEffect(() => () => {
    if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
  }, []);

  const upgrade = async () => {
    if (!license || upgrading || license.level >= 15 || license.tickets < 1) return;
    initLicenseAudio();
    setUpgrading(true);
    try {
      const res = await fetch("/api/spin/weapon-license/upgrade", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปเกรดใบอนุญาตไม่สำเร็จ");

      const nextResult: UpgradeResult = data;
      setResult(nextResult);
      setResultRevealed(false);
      revealTimer.current = window.setTimeout(() => {
        setLevelTickets(nextResult.remainingTickets);
        setLicense((current) => current ? {
          ...current,
          level: nextResult.currentLevel,
          tickets: nextResult.remainingTickets
        } : current);
        setResultRevealed(true);
        setUpgrading(false);
        if (nextResult.success) playLicenseSuccessSound();
        else playLicenseFailSound();
        revealTimer.current = null;
      }, 900);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setUpgrading(false);
    }
  };

  const closeResult = () => {
    if (!resultRevealed) return;
    setResult(null);
    setResultRevealed(false);
  };

  if (!isAuthenticated) {
    return <div className="flex min-h-[65vh] items-center justify-center"><div className="text-center"><LockKeyhole className="mx-auto h-16 w-16 text-gray-600" /><h1 className="mt-4 text-2xl font-black text-white">กรุณาเข้าสู่ระบบ</h1><p className="mt-2 text-sm text-gray-400">เข้าสู่ระบบเพื่อดูและอัปเกรด ARMORY LICENSE TIER</p></div></div>;
  }

  if (loading) return <div className="flex min-h-[65vh] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-r-transparent" /></div>;
  if (!license) return <div className="py-20 text-center font-bold text-gray-400">ไม่พบข้อมูลใบอนุญาต</div>;

  const level = Math.min(15, Math.max(0, Number(license.level || 0)));
  const names = license.levelNames?.length ? license.levelNames : weaponLicenseLevelNames;
  const currentName = level > 0 ? names[level - 1] || `LEVEL ${level}` : "ยังไม่มีใบอนุญาต";
  const nextName = level < 15 ? names[level] || `LEVEL ${level + 1}` : "ระดับสูงสุด";
  const rawRate = Array.isArray(license.rates) ? license.rates[level] : license.rates?.[String(level + 1)] ?? license.rates?.[String(level)];
  const rate = asPercent(rawRate);
  const displayName = license.name || weaponLicenseName;
  const displayImage = license.image || weaponLicenseImage;
  const progress = (level / 15) * 100;

  return (
    <div className="w-full pb-8 md:pb-12">
      <section className="relative min-h-[calc(100dvh-9rem)] w-full overflow-hidden rounded-2xl border border-white/15 bg-[#0b1010]/35 shadow-[0_24px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent" />

        <header className="relative flex flex-col gap-4 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-300/30 bg-emerald-300/10 text-emerald-300 shadow-[inset_0_0_18px_rgba(52,211,153,0.08)]"><ShieldCheck className="h-6 w-6" /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-300">Authorization command</p>
              <p className="mt-1 text-xs font-bold text-gray-500">LAND SERIES / ARMORY CONTROL</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start rounded-md border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-2 sm:self-auto">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_10px_#6ee7b7]" />
            <span className="text-[10px] font-black uppercase text-emerald-200">System online</span>
          </div>
        </header>

        <div className="relative grid min-h-[calc(100dvh-16rem)] items-center gap-10 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:p-10 xl:gap-14 xl:p-12">
          <div className="min-w-0">
            <h1 className="max-w-4xl text-4xl font-black uppercase leading-[1.02] text-white sm:text-5xl lg:text-6xl xl:text-7xl">ARMORY <span className="text-emerald-300">LICENSE</span> TIER</h1>
            <h2 className="mt-5 max-w-3xl text-xl font-black leading-snug text-gray-200 sm:text-2xl lg:text-3xl">{displayName}</h2>
            <p className="mt-5 max-w-3xl text-sm font-normal leading-7 text-gray-400 sm:text-base">
              ใช้ GUN REFINE ที่ได้จากการส่งของให้ ADMIN ในเกมส์ มากดตีบวกใบอนุญาตครอบครองอาวุธ
              หากสำเร็จ คุณจะได้รับใบครอบครองและพกพาอาวุธนั้นได้ สูงสุด 15 TIER
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat icon={<BadgeCheck />} label="ระดับปัจจุบัน" value={level >= 15 ? "MAX 15" : level ? `LEVEL ${level}` : "LEVEL 0"} />
              <Stat icon={<TicketCheck />} label="TIER Access" value={String(license.tickets)} />
              <Stat icon={<TrendingUp />} label="โอกาสสำเร็จ" value={level >= 15 ? "MAX" : `${rate.toFixed(rate % 1 ? 1 : 0)}%`} wide />
            </div>

            <div className="mt-4 border border-white/10 bg-black/20 p-4 sm:p-5">
              <div className="flex items-end justify-between gap-4">
                <div><p className="text-[10px] font-black uppercase text-gray-500">Clearance progression</p><p className="mt-1 text-sm font-bold text-white">{level} / 15 TIER AUTHORIZED</p></div>
                <p className="text-xl font-black text-emerald-300">{Math.round(progress)}%</p>
              </div>
              <div className="relative mt-4 h-2 overflow-hidden bg-white/5">
                <div className="h-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.7)] transition-[width] duration-700" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-15 gap-1" aria-label={`ความคืบหน้า ${level} จาก 15 ระดับ`}>
                {Array.from({ length: 15 }, (_, index) => <span key={index} className={`h-1 ${index < level ? "bg-emerald-300/80" : index === level && level < 15 ? "bg-white/45" : "bg-white/10"}`} />)}
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-4 bg-emerald-400/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-lg border border-emerald-300/20 bg-gradient-to-b from-[#182021] to-[#060808] p-5 text-center shadow-[0_28px_70px_rgba(0,0,0,0.55)] sm:p-7 xl:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.045)_50%,transparent_65%)]" />
              <div className="relative flex items-center justify-between border-b border-white/10 pb-4 text-left">
                <div><p className="text-[9px] font-black uppercase text-emerald-300">Official authorization</p><p className="mt-1 text-xs font-bold text-gray-500">CLEARANCE ID LS-{String(level).padStart(2, "0")}-15</p></div>
                <Fingerprint className="h-7 w-7 text-emerald-300/60" />
              </div>
              <div className="relative mx-auto mt-6 flex aspect-square w-full max-w-60 items-center justify-center rounded-full border border-emerald-300/20 bg-black/30 p-8 shadow-[inset_0_0_40px_rgba(52,211,153,0.08),0_0_35px_rgba(52,211,153,0.12)] sm:max-w-72">
                <div className="absolute inset-3 rounded-full border border-dashed border-emerald-300/15" />
                <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-emerald-300/10 to-transparent" />
                <div className="absolute left-0 top-1/2 h-px w-full bg-gradient-to-r from-transparent via-emerald-300/10 to-transparent" />
                {displayImage ? <img src={displayImage} referrerPolicy="no-referrer" alt={displayName} className="relative h-full w-full object-contain drop-shadow-[0_0_20px_rgba(52,211,153,0.45)]" /> : <BadgeCheck className="relative h-24 w-24 text-emerald-400" />}
              </div>
              <p className="relative mt-5 text-[10px] font-black uppercase text-gray-500">Current authorization</p>
              <h2 className="relative mt-2 min-h-8 text-xl font-black text-white sm:text-2xl">{currentName}</h2>
              <div className="relative my-4 flex items-center justify-center gap-3 border-y border-white/10 py-3">
                {level >= 15 ? <CircleCheck className="h-4 w-4 text-emerald-300" /> : <><span className="text-xs font-bold text-gray-500">NEXT</span><ChevronRight className="h-4 w-4 text-emerald-300" /></>}
                <p className="text-sm font-black text-emerald-300">{nextName}</p>
              </div>
              <div className="relative flex items-center justify-between text-left"><span className="text-[10px] font-bold text-gray-500">UPGRADE COST</span><span className="text-xs font-black text-white">1 TIER Access</span></div>
              <button onClick={upgrade} disabled={upgrading || level >= 15 || license.tickets < 1} className="relative mt-5 w-full rounded-md border border-emerald-200/40 bg-emerald-300 py-3.5 text-sm font-black uppercase text-[#04100b] shadow-[0_0_24px_rgba(52,211,153,0.25)] transition hover:bg-emerald-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/5 disabled:text-gray-600 disabled:shadow-none">
                {upgrading ? "กำลังตรวจสอบ..." : level >= 15 ? "ระดับสูงสุดแล้ว" : license.tickets < 1 ? "TIER Access ไม่เพียงพอ" : "อัปเกรดใบอนุญาต -1 TIER Access"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {result && (
        <div className={`fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden bg-black/85 px-4 backdrop-blur-md ${resultRevealed && !result.success ? "animate-[shake_0.45s_ease-in-out]" : ""}`}>
          {resultRevealed && (
            <div className={`pointer-events-none absolute inset-0 animate-[license-flash_0.75s_ease-out_forwards] ${result.success ? "bg-emerald-300" : "bg-red-600"}`} />
          )}
          <div className={`pointer-events-none absolute h-[70vmax] w-[70vmax] rounded-full transition-all duration-700 ${resultRevealed ? "scale-100 opacity-100" : "scale-50 opacity-30"} ${result.success ? "bg-[radial-gradient(circle,rgba(52,211,153,0.42)_0%,rgba(16,185,129,0.12)_35%,transparent_68%)]" : "bg-[radial-gradient(circle,rgba(239,68,68,0.4)_0%,rgba(127,29,29,0.15)_35%,transparent_68%)]"}`} />

          <div className={`relative w-full max-w-lg overflow-hidden rounded-[30px] border p-7 text-center shadow-2xl transition-all duration-500 sm:p-9 ${!resultRevealed ? "scale-95 border-white/10 bg-[#080a0c]" : result.success ? "scale-100 border-emerald-300/60 bg-[#07130e] shadow-[0_0_90px_rgba(52,211,153,0.38)]" : "scale-100 border-red-400/60 bg-[#180708] shadow-[0_0_80px_rgba(239,68,68,0.34)]"}`}>
            {resultRevealed && <button onClick={closeResult} className="absolute right-4 top-4 z-20 rounded-full bg-white/5 p-2 text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>}

            <div className="relative mx-auto flex h-48 w-48 items-center justify-center sm:h-56 sm:w-56">
              {!resultRevealed && <div className="absolute inset-2 animate-ping rounded-full border border-emerald-300/35" />}
              {resultRevealed && result.success && <><div className="absolute inset-0 animate-pulse rounded-full bg-emerald-300/25 blur-2xl" /><div className="absolute -inset-8 animate-[spin_8s_linear_infinite] rounded-full border border-dashed border-emerald-300/30" /></>}
              {resultRevealed && !result.success && <div className="absolute inset-0 rounded-full bg-red-500/25 blur-2xl" />}
              <div className={`relative flex h-40 w-40 items-center justify-center rounded-full border p-7 transition-all duration-500 sm:h-48 sm:w-48 ${!resultRevealed ? "animate-pulse border-white/10 bg-white/5 opacity-70" : result.success ? "border-emerald-300/50 bg-emerald-300/10 shadow-[0_0_45px_rgba(52,211,153,0.5)]" : "border-red-400/50 bg-red-500/10 grayscale"}`}>
                {displayImage ? <img src={displayImage} referrerPolicy="no-referrer" alt={displayName} className={`h-full w-full object-contain transition-all duration-500 ${resultRevealed && result.success ? "drop-shadow-[0_0_24px_rgba(110,231,183,0.9)]" : ""}`} /> : <BadgeCheck className={`h-24 w-24 ${resultRevealed && !result.success ? "text-red-400" : "text-emerald-400"}`} />}
              </div>
            </div>

            {!resultRevealed ? (
              <div className="mt-4">
                <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-300">กำลังตรวจสอบสิทธิ์</p>
                <h2 className="mt-3 text-2xl font-black text-white">กำลังลุ้นผล...</h2>
                <div className="mx-auto mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-white/10"><div className="h-full animate-[shimmer_0.8s_linear_infinite] bg-gradient-to-r from-transparent via-emerald-300 to-transparent" /></div>
              </div>
            ) : (
              <>
                <p className={`mt-5 text-xs font-black uppercase tracking-[0.25em] ${result.success ? "text-emerald-400" : "text-red-400"}`}>{result.success ? "Upgrade Success" : "Upgrade Failed"}</p>
                <h2 className="mt-3 text-3xl font-black text-white">{result.success ? result.levelName : "ระดับคงเดิม"}</h2>
                <p className="mt-3 text-sm text-gray-400">{result.success ? `เลื่อนเป็น LEVEL ${result.currentLevel} สำเร็จ` : `ยังคงอยู่ที่ LEVEL ${result.currentLevel}`}</p>
                <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-black/25 p-3"><p className="text-[10px] font-bold text-gray-500">RATE</p><p className="mt-1 font-black text-white">{asPercent(result.rate).toFixed(1)}%</p></div><div className="rounded-xl bg-black/25 p-3"><p className="text-[10px] font-bold text-gray-500">TIER ACCESS LEFT</p><p className="mt-1 font-black text-white">{result.remainingTickets}</p></div></div>
                <button onClick={closeResult} className={`mt-6 w-full rounded-xl py-3 font-black ${result.success ? "bg-emerald-400 text-[#04100b]" : "bg-red-500 text-white"}`}>ตกลง</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, wide = false }: { icon: ReactNode; label: string; value: string; wide?: boolean }) {
  return <div className={`min-h-24 border border-white/10 bg-white/[0.045] p-4 backdrop-blur-md sm:p-5 ${wide ? "col-span-2 sm:col-span-1" : ""}`}><div className="flex items-center gap-2 text-emerald-400 [&>svg]:h-4 [&>svg]:w-4">{icon}<span className="text-[10px] font-black uppercase text-gray-400">{label}</span></div><p className="mt-3 text-2xl font-black text-white">{value}</p></div>;
}
