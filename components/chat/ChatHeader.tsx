import {
  clearChat,
  getChatById,
  getRecipientDetails,
} from '@/lib/actions/chat';
import { useChatStore } from '@/lib/store/chatStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash, User, X } from 'lucide-react';
import { Session } from 'next-auth';
import Image from 'next/image';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { useEffect } from 'react';
import { socket } from '@/lib/socket/socketClient';
import { getChatKey } from '@/lib/service/chat';
import { toast } from 'sonner';

const ChatHeader = ({ session }: { session: Session | null }) => {
  const {
    selectedChatId,
    selectedRecipientId,
    setSelectedChatId,
    setSelectedRecipientId,
  } = useChatStore();

  const queryClient = useQueryClient();
  const { token } = session || {};

  const { data: chat } = useQuery({
    queryKey: ['chat', selectedChatId],
    queryFn: async () => await getChatById(token!, selectedChatId!),
    enabled: !!token && !!selectedChatId,
  });

  const { data: recipient } = useQuery({
    queryKey: ['recipient-details', selectedRecipientId],
    queryFn: async () =>
      await getRecipientDetails(token!, selectedRecipientId!),
    enabled: !!token && !!selectedRecipientId,
  });

  const { mutate: clearChatMutate } = useMutation({
    mutationKey: ['clear-chat', selectedChatId],
    mutationFn: clearChat,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['chat-messages', { selectedChatId, selectedRecipientId }],
      });
      queryClient.invalidateQueries({
        queryKey: ['chats', { selectedChatId, selectedRecipientId }],
      });
    },
  });

  const handleClearChat = async () => {
    console.log(selectedChatId, selectedRecipientId);
    if ((selectedChatId && selectedRecipientId) || !token) {
      toast.error('Invalid chatId or token');
      return;
    }

    clearChatMutate({
      chat_id: selectedChatId,
      token,
      recipient_id: selectedRecipientId,
    });
  };
  const joinRoom = (room: string) => {
    socket.emit('chat:join', room);
  };

  const avatar_url =
    recipient?.user.avatar_url || chat?.groupMetaData?.avatar_url || '';
  const displayName =
    recipient?.contactName ||
    recipient?.user.username ||
    chat?.groupMetaData?.name ||
    '';

  useEffect(() => {
    const handleJoinRoom = () => {
      if (!selectedChatId && !selectedRecipientId) return;

      if (selectedRecipientId && session?.user.id) {
        const chatKey = getChatKey(session.user.id, selectedRecipientId);
        const room = `chat:${chatKey}`;
        joinRoom(room);
      }

      if (selectedChatId) {
        const room = `chat:${selectedChatId}`;
        joinRoom(room);
      }
    };

    if (socket.connected) {
      handleJoinRoom();
    }

    socket.on('connect', handleJoinRoom);

    return () => {
      socket.off('connect', handleJoinRoom);
    };
  }, [selectedChatId, selectedRecipientId, session]);

  if (!recipient && !chat) {
    return null;
  }

  const participantsName =
    chat?.participants?.map((p) => p.contactName || p.user.username) || [];

  return (
    <>
      <header className="px-4 py-3  ">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {avatar_url.length > 0 ? (
              <Image
                src={avatar_url}
                width={40}
                height={40}
                alt={displayName || 'Avatar'}
                className="rounded-full"
              />
            ) : (
              <User size={20} className="rounded-full" />
            )}
            <p>{displayName}</p>
            {participantsName.length > 0 && (
              <p className="text-slate-400 text-sm">
                ({participantsName.join(', ')})
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleClearChat} variant="destructive">
              <span className="hidden sm:inline">Clear</span>{' '}
              <Trash className="size-4 sm:hidden" />
            </Button>
            <Button
              onClick={() => {
                setSelectedChatId(null);
                setSelectedRecipientId(null);
              }}
              variant="outline"
            >
              <X />
            </Button>
          </div>
        </div>
      </header>
      <Separator />
    </>
  );
};
export default ChatHeader;
