import { create } from "zustand";

interface GlobalSearchStore {
  globalSearch: string;
  setGlobalSearch: (globalSearch: string) => void;
}

export const useGlobalSearchStore = create<GlobalSearchStore>((set) => ({
  globalSearch: "",
  setGlobalSearch: (globalSearch: string) => set({ globalSearch }),
}));
