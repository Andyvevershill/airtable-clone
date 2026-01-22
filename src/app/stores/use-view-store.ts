import { create } from "zustand";

interface ViewStore {
  activeViewId: string;
  setActiveViewId: (viewId: string) => void;

  savingView: boolean;
  setSavingView: (savingView: boolean) => void;
}

export const useViewStore = create<ViewStore>((set) => ({
  activeViewId: "",
  setActiveViewId: (activeViewId: string) => set({ activeViewId }),

  savingView: false,
  setSavingView: (savingView: boolean) => set({ savingView }),
}));
