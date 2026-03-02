import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';
import MessageContainer from './MessageContainer';

interface ChatContainerProps {
  className: string;
}

const ChatContainer = ({ className }: ChatContainerProps) => {
  const { data: session } = useSession();

  return (
    <section
      className={clsx(
        className,
        'w-full flex overflow-hidden flex-col h-screen relative',
      )}
    >
      <ChatHeader session={session} />
      <MessageContainer session={session} />

      <div className="h-fit py-5 px-5">
        <ChatInput session={session} />
      </div>
    </section>
  );
};

export default ChatContainer;
