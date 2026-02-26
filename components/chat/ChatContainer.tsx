import { getChatMessages } from '@/lib/actions/chat';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import ChatBubble from './ChatBubble';
import Image from 'next/image';
import { User } from 'lucide-react';
import { Separator } from '../ui/separator';
import ChatInput from './ChatInput';
import { useEffect, useRef, useState } from 'react';
import { sendMessage, SendMessageProps } from '@/lib/actions/message';
import { toast } from 'sonner';
import { Chat } from '@/types/chat.types';

interface ChatContainerProps {
  className: string;
  chat: Chat;
}

const ChatContainer = ({
  className,
  chat: { _id: chatId, name, avatar },
}: ChatContainerProps) => {
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const [value, setValue] = useState('');

  const { token, user } = session || {};

  const { data: messages } = useQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: async () => await getChatMessages(token!, chatId),
    enabled: !!token && !!chatId,
  });

  const { mutate: sendMessageMutation } = useMutation({
    mutationKey: ['message'],
    mutationFn: async ({
      token,
      data,
    }: {
      token: string;
      data: SendMessageProps;
    }) => await sendMessage(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['chat-messages', chatId],
      });
      setValue('');
    },
  });

  const handleSendMessage = () => {
    if (!token) {
      toast.error('Invalid token');
      return;
    }
    sendMessageMutation({
      token,
      data: {
        content: value,
        is_group: false,
        chat_id: chatId,
      },
    });
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  }, [chatId]);

  if (!chatId) return null;

  return (
    <section
      className={clsx(
        className,
        'w-full flex overflow-hidden flex-col h-screen relative',
      )}
    >
      <header className="px-4 py-3  ">
        <div>
          <div className="flex items-center gap-4">
            {avatar && avatar.length > 0 ? (
              <Image
                src={avatar}
                width={40}
                height={40}
                alt={name}
                className="rounded-full"
              />
            ) : (
              <User size={20} className="rounded-full" />
            )}
            <p>{name}</p>
          </div>
        </div>
      </header>
      <Separator />
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

      <div className="h-fit py-5 px-5">
        <ChatInput
          onSubmit={handleSendMessage}
          value={value}
          onChange={(val) => setValue(val)}
        />
      </div>
    </section>
  );
};

export default ChatContainer;
