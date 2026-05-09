import { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import { useQuery } from "@tanstack/react-query";
import { getChatById, getChatMessages } from "@/lib/api/chat.api";
import { useChatStore } from "@/lib/store/chatStore";
import { socket } from "@/lib/socket/socketClient";
import { useQueryClient } from "@tanstack/react-query";
import { Message } from "@/types/message.types";
import Image from "next/image";
import { User } from "lucide-react";
import TypingIndicator from "./TypingIndicator";
import { useAuth } from "@/lib/providers/AuthProvider";

const MessageContainer = () => {
  const userId = useAuth().user?._id;

  const { selectedChatId } = useChatStore();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const queryClient = useQueryClient();

  const { data: messages } = useQuery({
    queryKey: ["chat-messages", selectedChatId],
    queryFn: () => getChatMessages(selectedChatId!),
    enabled: !!userId && !!selectedChatId,
  });

  const { data: chat } = useQuery({
    queryKey: ["chat", selectedChatId],
    queryFn: async () => await getChatById(selectedChatId!),
    enabled: !!selectedChatId,
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  }, []);

  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      queryClient.setQueryData(
        ["chat-messages", selectedChatId],
        (oldMessages: Message[] | undefined) => {
          if (!oldMessages) return [message];
          return [...oldMessages, message];
        },
      );
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView();
      }
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [queryClient, selectedChatId]);

  useEffect(() => {
    socket.on("typing:start", ({ userId }) => {
      setTypingUsers((prev) => [...new Set([...prev, userId])]);
    });

    socket.on("typing:stop", ({ userId }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    });

    return () => {
      socket.off("typing:start");
      socket.off("typing:stop");
    };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto pt-10 pb-14 flex flex-col gap-3  px-5 hide-scrollbar ">
      {messages?.map((message) => (
        <ChatBubble
          isGroup={!!chat?.isGroup}
          key={message._id}
          message={message}
          userId={userId || ""}
        />
      ))}

      {typingUsers.map((userId) => {
        const participant = chat?.members?.find((m) => m._id === userId);

        return (
          <div key={userId} className="flex items-center">
            <div className="flex items-start gap-2">
              {chat?.isGroup && (
                <div className="rounded-full">
                  {participant?.avatar ? (
                    <Image
                      src={participant.avatar}
                      width={30}
                      height={30}
                      className="rounded-full"
                      alt={participant.username}
                    />
                  ) : (
                    <User />
                  )}
                </div>
              )}
              <div className=" text-white bg-neutral-800 rounded-lg px-3 py-2">
                {participant && (
                  <p className="text-xs text-slate-400">
                    {participant.name || `~ ${participant.username}`}
                  </p>
                )}
                <TypingIndicator />
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} className="w-full h-5" />
    </div>
  );
};

export default MessageContainer;
