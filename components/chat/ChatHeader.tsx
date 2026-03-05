import { getChatById, getRecipientDetails } from '@/lib/actions/chat';
import { useChatStore } from '@/lib/store/chatStore';
import { useQuery } from '@tanstack/react-query';
import { User, X } from 'lucide-react';
import { Session } from 'next-auth';
import Image from 'next/image';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { useEffect } from 'react';
import { socket } from '@/lib/socket/socketClient';
import { getChatKey } from '@/lib/service/chat';

const ChatHeader = ({ session }: { session: Session | null }) => {
  const {
    selectedChatId,
    selectedRecipientId,
    setSelectedChatId,
    setSelectedRecipientId,
  } = useChatStore();

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
          </div>
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
      </header>
      <Separator />
    </>
  );
};
export default ChatHeader;
