"use client";
import ChatContainer from "@/components/chat/ChatContainer";
import { useSidebarStore } from "@/lib/store/sidebarStore";
import { useChatStore } from "@/lib/store/chatStore";
import Sidebar from "@/components/chat/sidebar/Sidebar";

const ChatsPage = () => {
  const { sidebar } = useSidebarStore();
  const { selectedChat } = useChatStore();

  const isChatOpen = !!selectedChat;

  return (
    <main className="grid lg:grid-cols-4 grid-cols-1 overflow-hidden flex-1 h-full">
      {/* Sidebar column */}
      <div
        className={`relative col-span-1 overflow-hidden h-full ${
          isChatOpen && sidebar === "ChatList" ? "hidden lg:block" : "block"
        }`}
      >
        <Sidebar type="ChatList" className="h-full" />

        <Sidebar
          type="DialPad"
          className={`absolute z-50 inset-0 transition-transform duration-300 ${
            sidebar === "DialPad" ? "translate-x-0" : "translate-x-full"
          }`}
        />

        <Sidebar
          type="GroupChat"
          className={`absolute z-50 inset-0 transition-transform duration-300 ${
            sidebar === "GroupChat" ? "translate-x-0" : "translate-x-full"
          }`}
        />
      </div>

      {/* Chat area */}
      {isChatOpen && <ChatContainer className="z-50 bg-background lg:col-span-3" />}
    </main>
  );
};

export default ChatsPage;
