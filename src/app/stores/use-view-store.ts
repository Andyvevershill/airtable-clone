import type { View } from "@/server/db/schemas";
import { create } from "zustand";

interface ViewStore {
  activeView: View | null;
  setActiveView: (viewId: View) => void;

  savingView: boolean;
  setSavingView: (savingView: boolean) => void;
}

export const useViewStore = create<ViewStore>((set) => ({
  activeView: null,
  // {
  //   id: "",
  //   name: "",
  //   createdAt: new Date(),
  //   isFavourite: false,
  //   tableId: "",
  //   isActive: false,
  //   filters: null,
  //   sorting: null,
  //   hidden: null,
  // },

  setActiveView: (activeView) => set({ activeView }),

  savingView: false,
  setSavingView: (savingView) => set({ savingView }),
}));
