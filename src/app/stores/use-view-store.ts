import type { View } from "@/server/db/schemas";
import { create } from "zustand";

interface ViewStore {
  activeView: View | null;
  setActiveView: (viewId: View) => void;
  reset: () => void;

  savingView: boolean;
  setSavingView: (savingView: boolean) => void;
}

export const useViewStore = create<ViewStore>((set) => ({
  activeView: null,

  setActiveView: (activeView) => set({ activeView }),
  reset: () => set({ activeView: null }),

  savingView: false,
  setSavingView: (savingView) => set({ savingView }),
}));
