import { create } from "zustand";

interface GlobalSearchStore {
  globalSearch: string;
  activeMatchIndex: number;
  globalSearchLength: number;
  isSearching: boolean;
  hasSearched: boolean;

  setGlobalSearch: (value: string) => void;
  setActiveMatchIndex: (index: number) => void;
  setGlobalSearchLength: (length: number) => void;
  setIsSearching: (v: boolean) => void;
  setHasSearched: (v: boolean) => void;
  resetSearch: () => void;
}

export const useGlobalSearchStore = create<GlobalSearchStore>((set) => ({
  globalSearch: "",
  activeMatchIndex: 0,
  globalSearchLength: 0,
  isSearching: false,
  hasSearched: false,

  setGlobalSearch: (globalSearch) =>
    set({
      globalSearch,
      hasSearched: true,
    }),

  setIsSearching: (isSearching) => set({ isSearching }),

  setActiveMatchIndex: (index) => set({ activeMatchIndex: index }),

  setGlobalSearchLength: (length) => set({ globalSearchLength: length }),

  setHasSearched: (hasSearched) => set({ hasSearched }),

  resetSearch: () =>
    set({
      globalSearch: "",
      activeMatchIndex: 0,
      globalSearchLength: 0,
      isSearching: false,
      hasSearched: false,
    }),
}));
