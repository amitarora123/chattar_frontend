import { create } from 'zustand';

interface GroupState {
  userIds: string[];
  selectUserId: (id: string) => void;
  unSelectUserId: (id: string) => void;
  setUserIds: (userIds: string[]) => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  userIds: [],
  selectUserId: (id) => {
    set((state) => ({
      userIds: state.userIds.includes(id)
        ? state.userIds
        : [...state.userIds, id],
    }));
  },
  unSelectUserId: (id) => {
    set((state) => ({
      userIds: state.userIds.filter((userId) => userId != id),
    }));
  },
  setUserIds: (userIds) => {
    set({ userIds });
  },
}));
