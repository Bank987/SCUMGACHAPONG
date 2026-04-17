import { create } from "zustand";

interface User {
  _id: string;
  discordId: string;
  username: string;
  avatar: string;
  spins: number;
  upgradePoints: number;
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
  setUser: (user: User | null) => void;
  setSpins: (spins: number) => void;
  setUpgradePoints: (points: number) => void;
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
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSpins: (spins) => set((state) => ({ user: state.user ? { ...state.user, spins } : null })),
  setUpgradePoints: (upgradePoints) => set((state) => ({ user: state.user ? { ...state.user, upgradePoints } : null })),
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
          spotlightImages: data.spotlightImages || []
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    }
  }
}));
