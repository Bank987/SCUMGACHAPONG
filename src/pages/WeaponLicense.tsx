import { useEffect, useState, type ReactNode } from "react";
import { BadgeCheck, LockKeyhole, ShieldCheck, TicketCheck, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { initAudio, playUpgradeFailSound, playUpgradeSuccessSound } from "../lib/audio";
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

  const upgrade = async () => {
    if (!license || upgrading || license.level >= 15 || license.tickets < 1) return;
    initAudio();
    setUpgrading(true);
    try {
      const res = await fetch("/api/spin/weapon-license/upgrade", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปเกรดใบอนุญาตไม่สำเร็จ");

      const nextResult: UpgradeResult = data;
      setResult(nextResult);
      setLevelTickets(nextResult.remainingTickets);
      setLicense((current) => current ? {
        ...current,
        level: nextResult.currentLevel,
        tickets: nextResult.remainingTickets
      } : current);
      if (nextResult.success) playUpgradeSuccessSound();
      else playUpgradeFailSound();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setUpgrading(false);
    }
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
    <div className="mx-auto w-full max-w-[1440px] pb-12 pt-2 md:pt-6">
      <div className="relative min-h-[680px] overflow-hidden rounded-[28px] border border-emerald-400/20 bg-[#0a0d0f]/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8 lg:p-12 xl:p-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(52,211,153,0.16),transparent_42%)]" />
        <div className="relative grid min-h-[570px] items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] xl:gap-16">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-300"><ShieldCheck className="h-4 w-4" /> ARMORY LICENSE TIER</div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-400">ARMORY LICENSE TIER</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl xl:text-6xl">{displayName}</h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-gray-300 sm:text-lg">
              ใช้ <span className="font-black text-emerald-300">GUN REFINE</span> ที่ได้จากการส่งของให้ ADMIN ในเกมส์ มากดตีบวกใบอนุญาตครอบครองอาวุธ
              หากสำเร็จ คุณจะได้รับใบครอบครองและพกพาอาวุธนั้นได้ สูงสุด 15 TIER
            </p>

            <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat icon={<BadgeCheck />} label="ระดับปัจจุบัน" value={level >= 15 ? "MAX 15" : level ? `LEVEL ${level}` : "LEVEL 0"} />
              <Stat icon={<TicketCheck />} label="TIER Access" value={String(license.tickets)} />
              <Stat icon={<TrendingUp />} label="โอกาสสำเร็จ" value={level >= 15 ? "MAX" : `${rate.toFixed(rate % 1 ? 1 : 0)}%`} wide />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-4 rounded-[36px] bg-emerald-400/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-[#151b1c] to-[#070909] p-7 text-center shadow-2xl sm:p-10">
              <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-full border border-emerald-300/20 bg-black/30 p-8 shadow-[inset_0_0_35px_rgba(52,211,153,0.08),0_0_35px_rgba(52,211,153,0.1)] sm:h-64 sm:w-64">
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
          <div className={`relative w-full max-w-md overflow-hidden rounded-[28px] border p-8 text-center shadow-2xl ${result.success ? "border-emerald-400/40 bg-[#08130f]" : "border-red-400/40 bg-[#16090a]"}`}>
            <button onClick={() => setResult(null)} className="absolute right-4 top-4 rounded-full bg-white/5 p-2 text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${result.success ? "bg-emerald-400/15 text-emerald-400" : "bg-red-400/15 text-red-400"}`}><BadgeCheck className="h-11 w-11" /></div>
            <p className={`mt-5 text-xs font-black uppercase tracking-[0.25em] ${result.success ? "text-emerald-400" : "text-red-400"}`}>{result.success ? "Upgrade Success" : "Upgrade Failed"}</p>
            <h2 className="mt-3 text-3xl font-black text-white">{result.success ? result.levelName : "ระดับคงเดิม"}</h2>
            <p className="mt-3 text-sm text-gray-400">{result.success ? `เลื่อนเป็น LEVEL ${result.currentLevel} สำเร็จ` : `ยังคงอยู่ที่ LEVEL ${result.currentLevel}`}</p>
            <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-black/25 p-3"><p className="text-[10px] font-bold text-gray-500">RATE</p><p className="mt-1 font-black text-white">{asPercent(result.rate).toFixed(1)}%</p></div><div className="rounded-xl bg-black/25 p-3"><p className="text-[10px] font-bold text-gray-500">TIER ACCESS LEFT</p><p className="mt-1 font-black text-white">{result.remainingTickets}</p></div></div>
            <button onClick={() => setResult(null)} className={`mt-6 w-full rounded-xl py-3 font-black ${result.success ? "bg-emerald-400 text-[#04100b]" : "bg-red-500 text-white"}`}>ตกลง</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, wide = false }: { icon: ReactNode; label: string; value: string; wide?: boolean }) {
  return <div className={`min-h-24 rounded-2xl border border-white/5 bg-black/25 p-5 ${wide ? "col-span-2 sm:col-span-1" : ""}`}><div className="flex items-center gap-2 text-emerald-400 [&>svg]:h-4 [&>svg]:w-4">{icon}<span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</span></div><p className="mt-3 text-2xl font-black text-white">{value}</p></div>;
}
