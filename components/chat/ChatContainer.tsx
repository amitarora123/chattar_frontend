import clsx from 'clsx';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';
import MessageContainer from './MessageContainer';
import { useChatStore } from '@/lib/store/chatStore';

interface ChatContainerProps {
  className: string;
}

const ChatContainer = ({ className }: ChatContainerProps) => {
  const { selectedChatId } = useChatStore();

  return (
    <section
      className={clsx(
        className,
        'w-full flex overflow-hidden flex-col h-screen relative',
      )}
    >
      <ChatHeader />
      <MessageContainer />

      <div className="h-fit py-5 px-5">
        {selectedChatId && <ChatInput chatId={selectedChatId} />}
      </div>
    </section>
  );
};

export default ChatContainer;
