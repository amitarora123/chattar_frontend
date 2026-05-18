import { create } from "zustand";

interface PresenceStore {
  onlineUserIds: string[];
  setInitial: (ids: string[]) => void;
  setOnline: (userId: string) => void;
  setOffline: (userId: string) => void;
  isOnline: (userId: string) => boolean;
}

export const usePresenceStore = create<PresenceStore>()((set, get) => ({
  onlineUserIds: [],
  setInitial: (ids) => set({ onlineUserIds: ids }),
  setOnline: (userId) =>
    set((s) => ({ onlineUserIds: [...new Set([...s.onlineUserIds, userId])] })),
  setOffline: (userId) =>
    set((s) => ({ onlineUserIds: s.onlineUserIds.filter((id) => id !== userId) })),
  isOnline: (userId) => get().onlineUserIds.includes(userId),
}));
