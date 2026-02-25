import ChatContainer from '@/components/chat/ChatContainer';
import ChatsSidebar from '@/components/chat/ChatsSidebar';

const ChatsPage = () => {
  return (
    <main className="h-full grid grid-cols-4">
      <ChatsSidebar className="col-span-1 " />
      <ChatContainer className="col-span-3" />
    </main>
  );
};

export default ChatsPage;
