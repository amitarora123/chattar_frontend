import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type SidebarType =
  | 'DialPad'
  | 'NewChat'
  | 'NewContact'
  | 'NewGroup'
  | 'AllChats';

interface SidebarState {
  sidebar: SidebarType;
  changeSidebar: (val: SidebarType) => void;
}

export const useSidebarStore = create<SidebarState>()(
  devtools(
    persist(
      (set) => ({
        sidebar: 'AllChats',
        changeSidebar: (val) => {
          set({ sidebar: val });
        },
      }),
      { name: 'SidebarStore' },
    ),
  ),
);
