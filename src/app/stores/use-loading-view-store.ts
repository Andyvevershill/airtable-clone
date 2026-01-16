import { create } from "zustand";

interface LoadingViewStore {
  isLoadingView: boolean;
  setIsLoadingView: (isLoadingView: boolean) => void;
}

export const useLoadingViewStore = create<LoadingViewStore>((set) => ({
  isLoadingView: false,
  setIsLoadingView: (isLoadingView: boolean) => set({ isLoadingView }),
}));
