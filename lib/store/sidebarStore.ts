import { create } from "zustand";

export type SidebarType = "ChatList" | "DialPad" | "GroupChat";

interface SidebarState {
  sidebar: SidebarType;
  changeSidebar: (val: SidebarType) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  sidebar: "ChatList",
  changeSidebar: (val) => set({ sidebar: val }),
}));
