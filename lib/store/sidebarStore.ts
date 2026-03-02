import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type SidebarType = 'DialPad' | 'NewChat' | 'NewContact' | null;

interface SidebarState {
  sidebar: SidebarType;
  changeSidebar: (val: SidebarType) => void;
}

export const useSidebarStore = create<SidebarState>()(
  devtools(
    persist(
      (set) => ({
        sidebar: null,
        changeSidebar: (val) => {
          set({ sidebar: val });
        },
      }),
      { name: 'SidebarStore' },
    ),
  ),
);
