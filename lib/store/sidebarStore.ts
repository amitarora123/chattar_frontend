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
  mountedSidebars: Set<SidebarType>;
  changeSidebar: (val: SidebarType) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  sidebar: 'AllChats',
  mountedSidebars: new Set<SidebarType>(),
  changeSidebar: (val) => {
    set((state) => ({
      sidebar: val,
      mountedSidebars: state.mountedSidebars.has(val)
        ? state.mountedSidebars
        : new Set(state.mountedSidebars).add(val),
    }));
  },
}));
