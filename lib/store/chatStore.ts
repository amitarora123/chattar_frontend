import { Chat } from "@/types/chat.types";
import { create } from "zustand";

interface ChatStore {
  selectedChat: Chat | null;
  selectChat: (chat: Chat | null) => void;
  attachment: File | null;
  setAttachment: (file: File | null) => void;
}

export const useChatStore = create<ChatStore>()((set) => ({
  selectedChat: null,
  attachment: null,
  selectChat: (chat: Chat | null) => {
    set({ selectedChat: chat });
  },
  setAttachment: (file: File | null) => {
    set({ attachment: file });
  },
}));
