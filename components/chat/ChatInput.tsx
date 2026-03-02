import { Plus, Send } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { sendMessage } from '@/lib/actions/message';
import { SendMessageProps } from '@/types/message.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { useChatStore } from '@/lib/store/chatStore';
import { Session } from 'next-auth';

const ChatInput = ({ session }: { session: Session | null }) => {
  const { token } = session || {};

  const { selectedChatId, selectedRecipientId } = useChatStore();
  const [value, setValue] = useState('');

  const queryClient = useQueryClient();

  const { mutate: sendMessageMutation } = useMutation({
    mutationFn: ({ token, data }: { token: string; data: SendMessageProps }) =>
      sendMessage(token, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['chat-messages'],
      });

      queryClient.invalidateQueries({
        queryKey: ['chats'],
      });

      setValue('');
    },
  });

  const handleSendMessage = () => {
    if (!token) {
      toast.error('Invalid token');
      return;
    } else if (!selectedChatId && !selectedRecipientId) {
      toast.error('Invalid chatId or recipientId');
      return;
    } else {
      sendMessageMutation({
        token,
        data: {
          content: value,
          is_group: selectedChatId ? true : false,
          chat_id: selectedChatId ? selectedChatId : undefined,
          recipient_id: selectedRecipientId ? selectedRecipientId : undefined,
        },
      });
    }
  };

  if (!selectedChatId && !selectedRecipientId) {
    return null;
  }

  return (
    <div className="relative ">
      <Input
        className="rounded-full pl-12 focus-visible:ring-0 focus-visible:border-0  h-12"
        placeholder="Type a message"
        value={value}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSendMessage();
        }}
        onChange={(e) => setValue(e.target.value)}
      />
      {value.length > 0 ? (
        <div className="absolute right-1 top-0  items-center h-full flex ">
          <Button
            onClick={() => handleSendMessage()}
            variant="outline"
            className="  rounded-full"
          >
            {' '}
            <Send />{' '}
          </Button>
        </div>
      ) : null}

      <div className="absolute left-4 top-0 flex items-center justify-center h-full">
        <Plus className="size-5" />
      </div>
    </div>
  );
};

export default ChatInput;
