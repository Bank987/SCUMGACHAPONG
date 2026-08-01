import { useEffect, useRef, useState, type ReactNode } from "react";
import { BadgeCheck, LockKeyhole, ShieldCheck, TicketCheck, TrendingUp, X } from "lucide-react";
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

  return (
    <div className="w-full pb-8 pt-0 md:pb-12">
      <div className="relative min-h-[calc(100dvh-9rem)] w-full overflow-hidden rounded-[28px] border border-white/15 bg-white/[0.035] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.3)] backdrop-blur-md sm:p-8 lg:p-12 xl:p-16 2xl:p-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-black/10" />
        <div className="relative grid min-h-[calc(100dvh-17rem)] items-center gap-12 lg:grid-cols-[1.2fr_0.8fr] xl:gap-20 2xl:grid-cols-[1.25fr_0.75fr]">
          <div>
            <div className="mb-6 flex items-center gap-3 text-emerald-400"><ShieldCheck className="h-7 w-7 sm:h-9 sm:w-9" /><span className="h-px w-16 bg-emerald-400/50 sm:w-24" /></div>
            <h1 className="max-w-5xl text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-emerald-300 sm:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl">ARMORY LICENSE TIER</h1>
            <h2 className="mt-6 max-w-5xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl">{displayName}</h2>
            <p className="mt-7 max-w-4xl text-base font-normal leading-8 text-gray-300 sm:text-lg">
              ใช้ GUN REFINE ที่ได้จากการส่งของให้ ADMIN ในเกมส์ มากดตีบวกใบอนุญาตครอบครองอาวุธ
              หากสำเร็จ คุณจะได้รับใบครอบครองและพกพาอาวุธนั้นได้ สูงสุด 15 TIER
            </p>

            <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat icon={<BadgeCheck />} label="ระดับปัจจุบัน" value={level >= 15 ? "MAX 15" : level ? `LEVEL ${level}` : "LEVEL 0"} />
              <Stat icon={<TicketCheck />} label="TIER Access" value={String(license.tickets)} />
              <Stat icon={<TrendingUp />} label="โอกาสสำเร็จ" value={level >= 15 ? "MAX" : `${rate.toFixed(rate % 1 ? 1 : 0)}%`} wide />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl 2xl:max-w-2xl">
            <div className="absolute -inset-4 rounded-[36px] bg-emerald-400/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-b from-[#151b1c] to-[#070909] p-7 text-center shadow-2xl sm:p-10 xl:p-12">
              <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-full border border-emerald-300/20 bg-black/30 p-8 shadow-[inset_0_0_35px_rgba(52,211,153,0.08),0_0_35px_rgba(52,211,153,0.1)] sm:h-72 sm:w-72 2xl:h-80 2xl:w-80">
                {displayImage ? <img src={displayImage} referrerPolicy="no-referrer" alt={displayName} className="h-full w-full object-contain drop-shadow-[0_0_18px_rgba(52,211,153,0.4)]" /> : <BadgeCheck className="h-24 w-24 text-emerald-400" />}
              </div>
              <p className="mt-6 text-[11px] font-black uppercase tracking-[0.25em] text-gray-500">Current authorization</p>
              <h2 className="mt-2 min-h-8 text-xl font-black text-white">{currentName}</h2>
              <div className="my-5 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
              <p className="text-xs font-bold text-gray-500">เป้าหมายถัดไป</p>
              <p className="mt-1 font-black text-emerald-300">{nextName}</p>
              <button onClick={upgrade} disabled={upgrading || level >= 15 || license.tickets < 1} className="mt-6 w-full rounded-xl border border-emerald-300/30 bg-emerald-400 py-3.5 text-sm font-black uppercase tracking-widest text-[#04100b] shadow-[0_0_24px_rgba(52,211,153,0.28)] transition hover:bg-emerald-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/5 disabled:text-gray-600 disabled:shadow-none">
                {upgrading ? "กำลังตรวจสอบ..." : level >= 15 ? "ระดับสูงสุดแล้ว" : license.tickets < 1 ? "TIER Access ไม่เพียงพอ" : "อัปเกรดใบอนุญาต -1 TIER Access"}
              </button>
            </div>
          </div>
        </div>
      </div>

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
  return <div className={`min-h-24 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-md ${wide ? "col-span-2 sm:col-span-1" : ""}`}><div className="flex items-center gap-2 text-emerald-400 [&>svg]:h-4 [&>svg]:w-4">{icon}<span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span></div><p className="mt-3 text-2xl font-black text-white">{value}</p></div>;
}
