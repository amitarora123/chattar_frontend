import React, { useEffect, useRef, useState } from 'react';
import ChatBubble from './ChatBubble';
import { useQuery } from '@tanstack/react-query';
import {
  getChatById,
  getChatMessages,
  getRecipientDetails,
} from '@/lib/actions/chat';
import { useChatStore } from '@/lib/store/chatStore';
import { Session } from 'next-auth';
import { socket } from '@/lib/socket/socketClient';
import { useQueryClient } from '@tanstack/react-query';
import { Message } from '@/types/message.types';
import Image from 'next/image';
import { User } from 'lucide-react';
import TypingIndicator from './TypingIndicator';

const MessageContainer = ({ session }: { session: Session | null }) => {
  const { selectedChatId, selectedRecipientId } = useChatStore();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const queryClient = useQueryClient();

  const { token, user } = session || {};
  const { data: messages } = useQuery({
    queryKey: ['chat-messages', { selectedChatId, selectedRecipientId }],
    queryFn: () => getChatMessages(token!, selectedChatId, selectedRecipientId),
    enabled: !!token && (!!selectedChatId || !!selectedRecipientId),
  });

  const { data: recipient } = useQuery({
    queryKey: ['recipient-details', selectedRecipientId],
    queryFn: async () =>
      await getRecipientDetails(token!, selectedRecipientId!),
    enabled: !!token && !!selectedRecipientId,
  });

  const { data: chat } = useQuery({
    queryKey: ['chat', selectedChatId],
    queryFn: async () => await getChatById(token!, selectedChatId!),
    enabled: !!token && !!selectedChatId,
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  }, []);

  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      queryClient.setQueryData(
        ['chat-messages', { selectedChatId, selectedRecipientId }],
        (oldMessages: Message[] | undefined) => {
          if (!oldMessages) return [message];

          return [...oldMessages, message];
        },
      );
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView();
      }
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [queryClient, selectedChatId, selectedRecipientId]);

  useEffect(() => {
    socket.on('typing:start', ({ userId }) => {
      setTypingUsers((prev) => [...new Set([...prev, userId])]);
    });

    socket.on('typing:stop', ({ userId }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    });

    return () => {
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto pt-10 pb-14 flex flex-col gap-3  px-5 hide-scrollbar ">
      {messages?.map((message) => (
        <ChatBubble
          isGroup={!!selectedChatId}
          key={message._id}
          message={message}
          userId={user?.id || ''}
        />
      ))}

      {typingUsers.map((userId) => {
        const participant =
          chat?.participants?.find((p) => p.user._id === userId) || recipient;

        return (
          <div key={userId} className="flex items-center">
            <div className="flex items-start gap-2">
              {!!selectedChatId && (
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
                  <p className="text-xs text-slate-400">
                    {participant.contactName
                      ? participant.contactName
                      : `~ ${participant.user.username}`}
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
