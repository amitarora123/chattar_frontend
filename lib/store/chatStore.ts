import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ChatStore {
  selectedChatId: string | null;
  selectedRecipientId: string | null;

  setSelectedChatId: (chatId: string | null) => void;
  setSelectedRecipientId: (recipientId: string | null) => void;
}

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set) => ({
        selectedChatId: null as string | null,
        selectedRecipientId: null as string | null,
        setSelectedChatId: (chatId: string | null) => {
          set({ selectedChatId: chatId });
        },
        setSelectedRecipientId: (recipientId: string | null) => {
          set({ selectedRecipientId: recipientId });
        },
      }),
      { name: 'ChatStore' },
    ),
  ),
);
