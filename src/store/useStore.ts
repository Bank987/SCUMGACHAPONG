import { create } from "zustand";

interface User {
  _id: string;
  discordId: string;
  username: string;
  gameName?: string;
  avatar: string;
  spins: number;
  upgradePoints: number;
  levelTickets: number;
  taskPoints: number;
  weaponLicenseLevel: number;
  balance: number;
  role: string;
  allowedCases?: string[];
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  backgroundImage: string;
  promoBanner: string;
  spotlightImages: string[];
  weaponLicenseName: string;
  weaponLicenseImage: string;
  weaponLicenseLevelNames: string[];
  taskFunctionName: string;
  taskFunctionImage: string;
  taskNames: string[];
  taskImages: string[];
  setUser: (user: User | null) => void;
  setSpins: (spins: number) => void;
  setUpgradePoints: (points: number) => void;
  setLevelTickets: (tickets: number) => void;
  setTaskPoints: (points: number) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  fetchSettings: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  backgroundImage: "https://storage.googleapis.com/aistudio-user-uploads/b2c8a1e8-d1a2-4b3c-9d4e-5f6a7b8c9d0e.png",
  promoBanner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070",
  spotlightImages: [],
  weaponLicenseName: "ใบอนุญาตครอบครองอาวุธ",
  weaponLicenseImage: "",
  weaponLicenseLevelNames: Array.from({ length: 15 }, (_, index) => `LEVEL ${index + 1}`),
  taskFunctionName: "สุ่มความสำเร็จภารกิจ",
  taskFunctionImage: "",
  taskNames: ["ภารกิจ 1", "ภารกิจ 2", "ภารกิจ 3"],
  taskImages: ["", "", ""],
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSpins: (spins) => set((state) => ({ user: state.user ? { ...state.user, spins } : null })),
  setUpgradePoints: (upgradePoints) => set((state) => ({ user: state.user ? { ...state.user, upgradePoints } : null })),
  setLevelTickets: (levelTickets) => set((state) => ({ user: state.user ? { ...state.user, levelTickets } : null })),
  setTaskPoints: (taskPoints) => set((state) => ({ user: state.user ? { ...state.user, taskPoints } : null })),
  checkAuth: async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const user = await res.json();
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
  logout: async () => {
    try {
      localStorage.removeItem("token");
      await fetch("/api/auth/logout", { method: "POST" });
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error("Logout failed", error);
    }
  },
  fetchSettings: async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        set({
          backgroundImage: data.backgroundImage || "https://storage.googleapis.com/aistudio-user-uploads/b2c8a1e8-d1a2-4b3c-9d4e-5f6a7b8c9d0e.png",
          promoBanner: data.promoBanner || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070",
          spotlightImages: data.spotlightImages || [],
          weaponLicenseName: data.weaponLicenseName || "ใบอนุญาตครอบครองอาวุธ",
          weaponLicenseImage: data.weaponLicenseImage || "",
          weaponLicenseLevelNames: Array.isArray(data.weaponLicenseLevelNames) && data.weaponLicenseLevelNames.length === 15
            ? data.weaponLicenseLevelNames
            : Array.from({ length: 15 }, (_, index) => `LEVEL ${index + 1}`),
          taskFunctionName: data.taskFunctionName || "สุ่มความสำเร็จภารกิจ",
          taskFunctionImage: data.taskFunctionImage || "",
          taskNames: Array.isArray(data.taskNames) && data.taskNames.length === 3 ? data.taskNames : ["ภารกิจ 1", "ภารกิจ 2", "ภารกิจ 3"],
          taskImages: Array.isArray(data.taskImages) && data.taskImages.length === 3 ? data.taskImages : ["", "", ""]
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    }
  }
}));
