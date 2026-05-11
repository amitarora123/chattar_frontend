import { Chat } from "@/types/chat.types";
import { create } from "zustand";

interface ChatStore {
  selectedChat: Chat | null;
  selectChat: (chat: Chat | null) => void;
}

export const useChatStore = create<ChatStore>()((set) => ({
  selectedChat: null,
  selectChat: (chat: Chat | null) => {
    set({ selectedChat: chat });
  },
}));
