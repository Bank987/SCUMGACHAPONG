import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { CaseCard } from "../components/CaseCard";
import { Flame, Sword } from "lucide-react";
import { toast } from "sonner";

interface Case {
  _id: string;
  name: string;
  image: string;
  price: number;
  category: string;
}

export default function Dashboard() {
  const { user, setUpgradePoints, isAuthenticated, promoBanner } = useStore();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    fetch("/api/cases")
      .then((res) => res.json())
      .then((data) => {
        setCases(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch cases", err);
        setLoading(false);
      });
  }, []);

  const displayCases = user?.allowedCases && user.allowedCases.length > 0
    ? cases.filter(c => user.allowedCases!.includes(c._id))
    : cases;

  const cat1 = displayCases.filter(c => c.category === "1");
  const cat2 = displayCases.filter(c => c.category === "2");
  const cat3 = displayCases.filter(c => c.category === "3");

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      toast.error("กรุณาล็อกอินก่อนตีบวก");
      return;
    }
    if ((user?.upgradePoints || 0) < 10) {
      toast.error("REFINE POINT ไม่พอ! (ใช้ 10 แต้ม)");
      return;
    }

    setIsUpgrading(true);
    try {
      const res = await fetch("/api/spin/upgrade", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setUpgradePoints(data.remainingPoints);
        if (data.success) {
          toast.success("ตีบวกสำเร็จ! โคตรตึง!");
        } else {
          toast.error("ตีบวกแหก! ลองใหม่นะน้อง");
        }
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (e) {
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
    } finally {
      setIsUpgrading(false);
    }
  };

  const spotlightBg = promoBanner || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070";

  const renderCategory = (title: string, catCases: Case[]) => {
    return (
      <div className={`bg-[#111218]/80 backdrop-blur-sm border border-[#ffb700]/30 rounded-[24px] p-6 shadow-[0_0_20px_rgba(255,183,0,0.05)]`}>
        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
          <div className={`w-2 h-6 bg-[#ffb700] rounded-full shadow-[0_0_10px_rgba(255,183,0,0.5)]`}></div>
          {title}
        </h2>
        {catCases.length === 1 ? (
          <div className="flex justify-center items-center w-full">
            <div className="w-full max-w-[300px]">
              <CaseCard key={catCases[0]._id} id={catCases[0]._id} name={catCases[0].name} price={catCases[0].price} image={catCases[0].image} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {catCases.map(c => <CaseCard key={c._id} id={c._id} name={c.name} price={c.price} image={c.image} />)}
            {catCases.length === 0 && !loading && <p className="text-gray-500 text-sm col-span-full">ไม่มีกล่องในหมวดหมู่นี้</p>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">

      {/* Promo Banner (Head ข้อมูล) */}
      <div className="relative overflow-hidden bg-[#0c0d12] border border-[#ffb700]/30 p-8 md:p-12 shadow-[0_0_30px_rgba(255,183,0,0.15)] flex flex-col md:flex-row items-center justify-between rounded-[24px] min-h-[250px] md:min-h-[350px]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-screen pointer-events-none"
          style={{ backgroundImage: `url('${spotlightBg}')` }}
        />
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-[#ffb700]/20 blur-[80px] pointer-events-none" />
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* กล่องแบบที่ 1 */}
        {renderCategory("LIMITED TIME GASHAPON", cat1)}

        {/* กล่องแบบที่ 2 */}
        {renderCategory("STANDARD GASHAPON", cat2)}

        {/* กล่องแบบที่ 3 */}
        {renderCategory("SKIN COSTUME GASHAPON", cat3)}

        {/* ตีบวกอาวุธโชว์ */}
        <div className="bg-gradient-to-br from-[#1a1510] to-[#111218] border border-[#ffb700]/30 rounded-[24px] p-6 shadow-[0_0_30px_rgba(255,183,0,0.1)] flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-[#ffb700]/10 blur-[50px] pointer-events-none"></div>

          <Sword className="w-16 h-16 text-[#ffb700] mb-4 drop-shadow-[0_0_15px_rgba(255,183,0,0.5)]" />
          <h2 className="text-3xl font-black text-white mb-2 tracking-wide uppercase italic">Combat Armory</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-xs">อัพเกรดพัฒนาเพื่อรับปืนสุดแรร์และบัฟรายสัปดาห์สุดโหด</p>

          <Link
            to="/upgrade"
            className="px-10 py-4 bg-[#0a0500] border-[2px] border-[#ffb700] text-[#ffb700] font-black text-lg tracking-widest uppercase rounded-xl shadow-[0_0_20px_rgba(255,102,0,0.6),inset_0_0_20px_rgba(255,102,0,0.6)] hover:shadow-[0_0_30px_rgba(255,102,0,0.9),inset_0_0_30px_rgba(255,102,0,0.9)] hover:text-white transition-all hover:scale-105 active:scale-95"
          >
            UPGRADE
          </Link>
        </div>

      </div>
    </div>
  );
}
