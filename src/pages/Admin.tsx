import React, { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { toast } from "sonner";
import { ShieldAlert, Plus, Users, PackageOpen, Settings, X, Save, Edit, Trash2, KeyRound, ServerCrash } from "lucide-react";

export default function Admin() {
  const { user, fetchSettings, backgroundImage, checkAuth } = useStore();

  // PIN Auth State
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const [activeTab, setActiveTab] = useState("cases");
  const [users, setUsers] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [bgImageInput, setBgImageInput] = useState("");
  const [promoBannerInput, setPromoBannerInput] = useState("");
  const [spotlightImage1, setSpotlightImage1] = useState("");
  const [spotlightImage2, setSpotlightImage2] = useState("");
  const [spotlightImage3, setSpotlightImage3] = useState("");
  const [spotlightImage4, setSpotlightImage4] = useState("");
  const [spotlightImage5, setSpotlightImage5] = useState("");
  const [combatArmoryNameInput, setCombatArmoryNameInput] = useState("");
  const [combatArmoryImageInput, setCombatArmoryImageInput] = useState("");
  const [editingCase, setEditingCase] = useState<any | null>(null);

  // Helper for requests
  const adminFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
      "x-admin-pin": pin
    };
    return fetch(url, { ...options, headers });
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const tryPin = pinInput || pin;

    try {
      const res = await fetch("/api/admin/users", {
        headers: { "x-admin-pin": tryPin }
      });
      if (res.ok) {
        setIsAuthenticated(true);
        setPin(tryPin);

        const data = await res.json();
        setUsers(data);

        // Load cases too
        const caseRes = await fetch("/api/admin/cases", {
          headers: { "x-admin-pin": tryPin }
        });
        const caseData = await caseRes.json();
        setCases(caseData);

        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setBgImageInput(settingsData.backgroundImage || "");
          setPromoBannerInput(settingsData.promoBanner || "");
          setSpotlightImage1(settingsData.spotlightImages?.[0] || "");
          setSpotlightImage2(settingsData.spotlightImages?.[1] || "");
          setSpotlightImage3(settingsData.spotlightImages?.[2] || "");
          setSpotlightImage4(settingsData.spotlightImages?.[3] || "");
          setSpotlightImage5(settingsData.spotlightImages?.[4] || "");
          setCombatArmoryNameInput(settingsData.combatArmoryName || "Combat Armory Tier");
          setCombatArmoryImageInput(settingsData.combatArmoryImage || "https://cdn.discordapp.com/attachments/1492459270564741273/1493677975315419236/4_1.png?ex=69dfd784&is=69de8604&hm=7e9d37824a788f8a2161fcb6786d07a985cd2415aac399080d2a14fdcd3513a0&");
        } else {
          setBgImageInput(backgroundImage);
        }

        toast.success("เข้าสู่ระบบแอดมินสำเร็จ!");
      } else {
        toast.error("รหัส PIN ไม่ถูกต้อง!");
        setPin("");
        setIsAuthenticated(false);
      }
    } catch (error) {
      toast.error("มีปัญหาในการเชื่อมต่อกับเซิร์ฟเวอร์");
    }
  };

  useEffect(() => {
    // Clear any stuck pin from old sessions
    localStorage.removeItem("admin_pin");
    if (pin) handleLogin();
  }, []);

  const loadData = async (isFirstLoad = false) => {
    if (!isAuthenticated) return;
    try {
      const [uRes, cRes, lRes] = await Promise.all([
        adminFetch("/api/admin/users"),
        adminFetch("/api/admin/cases"),
        adminFetch("/api/admin/logs")
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (cRes.ok) setCases(await cRes.json());
      if (lRes.ok) {
        const newLogsData = await lRes.json();
        setLogs(prevLogs => {
          if (!isFirstLoad && prevLogs.length > 0 && newLogsData.length > 0) {
            const latestOldLogTime = new Date(prevLogs[0].createdAt).getTime();
            const newLogsToNotify = newLogsData.filter((log: any) => new Date(log.createdAt).getTime() > latestOldLogTime);
            
            newLogsToNotify.forEach((log: any) => {
              toast.error(`⚠️ แจ้งเตือนการโกงใหม่: ${log.userId?.username || 'Unknown'} - ${log.action} (${log.cheatType})`, {
                duration: 6000,
                position: 'top-right'
              });
            });
          }
          return newLogsData;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData(true);
      const interval = setInterval(() => {
        loadData(false);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] px-4">
        <div className="bg-[#111218] border border-white/5 p-10 rounded-[28px] max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-orange-500"></div>
          <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <KeyRound className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-wide mb-2">Admin Access</h2>
          <p className="text-gray-400 font-bold text-sm mb-8">กรุณากรอก PIN เพื่อเข้าสู่ระบบหลังบ้าน</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="••••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.5em] font-bold text-white focus:outline-none focus:border-red-500 transition-colors"
            />
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Verify PIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- User Management ---
  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const res = await adminFetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        toast.success(`อัปเดตผู้ใช้สำเร็จ`);
        loadData();
        if (userId === user?._id) checkAuth();
      } else {
        toast.error("อัปเดตไม่สำเร็จ");
      }
    } catch (error) {
      toast.error("เออเร่อการเชื่อมต่อ");
    }
  };

  const toggleUserCase = (userId: string, caseId: string, currentAllowed: string[]) => {
    const allowed = currentAllowed || [];
    const newAllowed = allowed.includes(caseId)
      ? allowed.filter(id => id !== caseId)
      : [...allowed, caseId];
    handleUpdateUser(userId, { allowedCases: newAllowed });
  };

  // --- Settings Management ---
  const handleSaveSettings = async () => {
    try {
      const res = await adminFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          backgroundImage: bgImageInput,
          promoBanner: promoBannerInput,
          spotlightImages: [spotlightImage1, spotlightImage2, spotlightImage3, spotlightImage4, spotlightImage5].filter(Boolean),
          combatArmoryName: combatArmoryNameInput,
          combatArmoryImage: combatArmoryImageInput
        })
      });
      if (res.ok) {
        toast.success("บันทึกการตั้งค่าสำเร็จ");
        fetchSettings(); // Refresh from backend
      }
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  // --- Case Management ---
  const handleSaveCase = async () => {
    if (!editingCase) return;

    if (!editingCase.name || !editingCase.image) {
      toast.error("กรุณากรอกชื่อและรูปภาพกล่อง!");
      return;
    }

    try {
      const caseDataToSave = { ...editingCase };
      if (!caseDataToSave._id) delete caseDataToSave._id;

      const url = editingCase._id ? `/api/admin/cases/${editingCase._id}` : "/api/admin/cases";
      const method = editingCase._id ? "PUT" : "POST";

      const res = await adminFetch(url, { method, body: JSON.stringify(caseDataToSave) });

      if (res.ok) {
        toast.success("บันทึกกล่องสำเร็จ!");
        setEditingCase(null);
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (error) {
      toast.error("Error saving case");
    }
  };

  const handleDeleteCase = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบกล่องนี้ อาวุธในประวัติจะไม่ได้รับผลกระทบ?")) return;
    try {
      const res = await adminFetch(`/api/admin/cases/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("ลบกล่องทิ้งเรียบร้อย");
        loadData();
      }
    } catch (error) {
      toast.error("Failed to delete case");
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 pt-6">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-[18px] flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)]">
          <ShieldAlert className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-wide text-white">ระบบจัดการหลังบ้าน</h1>
          <p className="text-gray-400 font-bold text-[13px] tracking-wide mt-1">ตั้งค่ากล่อง, ให้สปินผู้เล่นแบบเรียลไทม์</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-[#111218] border border-white/5 p-1.5 rounded-[20px] w-fit shadow-md">
        {[
          { id: "cases", label: "จัดการกล่อง", icon: PackageOpen },
          { id: "users", label: "แจก Gacha Point ยูสเซอร์", icon: Users },
          { id: "logs", label: "ประวัติ/แบน", icon: ServerCrash },
          { id: "settings", label: "ตั้งค่าเว็บหลัก", icon: Settings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setEditingCase(null); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-[16px] font-bold text-[14px] transition-all ${activeTab === tab.id
              ? "bg-red-500/20 text-red-500 border border-red-500/30"
              : "text-gray-500 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
        <button onClick={() => { setPin(""); setIsAuthenticated(false); window.location.reload(); }} className="flex items-center gap-2 px-6 py-3 rounded-[16px] font-bold text-[14px] transition-all text-gray-500 hover:bg-white/5 hover:text-white border border-transparent">
          ออกล๊อกอิน
        </button>
      </div>

      <div className="bg-[#111218] border border-white/5 rounded-[28px] p-8 shadow-lg relative overflow-hidden">
        {/* USERS TAB */}
        {activeTab === "users" && (
          <div>
            <h2 className="text-2xl font-black tracking-wide flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-red-500 rounded-full"></div>
              ปรับแต่งข้อมูลบัญชี
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#161720] border-b border-white/5 rounded-t-xl">
                  <tr>
                    <th className="p-4 font-bold text-[13px] text-gray-400">User</th>
                    <th className="p-4 font-bold text-[13px] text-gray-400">Gacha Point ปัจจุบัน</th>
                    <th className="p-4 font-bold text-[13px] text-gray-400">REFINE POINT</th>
                    <th className="p-4 font-bold text-[13px] text-gray-400">สิทธิ์เปิดกล่อง (คลิกเพื่อสลับ)</th>
                    <th className="p-4 font-bold text-[13px] text-gray-400">สถานะแบน</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className={`border-b border-white/5 last:border-0 hover:bg-[#161720] transition-colors group ${u.isBanned ? 'bg-red-900/10' : ''}`}>
                      <td className="p-4 flex items-center gap-4">
                        <img referrerPolicy="no-referrer" src={u.avatar} alt={u.username} className="w-10 h-10 rounded-lg drop-shadow" />
                        <div className="flex flex-col">
                          <span className="font-bold text-[15px]">{u.username}</span>
                          {u.cheatWarnings > 0 && <span className="text-[10px] text-orange-400">Cheat Warnings: {u.cheatWarnings}/5</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={u.spins}
                            onChange={(e) => {
                              const newUsers = [...users];
                              const idx = newUsers.findIndex(x => x._id === u._id);
                              newUsers[idx].spins = parseInt(e.target.value) || 0;
                              setUsers(newUsers);
                            }}
                            className="w-24 bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2 text-[14px] text-white focus:outline-none focus:border-red-500"
                          />
                          <button
                            onClick={() => handleUpdateUser(u._id, { spins: u.spins })}
                            className="p-2.5 bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white rounded-xl transition-all"
                            title="บันทึก Gacha Point"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={u.upgradePoints || 0}
                            onChange={(e) => {
                              const newUsers = [...users];
                              const idx = newUsers.findIndex(x => x._id === u._id);
                              newUsers[idx].upgradePoints = parseInt(e.target.value) || 0;
                              setUsers(newUsers);
                            }}
                            className="w-24 bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2 text-[14px] text-white focus:outline-none focus:border-red-500"
                          />
                          <button
                            onClick={() => handleUpdateUser(u._id, { upgradePoints: u.upgradePoints })}
                            className="p-2.5 bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white rounded-xl transition-all"
                            title="บันทึก REFINE POINT"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {cases.map(c => {
                            const isAllowed = u.allowedCases?.includes(c._id);
                            return (
                              <button
                                key={c._id}
                                onClick={() => toggleUserCase(u._id, c._id, u.allowedCases)}
                                className={`text-[12px] font-bold px-3 py-1.5 rounded-lg border transition-all ${isAllowed ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}
                              >
                                {c.name}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        {u.isBanned ? (
                          <div className="flex flex-col gap-2">
                            <span className="text-red-500 text-xs font-bold px-2 py-1 bg-red-500/10 rounded border border-red-500/20">BANNED</span>
                            <button
                              onClick={() => {
                                if(confirm("แน่ใจหรือไม่ที่จะปลดแบนผู้เล่นคนนี้?")) {
                                  handleUpdateUser(u._id, { isBanned: false, cheatWarnings: 0, banReason: "" });
                                }
                              }}
                              className="text-xs bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white px-2 py-1 rounded transition-colors"
                            >
                              ปลดแบน
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              const reason = prompt("เหตุผลที่แบน:");
                              if(reason !== null) {
                                handleUpdateUser(u._id, { isBanned: true, banReason: reason || "แบนโดยแอดมิน" });
                              }
                            }}
                            className="text-xs bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-2 py-1 rounded border border-red-500/20 transition-colors"
                          >
                            แบนบัญชี
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CASES TAB */}
        {activeTab === "cases" && !editingCase && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black tracking-wide flex items-center gap-3">
                <div className="w-1.5 h-6 bg-red-500 rounded-full"></div>
                ระบบกล่องทั้งหมด
              </h2>
              <button
                onClick={() => setEditingCase({ name: "", image: "", price: 1, items: [] })}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl font-bold text-[14px] transition-all shadow-lg active:scale-95"
              >
                <Plus className="w-4 h-4" />
                สร้างกล่องใหม่
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cases.map(c => (
                <div key={c._id} className="bg-[#161720] border border-white/5 rounded-2xl p-6 flex flex-col items-center relative group">
                  <img referrerPolicy="no-referrer" src={c.image} alt={c.name} className="h-32 object-contain mb-4 drop-shadow-lg group-hover:scale-110 transition-transform" />
                  <h3 className="text-[15px] font-bold text-center mb-2">{c.name}</h3>
                  <div className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[12px] font-black tracking-widest mb-4 border border-red-500/20">{c.price} SPINS</div>
                  <p className="text-[12px] text-gray-500 font-bold mb-6">{c.items?.length || 0} ชิ้นในกล่องนี้</p>
                  <div className="flex gap-2 w-full">
                    <button onClick={() => setEditingCase(c)} className="flex-1 py-2.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2">
                      <Edit className="w-4 h-4" /> แก้ไข
                    </button>
                    <button onClick={() => handleDeleteCase(c._id)} className="px-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CASE EDITOR */}
        {activeTab === "cases" && editingCase && (
          <div>
            <div className="flex justify-between items-center mb-8 bg-[#161720] -m-8 mb-8 p-8 border-b border-white/5">
              <h2 className="text-2xl font-black text-white">{editingCase._id ? "แก้ไขกล่องสุ่ม" : "สร้างกล่องสุ่มใหม่แกะกล่อง"}</h2>
              <button onClick={() => setEditingCase(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-10">
              <div>
                <label className="block text-[13px] font-bold text-gray-400 mb-2">ชื่อกล่อง (Case Name)</label>
                <input
                  type="text"
                  value={editingCase.name}
                  onChange={e => setEditingCase({ ...editingCase, name: e.target.value })}
                  className="w-full bg-[#161720] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-400 mb-2">ราคาเปิดปุ่ม (Gacha Point)</label>
                <input
                  type="number"
                  value={editingCase.price}
                  onChange={e => setEditingCase({ ...editingCase, price: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#161720] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-400 mb-2">หมวดหมู่ (Category)</label>
                <select
                  value={editingCase.category || "1"}
                  onChange={e => setEditingCase({ ...editingCase, category: e.target.value })}
                  className="w-full bg-[#161720] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="1">กล่องแบบที่ 1</option>
                  <option value="2">กล่องแบบที่ 2</option>
                  <option value="3">กล่องแบบที่ 3</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[13px] font-bold text-gray-400 mb-2">ลิงก์รูปลักล่อง (Image URL)</label>
                <input
                  type="text"
                  value={editingCase.image}
                  onChange={e => setEditingCase({ ...editingCase, image: e.target.value })}
                  placeholder="https://example.com/image.png"
                  className="w-full bg-[#161720] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <div className="mb-4 flex justify-between items-center bg-[#161720] py-3 px-4 rounded-xl border border-white/5">
              <h3 className="text-[15px] font-bold text-white relative pl-4 before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-4 before:bg-red-500 before:rounded-full">ไอเทมที่ยัดในกล่อง</h3>
              <button
                onClick={() => setEditingCase({ ...editingCase, items: [...(editingCase.items || []), { name: "", image: "", rarity: "Uncommon", dropRate: 10, color: "#10b981" }] })}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white rounded-xl flex items-center gap-2 text-[12px] font-bold transition-colors"
              >
                <Plus className="w-4 h-4" /> เพิ่มของดรอปใหม่
              </button>
            </div>

            <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {(editingCase.items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex gap-5 items-start bg-[#161720] p-5 rounded-xl border border-white/5">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="ชื่อไอเทม เช่น AK-47 | Redline" value={item.name} onChange={e => {
                        const newItems = [...editingCase.items];
                        newItems[idx].name = e.target.value;
                        setEditingCase({ ...editingCase, items: newItems });
                      }} className="bg-[#0a0a0f] border border-white/5 rounded-xl px-4 py-2.5 w-full text-[14px] focus:outline-none focus:border-red-500" />
                      <input type="text" placeholder="ลิงก์รูป (URL)" value={item.image} onChange={e => {
                        const newItems = [...editingCase.items];
                        newItems[idx].image = e.target.value;
                        setEditingCase({ ...editingCase, items: newItems });
                      }} className="bg-[#0a0a0f] border border-white/5 rounded-xl px-4 py-2.5 w-full text-[14px] focus:outline-none focus:border-red-500" />
                    </div>
                    <div className="grid grid-cols-[2fr_1fr_0.5fr] gap-4">
                      <select value={item.rarity} onChange={e => {
                        const newItems = [...editingCase.items];
                        newItems[idx].rarity = e.target.value;
                        const colors: Record<string, string> = {
                          "Uncommon": "#10b981", "Rare": "#3b82f6", "Epic": "#8b5cf6",
                          "Legendary": "#f59e0b", "Mythic": "#ef4444"
                        };
                        newItems[idx].color = colors[e.target.value] || "#ffffff";
                        setEditingCase({ ...editingCase, items: newItems });
                      }} className="bg-[#0a0a0f] border border-white/5 rounded-xl px-4 py-2.5 w-full text-[14px] focus:outline-none focus:border-red-500">
                        <option value="Uncommon">Uncommon (เขียว)</option>
                        <option value="Rare">Rare (ฟ้า)</option>
                        <option value="Epic">Epic (ม่วง)</option>
                        <option value="Legendary">Legendary (ทอง)</option>
                        <option value="Mythic">Mythic (แดง)</option>
                      </select>
                      <div className="relative">
                        <input type="number" placeholder="เรท %" value={item.dropRate} onChange={e => {
                          const newItems = [...editingCase.items];
                          newItems[idx].dropRate = parseFloat(e.target.value) || 0;
                          setEditingCase({ ...editingCase, items: newItems });
                        }} className="bg-[#0a0a0f] border border-white/5 rounded-xl px-4 py-2.5 w-full text-[14px] text-center focus:outline-none focus:border-red-500" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="color" value={item.color} onChange={e => {
                          const newItems = [...editingCase.items];
                          newItems[idx].color = e.target.value;
                          setEditingCase({ ...editingCase, items: newItems });
                        }} className="h-[44px] w-[50px] rounded-xl cursor-pointer bg-transparent border-0 outline-none p-0" />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => {
                    const newItems = editingCase.items.filter((_: any, i: number) => i !== idx);
                    setEditingCase({ ...editingCase, items: newItems });
                  }} className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl transition-colors shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button onClick={() => setEditingCase(null)} className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-[14px] transition-colors">ยกเลิกไปก่อน</button>
              <button onClick={handleSaveCase} className="px-8 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-[14px] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(22,163,74,0.4)] active:scale-95">
                <Save className="w-4 h-4" /> กดบันทึกลงฐานข้อมูล
              </button>
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === "logs" && (
          <div>
            <h2 className="text-2xl font-black tracking-wide flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-red-500 rounded-full"></div>
              Log การโกง/ระบบแบน
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#161720] border-b border-white/5 rounded-t-xl">
                  <tr>
                    <th className="p-4 font-bold text-[13px] text-gray-400">เวลา</th>
                    <th className="p-4 font-bold text-[13px] text-gray-400">User</th>
                    <th className="p-4 font-bold text-[13px] text-gray-400">Action/การกระทำ</th>
                    <th className="p-4 font-bold text-[13px] text-gray-400">ประเภทการโกง</th>
                    <th className="p-4 font-bold text-[13px] text-gray-400">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500 font-bold">
                        ไม่มีประวัติการโกง 🎉
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log._id} className="border-b border-white/5 last:border-0 hover:bg-[#161720] transition-colors">
                        <td className="p-4 text-[13px] text-gray-400">
                          {new Date(log.createdAt).toLocaleString('th-TH')}
                        </td>
                        <td className="p-4 flex items-center gap-3">
                          <img referrerPolicy="no-referrer" src={log.userId?.avatar || `https://ui-avatars.com/api/?name=${log.userId?.username||'U'}`} alt="avatar" className="w-8 h-8 rounded-lg" />
                          <span className="font-bold text-[14px]">{log.userId?.username || "Unknown"}</span>
                        </td>
                        <td className="p-4">
                          <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-[8px] text-[12px] font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-[14px] font-medium text-orange-400">
                          {log.cheatType}
                        </td>
                        <td className="p-4 text-[13px] text-gray-300">
                          {log.description}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-black tracking-wide flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-red-500 rounded-full"></div>
              ปรับแต่งหน้าบ้าน
            </h2>
            <div className="space-y-6 bg-[#161720] border border-white/5 rounded-2xl p-8">
              <div>
                <label className="block text-[14px] font-bold text-gray-300 mb-2">ลิงก์ภาพพื้นหลัง (Background Image URL)</label>
                <input
                  type="text"
                  value={bgImageInput}
                  onChange={(e) => setBgImageInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl px-4 py-4 text-[14px] text-white focus:outline-none focus:border-red-500 transition-colors"
                />
                <p className="text-[12px] font-bold text-gray-500 mt-2">ปล่อยว่างไว้เพื่อใช้พื้นหลังดำสีล้วน Default Theme.</p>
                {bgImageInput && (
                  <div className="mt-5 rounded-[16px] overflow-hidden border border-white/10 h-48 relative shadow-inner">
                    <img referrerPolicy="no-referrer" src={bgImageInput} alt="Preview" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black to-transparent flex justify-center">
                      <span className="bg-black/80 px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-widest backdrop-blur-md shadow-md border border-white/10 text-white">Preview ภาพจะขึ้นบนเว็บแบบนี้</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-white/5">
                <label className="block text-[14px] font-bold text-gray-300 mb-2">ลิงก์ภาพ Promo Banner (แบนเนอร์กิจกรรมในหน้าแรก)</label>
                <input
                  type="text"
                  value={promoBannerInput}
                  onChange={(e) => setPromoBannerInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl px-4 py-4 text-[14px] text-white focus:outline-none focus:border-red-500 transition-colors"
                />
                {promoBannerInput && (
                  <div className="mt-5 rounded-[16px] overflow-hidden border border-white/10 h-48 relative shadow-inner">
                    <img referrerPolicy="no-referrer" src={promoBannerInput} alt="Preview" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black to-transparent flex justify-center">
                      <span className="bg-black/80 px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-widest backdrop-blur-md shadow-md border border-white/10 text-white">Preview ภาพ Promo Banner</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-white/5">
                <label className="block text-[14px] font-bold text-gray-300 mb-4">ลิงก์ภาพ Spotlight ด้านขวา (5 รูป)</label>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-400 mb-1">รูปที่ 1</label>
                    <input
                      type="text"
                      value={spotlightImage1}
                      onChange={(e) => setSpotlightImage1(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-gray-400 mb-1">รูปที่ 2</label>
                    <input
                      type="text"
                      value={spotlightImage2}
                      onChange={(e) => setSpotlightImage2(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-gray-400 mb-1">รูปที่ 3</label>
                    <input
                      type="text"
                      value={spotlightImage3}
                      onChange={(e) => setSpotlightImage3(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-gray-400 mb-1">รูปที่ 4</label>
                    <input
                      type="text"
                      value={spotlightImage4}
                      onChange={(e) => setSpotlightImage4(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-gray-400 mb-1">รูปที่ 5</label>
                    <input
                      type="text"
                      value={spotlightImage5}
                      onChange={(e) => setSpotlightImage5(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <label className="block text-[14px] font-bold text-gray-300 mb-4">ตั้งค่าไอเทมเริ่มต้น (Combat Armory Tier)</label>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-400 mb-1">ชื่อไอเทมเริ่มต้น (ไม่ต้องใส่ +0)</label>
                    <input
                      type="text"
                      value={combatArmoryNameInput}
                      onChange={(e) => setCombatArmoryNameInput(e.target.value)}
                      placeholder="Combat Armory Tier"
                      className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-gray-400 mb-1">ลิงก์รูปภาพไอเทมเริ่มต้น</label>
                    <input
                      type="text"
                      value={combatArmoryImageInput}
                      onChange={(e) => setCombatArmoryImageInput(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#0a0a0f] border border-white/5 rounded-xl px-4 py-3 text-[14px] text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  {combatArmoryImageInput && (
                    <div className="mt-2 rounded-[16px] overflow-hidden border border-white/10 w-32 h-32 relative shadow-inner flex items-center justify-center bg-[#0a0a0f]">
                      <img referrerPolicy="no-referrer" src={combatArmoryImageInput} alt="Preview" className="max-w-full max-h-full object-contain p-2" />
                    </div>
                  )}
                </div>
              </div>

              <button onClick={handleSaveSettings} className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] active:scale-[0.98] mt-4">
                อัปเดตการตั้งค่า
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
