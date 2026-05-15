import { create } from "zustand";

interface TypingStore {
  typingByChatId: Record<string, string[]>;
  setTyping: (chatId: string, userId: string) => void;
  clearTyping: (chatId: string, userId: string) => void;
}

export const useTypingStore = create<TypingStore>()((set) => ({
  typingByChatId: {},
  setTyping: (chatId, userId) =>
    set((state) => ({
      typingByChatId: {
        ...state.typingByChatId,
        [chatId]: [...new Set([...(state.typingByChatId[chatId] ?? []), userId])],
      },
    })),
  clearTyping: (chatId, userId) =>
    set((state) => ({
      typingByChatId: {
        ...state.typingByChatId,
        [chatId]: (state.typingByChatId[chatId] ?? []).filter((id) => id !== userId),
      },
    })),
}));
