import { create } from 'zustand';

export type SidebarType =
  | 'DialPad'
  | 'NewChat'
  | 'NewContact'
  | 'NewGroup'
  | 'AllChats'
  | 'AddGroupMembers';

interface SidebarState {
  sidebar: SidebarType;
  changeSidebar: (val: SidebarType) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  sidebar: 'AllChats',
  changeSidebar: (val) => {
    set({ sidebar: val });
  },
}));
