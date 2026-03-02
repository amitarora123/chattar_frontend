import React, { useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';
import { useQuery } from '@tanstack/react-query';
import { getChatMessages } from '@/lib/actions/chat';
import { useChatStore } from '@/lib/store/chatStore';
import { Session } from 'next-auth';

const MessageContainer = ({ session }: { session: Session | null }) => {
  const { selectedChatId, selectedRecipientId } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { token, user } = session || {};
  const { data: messages } = useQuery({
    queryKey: ['chat-messages', { selectedChatId, selectedRecipientId }],
    queryFn: () => getChatMessages(token!, selectedChatId, selectedRecipientId),
    enabled: !!token && (!!selectedChatId || !!selectedRecipientId),
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  }, []);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-3  px-5 hide-scrollbar ">
      {messages?.map((message) => (
        <ChatBubble
          key={message._id}
          message={message}
          userId={user?.id || ''}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageContainer;
