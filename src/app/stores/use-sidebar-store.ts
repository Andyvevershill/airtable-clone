import { create } from "zustand";

interface SidebarStore {
  sideBarOpen: boolean;
  setSideBarOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  sideBarOpen: true,
  setSideBarOpen: (open) => set({ sideBarOpen: open }),
}));
