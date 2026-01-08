import { create } from "zustand";

interface SavingStore {
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
}

export const useSavingStore = create<SavingStore>((set) => ({
  isSaving: false,
  setIsSaving: (isSaving: boolean) => set({ isSaving }),
}));
