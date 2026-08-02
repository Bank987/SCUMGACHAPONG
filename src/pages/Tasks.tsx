import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Activity, CheckCircle2, ClipboardList, Coins, Crosshair, Dices, History, X, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "../store/useStore";

interface TaskOption {
  index: number;
  name: string;
  image: string;
  rate: number;
}

interface TaskResult {
  success: boolean;
  taskName: string;
  rate: number;
  remainingPoints: number;
}

const taskStyles = [
  {
    accent: "text-[#ffcf4d]",
    border: "border-[#ffb700]/35 hover:border-[#ffcf4d]/80",
    glow: "group-hover:shadow-[0_0_40px_rgba(255,183,0,0.18)]",
    wash: "from-[#ffb700]/18",
    meter: "from-[#ff8c00] to-[#ffe08a]"
  },
  {
    accent: "text-orange-400",
    border: "border-orange-500/30 hover:border-orange-400/75",
    glow: "group-hover:shadow-[0_0_40px_rgba(249,115,22,0.18)]",
    wash: "from-orange-600/18",
    meter: "from-orange-600 to-orange-300"
  },
  {
    accent: "text-red-400",
    border: "border-red-500/30 hover:border-red-400/75",
    glow: "group-hover:shadow-[0_0_40px_rgba(239,68,68,0.18)]",
    wash: "from-red-700/20",
    meter: "from-red-700 to-red-400"
  }
];

