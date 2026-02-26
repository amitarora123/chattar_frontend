'use client';
import ChatContainer from '@/components/chat/ChatContainer';
import ChatsSidebar from '@/components/chat/ChatsSidebar';
import { Chat } from '@/types/chat.types';
import { useState } from 'react';

const ChatsPage = () => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  return (
    <main className="h-full grid  lg:grid-cols-4 overflow-hidden flex-1">
      <ChatsSidebar
        setSelectedChat={setSelectedChat}
        className="lg:col-span-1 max-lg:h-screen"
      />
      {selectedChat && (
        <ChatContainer chat={selectedChat} className="lg:col-span-3" />
      )}
    </main>
  );
};

export default ChatsPage;
