import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, Coins, Dices, History, XCircle } from "lucide-react";
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
}

export default function Tasks() {
  const { isAuthenticated, setTaskPoints, taskFunctionName, taskFunctionImage } = useStore();
  const [data, setData] = useState<any>(null);
  const [rolling, setRolling] = useState<number | null>(null);
  const [result, setResult] = useState<TaskResult | null>(null);

  const loadTasks = async () => {
    if (!isAuthenticated) return;
    const response = await fetch("/api/tasks");
    if (response.ok) setData(await response.json());
  };

  useEffect(() => {
    void loadTasks();
  }, [isAuthenticated]);

  const rollTask = async (task: TaskOption) => {
    if (rolling !== null) return;
    setRolling(task.index);
    setResult(null);
    try {
      const response = await fetch("/api/tasks/roll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIndex: task.index })
      });
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(responseData.error || "สุ่มภารกิจไม่สำเร็จ");
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 900));
      const nextResult = { success: responseData.success, taskName: responseData.taskName, rate: responseData.rate };
      setResult(nextResult);
      setTaskPoints(responseData.remainingPoints);
      await loadTasks();
    } catch {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setRolling(null);
    }
  };

  if (!isAuthenticated) {
    return <div className="mx-auto mt-20 max-w-xl rounded-3xl border border-white/10 bg-black/50 p-10 text-center"><ClipboardList className="mx-auto h-12 w-12 text-violet-400" /><h1 className="mt-5 text-2xl font-black text-white">กรุณาเข้าสู่ระบบ</h1><p className="mt-2 text-gray-400">เข้าสู่ระบบก่อนใช้งานสุ่มความสำเร็จภารกิจ</p></div>;
  }

  const functionName = data?.functionName || taskFunctionName;
  const functionImage = data?.functionImage || taskFunctionImage;

  return (
    <div className="mx-auto max-w-6xl pb-20">
      <section className="relative overflow-hidden rounded-[32px] border border-violet-400/20 bg-[#0c0d13]/90 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)] md:p-10">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-violet-400/30 bg-violet-500/10 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
              {functionImage ? <img src={functionImage} referrerPolicy="no-referrer" alt={functionName} className="h-full w-full object-contain p-2" /> : <ClipboardList className="h-10 w-10 text-violet-300" />}
            </div>
            <div><p className="text-xs font-black uppercase tracking-[0.3em] text-violet-400">Mission Probability</p><h1 className="mt-2 text-3xl font-black text-white md:text-4xl">{functionName}</h1><p className="mt-2 max-w-2xl text-sm text-gray-400">เลือกภารกิจเพื่อวัดดวง ระบบใช้ 1 TASKS POINT ต่อครั้งและบันทึกผลทุกครั้ง ไม่มีระบบเลเวล</p></div>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-5 py-4"><Coins className="h-6 w-6 text-amber-300" /><div><p className="text-[10px] font-black tracking-widest text-amber-300/70">TASKS POINT</p><p className="text-2xl font-black text-white">{Math.floor(data?.points || 0)}</p></div></div>
        </div>

        <div className="relative mt-10 grid gap-5 md:grid-cols-3">
          {(data?.tasks || []).map((task: TaskOption) => (
            <article key={task.index} className="group overflow-hidden rounded-3xl border border-white/10 bg-black/30 transition hover:-translate-y-1 hover:border-violet-400/40">
              <div className="flex h-44 items-center justify-center bg-gradient-to-br from-violet-950/50 to-black p-5">
                {task.image ? <img src={task.image} referrerPolicy="no-referrer" alt={task.name} className="h-full w-full object-contain transition group-hover:scale-105" /> : <Dices className="h-16 w-16 text-violet-400/60" />}
              </div>
              <div className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black tracking-[0.2em] text-gray-500">MISSION {task.index + 1}</p><h2 className="mt-1 text-xl font-black text-white">{task.name}</h2></div><span className="rounded-xl border border-violet-400/20 bg-violet-400/10 px-3 py-2 text-lg font-black text-violet-300">{task.rate}%</span></div>
                <button disabled={rolling !== null || Number(data?.points || 0) < 1} onClick={() => void rollTask(task)} className="mt-5 w-full rounded-xl bg-violet-600 py-3 font-black text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40">{rolling === task.index ? "กำลังสุ่มผล..." : "ใช้ 1 TASKS POINT"}</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {result && <section className={`mt-6 rounded-3xl border p-7 text-center ${result.success ? "border-emerald-400/30 bg-emerald-500/10" : "border-red-400/30 bg-red-500/10"}`}>{result.success ? <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" /> : <XCircle className="mx-auto h-14 w-14 text-red-400" />}<p className="mt-3 text-sm font-bold text-gray-400">{result.taskName} อัตราสำเร็จ {result.rate}%</p><h2 className={`mt-1 text-3xl font-black ${result.success ? "text-emerald-300" : "text-red-300"}`}>{result.success ? "สำเร็จ !" : "ไม่สำเร็จ !"}</h2></section>}

      <section className="mt-6 rounded-3xl border border-white/10 bg-[#0c0d13]/90 p-6"><div className="mb-5 flex items-center gap-3"><History className="h-5 w-5 text-violet-400" /><h2 className="text-lg font-black text-white">ประวัติภารกิจล่าสุด</h2></div><div className="space-y-2">{data?.history?.length ? data.history.map((item: any) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-4 py-3"><div><p className="font-bold text-white">{item.taskName}</p><p className="text-xs text-gray-500">อัตราสำเร็จ {item.successRate}% · {new Date(item.createdAt).toLocaleString("th-TH")}</p></div><span className={`rounded-lg px-3 py-1 text-xs font-black ${item.success ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{item.success ? "สำเร็จ" : "ไม่สำเร็จ"}</span></div>) : <p className="py-6 text-center text-sm text-gray-500">ยังไม่มีประวัติการสุ่มภารกิจ</p>}</div></section>
    </div>
  );
}
