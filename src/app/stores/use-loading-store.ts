import { create } from "zustand";

interface LoadingStore {
  isLoading: boolean;
  isLoadingView: boolean;
  isSorting: boolean;
  isFiltering: boolean;

  setIsLoading: (isLoading: boolean) => void;
  setIsLoadingView: (isLoadingView: boolean) => void;
  setIsSorting: (isLoading: boolean) => void;
  setIsFiltering: (isLoading: boolean) => void;
}

export const useLoadingStore = create<LoadingStore>((set) => ({
  isLoading: false,
  isSorting: false,
  isFiltering: false,
  isLoadingView: false,
  isLoadingFavourites: false,

  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setIsLoadingView: (isLoadingView: boolean) => set({ isLoadingView }),
  setIsSorting: (isLoading: boolean) => set({ isSorting: isLoading }),
  setIsFiltering: (isLoading: boolean) => set({ isFiltering: isLoading }),
}));
