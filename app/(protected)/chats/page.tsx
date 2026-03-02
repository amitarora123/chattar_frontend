'use client';
import ChatContainer from '@/components/chat/ChatContainer';
import { useSidebarStore } from '@/lib/store/sidebarStore';
import { useChatStore } from '@/lib/store/chatStore';
import Sidebar from '@/components/chat/sidebar/Sidebar';

const ChatsPage = () => {
  const { sidebar } = useSidebarStore();
  const { selectedChatId, selectedRecipientId } = useChatStore();

  const isChatOpen = !!selectedChatId || !!selectedRecipientId;
  console.log({
    selectedChatId,
    selectedRecipientId,
  });
  return (
    <main className="h-full grid lg:grid-cols-4 grid-cols-1 overflow-hidden flex-1">
      {/* Sidebar */}
      <div
        className={`
          relative col-span-1 overflow-hidden h-full
          ${isChatOpen ? 'hidden lg:block' : 'block'}
        `}
      >
        <Sidebar type="AllChats" className="h-full" />

        <Sidebar
          type="NewChat"
          className={`absolute inset-0 transition-transform duration-300 ${
            sidebar === 'NewChat' ? 'translate-x-0' : '-translate-x-full'
          }`}
        />

        <Sidebar
          type="DialPad"
          className={`absolute inset-0 transition-transform duration-300 ${
            sidebar === 'DialPad' ? 'translate-x-0' : 'translate-x-full'
          }`}
        />

        <Sidebar
          type="NewContact"
          className={`absolute inset-0 transition-transform duration-300 ${
            sidebar === 'NewContact' ? 'translate-x-0' : 'translate-x-full'
          }`}
        />

        <Sidebar
          type="NewGroup"
          className={`absolute inset-0 transition-transform duration-300 ${
            sidebar === 'NewGroup' ? 'translate-x-0' : 'translate-x-full'
          }`}
        />
      </div>

      {/* Chat Container */}
      <div
        className={`
          col-span-1 lg:col-span-3 h-full
          ${isChatOpen ? 'block' : 'hidden lg:block'}
        `}
      >
        <ChatContainer className="lg:col-span-3" />
      </div>
    </main>
  );
};

export default ChatsPage;
