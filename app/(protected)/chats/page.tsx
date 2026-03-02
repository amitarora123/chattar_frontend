'use client';
import ChatContainer from '@/components/chat/ChatContainer';
import ChatsSidebar from '@/components/chat/ChatsSidebar';
import DialPadSidebar from '@/components/chat/DialPadSidebar';
import NewChatSidebar from '@/components/chat/NewChatSidebar';
import { useSidebarStore } from '@/lib/store/sidebarStore';

const ChatsPage = () => {
  const { sidebar } = useSidebarStore();

  return (
    <main className="h-full grid  lg:grid-cols-4 grid-cols-1 overflow-hidden flex-1">
      <div className="relative col-span-1 overflow-hidden h-full">
        <ChatsSidebar className="h-full" />

        <NewChatSidebar
          className={`absolute inset-0 transition-transform duration-300 ${
            sidebar === 'NewChat' ? 'translate-x-0' : '-translate-x-full'
          }`}
        />
        <DialPadSidebar
          className={`absolute inset-0 transition-transform duration-300 ${
            sidebar !== null && sidebar !== 'NewChat'
              ? 'translate-x-0'
              : 'translate-x-full'
          }`}
        />
      </div>
      <ChatContainer className="lg:col-span-3" />
    </main>
  );
};

export default ChatsPage;
