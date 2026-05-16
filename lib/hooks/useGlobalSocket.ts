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

    const handleMessageUpdate = (message: Message) => {
      queryClient.setQueryData(
        ["chat-messages", message.chat_id],
        (oldData: InfiniteData<Message[]> | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.map((m) => (m._id === message._id ? message : m))
            ),
          };
        }
      );
      queryClient.setQueryData(["chats"], (chats: Chat[] | undefined) => {
        if (!chats) return chats;
        return chats.map((c) =>
          c.last_message?._id === message._id ? { ...c, last_message: message } : c
        );
      });
    };

    const handleMessageDelete = ({
      message_id,
      chat_id,
    }: {
      message_id: string;
      chat_id: string;
    }) => {
      queryClient.setQueryData(
        ["chat-messages", chat_id],
        (oldData: InfiniteData<Message[]> | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.map((m) =>
                m._id === message_id
                  ? { ...m, is_deleted: true, content: "", attachment: undefined }
                  : m
              )
            ),
          };
        }
      );
      queryClient.setQueryData(["chats"], (chats: Chat[] | undefined) => {
        if (!chats) return chats;
        return chats.map((c) =>
          c.last_message?._id === message_id
            ? { ...c, last_message: { ...c.last_message!, is_deleted: true, content: "" } }
            : c
        );
      });
    };

    socket.on("message:receive", handleNewMessage);
    socket.on("message:seen", handleNewSeen);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("message:update", handleMessageUpdate);
    socket.on("message:delete", handleMessageDelete);

    return () => {
      socket.off("message:receive", handleNewMessage);
      socket.off("message:seen", handleNewSeen);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("message:update", handleMessageUpdate);
      socket.off("message:delete", handleMessageDelete);
    };
  }, [queryClient, selectedChat, setTyping, clearTyping]);
}
