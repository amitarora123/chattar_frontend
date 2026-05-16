import { create } from "zustand";
import { Message } from "@/types/message.types";

interface ChatInputStore {
  replyingTo: Message | null;
  editingMessage: Message | null;
  setReplyingTo: (message: Message | null) => void;
  setEditingMessage: (message: Message | null) => void;
  clear: () => void;
}

export const useChatInputStore = create<ChatInputStore>()((set) => ({
  replyingTo: null,
  editingMessage: null,
  setReplyingTo: (message) => set({ replyingTo: message, editingMessage: null }),
  setEditingMessage: (message) => set({ editingMessage: message, replyingTo: null }),
  clear: () => set({ replyingTo: null, editingMessage: null }),
}));
