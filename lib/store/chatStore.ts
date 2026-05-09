import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ChatStore {
  selectedChatId: string | null;
  setSelectedChatId: (chatId: string | null) => void;
}

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set) => ({
        selectedChatId: null as string | null,
        setSelectedChatId: (chatId: string | null) => {
          set({ selectedChatId: chatId });
        },
      }),
      { name: 'ChatStore' },
    ),
  ),
);
