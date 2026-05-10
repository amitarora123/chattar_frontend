import { Chat } from "@/types/chat.types";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface ChatStore {
  selectedChat: Chat | null;
  selectChat: (chat: Chat | null) => void;
}

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set) => ({
        selectedChat: null,
        selectChat: (chat: Chat | null) => {
          set({ selectedChat: chat });
        },
      }),
      { name: "ChatStore" }
    )
  )
);
