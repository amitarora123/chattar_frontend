import { useEffect } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { socket } from "@/lib/socket/socketClient";
import { useChatStore } from "@/lib/store/chatStore";
import { useTypingStore } from "@/lib/store/typingStore";
import { Message } from "@/types/message.types";
import { Chat } from "@/types/chat.types";

export function useGlobalSocket() {
  const queryClient = useQueryClient();
  const selectedChat = useChatStore((s) => s.selectedChat);
  const { setTyping, clearTyping } = useTypingStore();

  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      const isActiveChat = message.chat_id === selectedChat?._id;

      queryClient.setQueryData(["chats"], (chats: Chat[] | undefined) => {
        if (!chats) return chats;
        return chats.map((c) =>
          c._id === message.chat_id
            ? {
                ...c,
                last_message: message,
                unread_count: isActiveChat ? c.unread_count : c.unread_count + 1,
              }
            : c
        );
      });

      if (isActiveChat) {
        queryClient.setQueryData(
          ["chat-messages", message.chat_id],
          (oldData: InfiniteData<Message[]> | undefined) => {
            if (!oldData) return oldData;
            const alreadyExists = oldData.pages.some((page) =>
              page.some((m) => m._id === message._id)
            );
            if (alreadyExists) return oldData;
            const newPages = [...oldData.pages];
            newPages[0] = [...newPages[0], message];
            return { ...oldData, pages: newPages };
          }
        );
      }
    };

    const handleNewSeen = (data: { message_id: string; userId: string; seen_at: string }) => {
      queryClient.setQueryData(["chats"], (chats: Chat[] | undefined) => {
        if (!chats) return chats;
        return chats.map((c) => {
          if (c.last_message?._id !== data.message_id) return c;
          const alreadySeen = c.last_message.seen.some((s) => s.user_id === data.userId);
          if (alreadySeen) return c;
          return {
            ...c,
            last_message: {
              ...c.last_message,
              seen: [...c.last_message.seen, { user_id: data.userId, viewed_at: data.seen_at }],
            },
          };
        });
      });

      if (selectedChat) {
        queryClient.setQueryData(
          ["chat-messages", selectedChat._id],
          (oldData: InfiniteData<Message[]> | undefined) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page) =>
                page.map((m) => {
                  if (m._id !== data.message_id) return m;
                  const alreadySeen = m.seen.some((s) => s.user_id === data.userId);
                  if (alreadySeen) return m;
                  return {
                    ...m,
                    seen: [...m.seen, { user_id: data.userId, viewed_at: data.seen_at }],
                  };
                })
              ),
            };
          }
        );
      }
    };

    const handleTypingStart = ({ userId, chat_id }: { userId: string; chat_id: string }) => {
      setTyping(chat_id, userId);
    };

    const handleTypingStop = ({ userId, chat_id }: { userId: string; chat_id: string }) => {
      clearTyping(chat_id, userId);
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:new_seen", handleNewSeen);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:new_seen", handleNewSeen);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, [queryClient, selectedChat, setTyping, clearTyping]);
}
