import { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import { useQuery } from "@tanstack/react-query";
import { getChatMessages } from "@/lib/api/chat.api";
import { useChatStore } from "@/lib/store/chatStore";
import { socket } from "@/lib/socket/socketClient";
import { useQueryClient } from "@tanstack/react-query";
import { Message } from "@/types/message.types";
import Image from "next/image";
import TypingIndicator from "./TypingIndicator";
import { useAuth } from "@/lib/providers/AuthProvider";
import { User } from "lucide-react";
import MessageSkeleton from "../skelton/MessageSkelton";

// MessageSkeleton.tsx

const MessageContainer = () => {
  const userId = useAuth().user?._id;
  const { selectedChat } = useChatStore();
  const selectedChatId = selectedChat?._id;

  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["chat-messages", selectedChatId],
    queryFn: () => getChatMessages(selectedChatId!),
    enabled: !!selectedChatId,
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  };

  // useEffect to register socket events
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      queryClient.setQueryData(
        ["chat-messages", selectedChatId],
        (oldMessages: Message[] | undefined) => {
          if (!oldMessages) return [message];
          return [...oldMessages, message];
        }
      );
    };

    const handleNewSeen = (data: { message_id: string; userId: string; seen_at: string }) => {
      queryClient.setQueryData(
        ["chat-messages", selectedChatId],
        (oldMessages: Message[] | undefined) => {
          if (!oldMessages) return oldMessages;
          return oldMessages.map((m) => {
            if (m._id !== data.message_id) return m;
            const alreadySeen = m.seen.some((s) => s.participant_id === data.userId);
            if (alreadySeen) return m;
            return {
              ...m,
              seen: [...m.seen, { participant_id: data.userId, viewed_at: data.seen_at }],
            };
          });
        }
      );
    };

    const handleTypingStart = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => [...new Set([...prev, userId])]);
    };

    const handleTypingStop = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    };

    socket.on("typing:start", handleTypingStart);

    socket.on("typing:stop", handleTypingStop);

    socket.on("message:new", handleNewMessage);
    socket.on("message:new_seen", handleNewSeen);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:new_seen", handleNewSeen);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, [queryClient, selectedChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages?.length]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 px-5 py-4">
        <MessageSkeleton type="left" />
        <MessageSkeleton type="right" />
        <MessageSkeleton type="right" />
        <MessageSkeleton type="left" />
        <MessageSkeleton type="right" />
      </div>
    );
  }
  return (
    <div className=" overflow-y-auto gap-3 min-h-0 flex-1  px-5 hide-scrollbar ">
      {messages?.map((message) => (
        <ChatBubble
          isGroup={!!selectedChat?.is_group}
          key={message._id}
          message={message}
          userId={userId || ""}
          totalMembers={selectedChat?.participants.length || 0}
        />
      ))}

      {typingUsers.map((userId) => {
        const participant = selectedChat?.participants?.find((p) => p.user._id === userId);

        return (
          <div key={userId} className="flex items-center">
            <div className="flex items-start gap-2">
              {selectedChat?.is_group && (
                <div className="rounded-full">
                  {participant?.user.avatar_url ? (
                    <Image
                      src={participant.user.avatar_url}
                      width={30}
                      height={30}
                      className="rounded-full"
                      alt={participant.user.username}
                    />
                  ) : (
                    <User />
                  )}
                </div>
              )}
              <div className=" text-white bg-neutral-800 rounded-lg px-3 py-2">
                {participant && (
                  <p className="text-xs text-slate-400">{`~ ${participant.user.username}`}</p>
                )}
                <TypingIndicator />
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} className="w-full h-1" />
    </div>
  );
};

export default MessageContainer;