export default function Tasks() {
  const { isAuthenticated, setTaskPoints, taskFunctionName, taskFunctionImage } = useStore();
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rolling, setRolling] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskOption | null>(null);
  const [result, setResult] = useState<TaskResult | null>(null);
  const [resultRevealed, setResultRevealed] = useState(false);

  const loadTasks = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("ไม่สามารถโหลดข้อมูลภารกิจได้");
      setData(await response.json());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "โหลดข้อมูลภารกิจไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, [isAuthenticated]);

  const rollTask = async (task: TaskOption) => {
    if (rolling !== null) return;
    setSelectedTask(task);
    setRolling(task.index);
    setResult(null);
    setResultRevealed(false);
    try {
      const response = await fetch("/api/tasks/roll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIndex: task.index })
      });
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(responseData.error || "สุ่มภารกิจไม่สำเร็จ");
        setSelectedTask(null);
        setRolling(null);
        return;
      }

      setResult({
        success: responseData.success,
        taskName: responseData.taskName,
        rate: responseData.rate,
        remainingPoints: responseData.remainingPoints
      });
      await new Promise(resolve => window.setTimeout(resolve, reduceMotion ? 250 : 1450));
      setResultRevealed(true);
      setTaskPoints(responseData.remainingPoints);
      setData((current: any) => current ? { ...current, points: responseData.remainingPoints } : current);
      setRolling(null);
      void loadTasks();
    } catch {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
      setSelectedTask(null);
      setRolling(null);
    }
  };

  const closeResult = () => {
    if (!resultRevealed) return;
    setResult(null);
    setSelectedTask(null);
    setResultRevealed(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[68vh] items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-xl overflow-hidden rounded-[24px] border border-[#ffb700]/30 bg-[#111218]/90 p-10 text-center shadow-[0_0_40px_rgba(255,183,0,0.12)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb700] to-transparent" />
          <ClipboardList className="mx-auto h-14 w-14 text-[#ffb700] drop-shadow-[0_0_12px_rgba(255,183,0,0.6)]" />
          <h1 className="mt-5 text-2xl font-black text-white">กรุณาเข้าสู่ระบบ</h1>
          <p className="mt-2 text-gray-400">เข้าสู่ระบบก่อนใช้งานสุ่มความสำเร็จภารกิจ</p>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex min-h-[68vh] items-center justify-center"><div className="relative h-16 w-16"><div className="absolute inset-0 animate-spin rounded-full border border-[#ffb700]/20 border-t-[#ffb700]" /><Crosshair className="absolute inset-0 m-auto h-7 w-7 animate-pulse text-[#ffb700]" /></div></div>;
  }

  const functionName = data?.functionName || taskFunctionName;
  const functionImage = data?.functionImage || taskFunctionImage;
  const tasks: TaskOption[] = data?.tasks || [];
  const history = data?.history || [];

  return (
    <div className="mx-auto max-w-[1500px] pb-20">
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative min-h-[calc(100dvh-9rem)] overflow-hidden rounded-[26px] border border-[#ffb700]/25 bg-[#0b0c10]/90 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="pointer-events-none absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,183,0,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,183,0,0.18)_1px,transparent_1px)] [background-size:48px_48px]" />
        <motion.div animate={reduceMotion ? undefined : { backgroundPositionX: ["0%", "200%"] }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }} className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,183,0,0.055)_45%,transparent_65%)] bg-[length:200%_100%]" />
        <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-[#ffb700]/10 blur-[110px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-orange-600/10 blur-[120px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb700] to-transparent" />
        <motion.div animate={reduceMotion ? undefined : { y: [0, 700, 0], opacity: [0, 0.45, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }} className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-[#ffb700] shadow-[0_0_18px_#ffb700]" />

        <div className="relative z-20 p-5 sm:p-7 lg:p-10">
          <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
            <motion.div initial={{ opacity: 0, x: -25 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55 }} className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2">
                  <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" /><span className="relative h-2 w-2 rounded-full bg-emerald-400" /></span>
                  <span className="text-[10px] font-black tracking-widest text-emerald-300">ระบบพร้อมใช้งาน</span>
                </div>
              </div>

              <div className="mt-7 flex items-center gap-5">
                <motion.div animate={reduceMotion ? undefined : { y: [0, -6, 0], rotateY: [0, 8, 0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-[#ffb700]/35 bg-[#0a0500] p-3 shadow-[inset_0_0_25px_rgba(255,183,0,0.08),0_0_30px_rgba(255,183,0,0.13)] sm:h-28 sm:w-28">
                  <motion.div animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }} className="absolute -inset-2 rounded-2xl border border-dashed border-[#ffb700]/20" />
                  {functionImage ? <img src={functionImage} referrerPolicy="no-referrer" alt={functionName} className="relative h-full w-full object-contain drop-shadow-[0_0_14px_rgba(255,183,0,0.5)]" /> : <Crosshair className="relative h-14 w-14 text-[#ffb700] drop-shadow-[0_0_12px_rgba(255,183,0,0.6)]" />}
                </motion.div>
                <div className="min-w-0">
                  <h1 className="mt-2 text-3xl font-black uppercase italic leading-none tracking-tight text-white sm:text-5xl lg:text-6xl">{functionName}</h1>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-400 sm:text-base">เลือกภารกิจแล้วส่งคำสั่งเข้าสู่ระบบ ทุกการปฏิบัติการใช้ 1 TASKS POINT ผลลัพธ์ถูกตัดสินจากเซิร์ฟเวอร์และบันทึกทันที</p>
                </div>
              </div>
            </motion.div>

            <motion.aside initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, delay: 0.12 }} className="relative overflow-hidden rounded-2xl border border-[#ffb700]/25 bg-gradient-to-br from-[#1a1510] to-[#08090d] p-5 shadow-[0_20px_45px_rgba(0,0,0,0.3)]">
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full border border-[#ffb700]/10" />
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full border border-[#ffb700]/10" />
              <div className="mb-5 flex items-center justify-between"><p className="text-sm font-black text-white">แต้มสำหรับสุ่มภารกิจ</p><Coins className="h-6 w-6 text-[#ffb700]/70" /></div>
              <div className="flex items-end justify-between"><div className="flex items-center gap-3"><div className="rounded-xl border border-[#ffb700]/25 bg-[#ffb700]/10 p-3"><Coins className="h-6 w-6 text-[#ffb700]" /></div><div><p className="text-[10px] font-black tracking-widest text-[#ffb700]/65">TASKS POINT</p><motion.p key={data?.points} initial={{ scale: 1.35, color: "#ffb700" }} animate={{ scale: 1, color: "#ffffff" }} className="text-4xl font-black">{Math.floor(data?.points || 0)}</motion.p></div></div><p className="mb-1 text-xs font-black text-gray-600">01 / ROLL</p></div>
              <div className="mt-5 grid grid-cols-3 gap-2">{tasks.map(task => <div key={task.index} className="rounded-lg border border-white/5 bg-black/25 p-2 text-center"><p className="text-[8px] font-black text-gray-600">M{task.index + 1}</p><p className={`mt-1 text-sm font-black ${taskStyles[task.index]?.accent}`}>{task.rate}%</p></div>)}</div>
            </motion.aside>
          </div>

          <div className="mt-8 flex items-center gap-3"><span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#ffb700]/30" /><div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-gray-500"><Crosshair className="h-4 w-4 text-[#ffb700]" /> เลือกภารกิจ</div><span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#ffb700]/30" /></div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {tasks.map((task, index) => {
              const style = taskStyles[index] || taskStyles[0];
              const disabled = rolling !== null || Number(data?.points || 0) < 1;
              return (
                <motion.article key={task.index} initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 + index * 0.12, duration: 0.5 }} whileHover={reduceMotion ? undefined : { y: -8, rotateX: 1.5 }} className={`group relative overflow-hidden rounded-[22px] border bg-[#0d0e13]/95 transition-[border-color,box-shadow] duration-300 ${style.border} ${style.glow}`}>
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.wash} via-transparent to-transparent opacity-60`} />
                  <motion.div animate={reduceMotion ? undefined : { x: ["-150%", "350%"] }} transition={{ duration: 4.5 + index, repeat: Infinity, repeatDelay: 2 }} className="pointer-events-none absolute inset-y-0 z-20 w-16 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
                  <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-b from-white/[0.025] to-black/25 p-6">
                    <div className="absolute inset-6 rounded-full border border-dashed border-white/[0.07]" />
                    <motion.div animate={reduceMotion ? undefined : { rotate: index % 2 ? -360 : 360 }} transition={{ duration: 16 + index * 3, repeat: Infinity, ease: "linear" }} className="absolute h-36 w-36 rounded-full border border-dashed border-white/10" />
                    <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/[0.05] to-transparent" />
                    <div className="absolute left-0 top-1/2 h-px w-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                    {task.image ? <motion.img whileHover={reduceMotion ? undefined : { scale: 1.08, rotate: 1.5 }} src={task.image} referrerPolicy="no-referrer" alt={task.name} className="relative z-10 h-full w-full object-contain drop-shadow-[0_18px_22px_rgba(0,0,0,0.7)]" /> : <motion.div animate={reduceMotion ? undefined : { y: [0, -7, 0] }} transition={{ duration: 3 + index * 0.4, repeat: Infinity }}><Dices className={`relative z-10 h-20 w-20 ${style.accent} drop-shadow-[0_0_16px_currentColor]`} /></motion.div>}
                  </div>
                  <div className="relative p-5">
                    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-[9px] font-black tracking-[0.2em] text-gray-600">ภารกิจที่ {index + 1}</p><h2 className="mt-1 truncate text-xl font-black text-white">{task.name}</h2></div><div className="text-right"><p className="text-[8px] font-black text-gray-600">โอกาสสำเร็จ</p><p className={`text-3xl font-black ${style.accent}`}>{task.rate}<span className="text-sm">%</span></p></div></div>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${task.rate}%` }} transition={{ delay: 0.6 + index * 0.15, duration: 0.9, ease: "easeOut" }} className={`h-full bg-gradient-to-r ${style.meter} shadow-[0_0_10px_currentColor]`} /></div>
                    <button disabled={disabled} onClick={() => void rollTask(task)} className="group/button relative mt-5 w-full overflow-hidden rounded-lg border-2 border-[#ffb700] bg-[#0a0500] py-3.5 text-sm font-black uppercase tracking-widest text-[#ffb700] shadow-[0_5px_0_#8a5b00,0_12px_24px_rgba(255,183,0,0.12)] transition-[transform,background-color,color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[#ffb700] hover:text-black hover:shadow-[0_7px_0_#8a5b00,0_18px_30px_rgba(255,183,0,0.25)] active:translate-y-1 active:shadow-[0_1px_0_#8a5b00] disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-gray-600 disabled:shadow-none">
                      <span className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-white/45 transition-[left] duration-500 group-hover/button:left-[120%] group-disabled/button:hidden" />
                      <span className="relative flex items-center justify-center gap-2">{rolling === task.index ? <><Activity className="h-4 w-4 animate-pulse" /> กำลังสุ่มผล</> : Number(data?.points || 0) < 1 ? "TASKS POINT ไม่พอ" : <><Zap className="h-4 w-4" /> สุ่มภารกิจ</>}</span>
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <motion.section initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mt-7 overflow-hidden rounded-[20px] border border-[#ffb700]/20 bg-[#0d0e13]/90">
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4"><div className="h-5 w-1 rounded-full bg-[#ffb700] shadow-[0_0_8px_#ffb700]" /><History className="h-5 w-5 text-[#ffb700]" /><h2 className="text-sm font-black text-white">ประวัติการสุ่ม</h2></div>
            <div className="grid gap-px bg-white/5 md:grid-cols-2 xl:grid-cols-4">{history.length ? history.slice(0, 8).map((item: any, index: number) => <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 + index * 0.04 }} key={item._id} className="group flex items-center justify-between gap-3 bg-[#0b0c10] p-4 transition hover:bg-white/[0.025]"><div className="min-w-0"><div className="flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${item.success ? "bg-emerald-400 shadow-[0_0_7px_#34d399]" : "bg-red-400 shadow-[0_0_7px_#f87171]"}`} /><p className="truncate text-xs font-black text-white">{item.taskName}</p></div><p className="mt-1 text-[9px] font-bold text-gray-600">โอกาสสำเร็จ {item.successRate}% · {new Date(item.createdAt).toLocaleString("th-TH")}</p></div><span className={`shrink-0 text-[9px] font-black ${item.success ? "text-emerald-400" : "text-red-400"}`}>{item.success ? "สำเร็จ" : "ไม่สำเร็จ"}</span></motion.div>) : <p className="col-span-full bg-[#0b0c10] py-10 text-center text-sm text-gray-600">ยังไม่มีประวัติการสุ่มภารกิจ</p>}</div>
          </motion.section>
        </div>
      </motion.section>

      <AnimatePresence>
        {selectedTask && (rolling !== null || result) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 z-[1200] flex items-center justify-center overflow-hidden bg-black/90 px-4 backdrop-blur-lg ${resultRevealed && result && !result.success ? "animate-[shake_0.45s_ease-in-out]" : ""}`}>
            <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,183,0,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,183,0,0.2)_1px,transparent_1px)] [background-size:52px_52px]" />
            {!resultRevealed && <motion.div animate={{ y: ["-10vh", "110vh"] }} transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }} className="pointer-events-none absolute inset-x-0 h-px bg-[#ffb700] shadow-[0_0_25px_#ffb700]" />}
            {resultRevealed && <motion.div initial={{ opacity: 0.85 }} animate={{ opacity: 0 }} transition={{ duration: 0.8 }} className={`pointer-events-none absolute inset-0 ${result?.success ? "bg-emerald-300" : "bg-red-600"}`} />}
            <motion.div animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} className={`pointer-events-none absolute h-[75vmin] w-[75vmin] rounded-full border border-dashed ${resultRevealed ? result?.success ? "border-emerald-400/25" : "border-red-400/25" : "border-[#ffb700]/20"}`} />
            <motion.div initial={{ scale: 0.88, opacity: 0, y: 25 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className={`relative w-full max-w-lg overflow-hidden rounded-[26px] border p-6 text-center shadow-2xl sm:p-8 ${!resultRevealed ? "border-[#ffb700]/35 bg-[#0b0c10] shadow-[0_0_70px_rgba(255,183,0,0.18)]" : result?.success ? "border-emerald-400/50 bg-[#07130e] shadow-[0_0_90px_rgba(52,211,153,0.35)]" : "border-red-400/50 bg-[#180708] shadow-[0_0_90px_rgba(239,68,68,0.3)]"}`}>
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              {resultRevealed && <button onClick={closeResult} className="absolute right-4 top-4 z-30 rounded-full border border-white/10 bg-black/25 p-2 text-gray-400 transition hover:rotate-90 hover:text-white"><X className="h-5 w-5" /></button>}

              <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
                {!resultRevealed && <><motion.div animate={{ rotate: 360 }} transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border border-dashed border-[#ffb700]/45" /><motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-5 rounded-full border border-dashed border-[#ffb700]/20" /><motion.div animate={{ scale: [0.9, 1.08, 0.9], opacity: [0.25, 0.65, 0.25] }} transition={{ duration: 1.1, repeat: Infinity }} className="absolute inset-8 rounded-full bg-[#ffb700]/20 blur-xl" /></>}
                {resultRevealed && <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.18, 1] }} transition={{ duration: 0.55 }} className={`absolute inset-3 rounded-full blur-2xl ${result?.success ? "bg-emerald-400/30" : "bg-red-500/30"}`} />}
                <motion.div animate={!resultRevealed && !reduceMotion ? { y: [0, -7, 0] } : undefined} transition={{ duration: 1.5, repeat: Infinity }} className={`relative flex h-40 w-40 items-center justify-center rounded-full border p-7 transition-all duration-500 ${!resultRevealed ? "border-[#ffb700]/35 bg-[#ffb700]/5" : result?.success ? "border-emerald-400/45 bg-emerald-400/10" : "border-red-400/45 bg-red-500/10 grayscale"}`}>
                  {selectedTask.image ? <img src={selectedTask.image} referrerPolicy="no-referrer" alt={selectedTask.name} className="h-full w-full object-contain drop-shadow-[0_0_18px_rgba(255,183,0,0.45)]" /> : resultRevealed ? result?.success ? <CheckCircle2 className="h-24 w-24 text-emerald-400" /> : <XCircle className="h-24 w-24 text-red-400" /> : <Crosshair className="h-24 w-24 text-[#ffb700]" />}
                </motion.div>
              </div>

              {!resultRevealed ? (
                <div className="mt-3">
                  <h2 className="mt-3 text-2xl font-black text-white">กำลังประมวลผลภารกิจ...</h2>
                  <p className="mt-2 text-sm text-gray-500">{selectedTask.name} · โอกาสสำเร็จ {selectedTask.rate}%</p>
                  <div className="mx-auto mt-6 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/5"><motion.div animate={{ x: ["-100%", "300%"] }} transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }} className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#ffb700] to-transparent" /></div>
                  <p className="mt-5 animate-pulse text-[10px] font-black tracking-widest text-gray-600">กรุณารอผลการสุ่ม</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mt-3">
                  <div className={`mx-auto flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black tracking-[0.2em] ${result?.success ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-400" : "border-red-400/25 bg-red-400/10 text-red-400"}`}>{result?.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{result?.success ? "ภารกิจสำเร็จ" : "ภารกิจไม่สำเร็จ"}</div>
                  <h2 className={`mt-4 text-4xl font-black uppercase italic ${result?.success ? "text-emerald-300" : "text-red-300"}`}>{result?.success ? "สำเร็จ !" : "ไม่สำเร็จ !"}</h2>
                  <p className="mt-2 text-sm font-bold text-gray-400">{result?.taskName}</p>
                  <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/5 bg-black/25 p-3"><p className="text-[9px] font-black text-gray-600">โอกาสสำเร็จ</p><p className="mt-1 text-xl font-black text-white">{result?.rate}%</p></div><div className="rounded-xl border border-white/5 bg-black/25 p-3"><p className="text-[9px] font-black text-gray-600">TASKS POINT คงเหลือ</p><p className="mt-1 text-xl font-black text-white">{result?.remainingPoints}</p></div></div>
                  <button onClick={closeResult} className={`group relative mt-6 w-full overflow-hidden rounded-lg border py-3.5 font-black uppercase tracking-wider transition hover:-translate-y-0.5 active:translate-y-1 ${result?.success ? "border-emerald-200/50 bg-emerald-400 text-[#04100b] shadow-[0_5px_0_#047857,0_12px_25px_rgba(52,211,153,0.2)]" : "border-red-300/40 bg-red-500 text-white shadow-[0_5px_0_#991b1b,0_12px_25px_rgba(239,68,68,0.2)]"}`}><span className="absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-white/35 transition-[left] duration-500 group-hover:left-[120%]" /><span className="relative">ยืนยันผล</span></button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
