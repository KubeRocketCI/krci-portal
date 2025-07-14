import { create } from "zustand";

export interface PageUIStore {
  deployBtnDisabled: boolean;
  setDeployBtnDisabled: (deployBtnDisabled: boolean) => void;
}

export const usePageUIStore = create<PageUIStore>((set) => ({
  deployBtnDisabled: false,
  setDeployBtnDisabled: (deployBtnDisabled) => set({ deployBtnDisabled }),
}));
