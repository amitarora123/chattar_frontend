"use client";
import ChatContainer from "@/components/chat/ChatContainer";
import { useSidebarStore } from "@/lib/store/sidebarStore";
import { useChatStore } from "@/lib/store/chatStore";
import Sidebar from "@/components/chat/sidebar/Sidebar";
const ChatsPage = () => {
  const { sidebar, mountedSidebars } = useSidebarStore();
  const { selectedChat } = useChatStore();

  const isChatOpen = !!selectedChat;

  return (
    <main className="grid lg:grid-cols-4 grid-cols-1 overflow-hidden flex-1">
      {/* Sidebar */}
      <div
        className={`
    relative col-span-1 overflow-hidden h-full
    ${isChatOpen && sidebar === "ChatList" ? "hidden lg:block" : "block"}
  `}
      >
        <Sidebar type="ChatList" className="h-full" />

        {mountedSidebars.has("NewChat") && (
          <Sidebar
            type="NewChat"
            className={`absolute z-50 flex flex-col  inset-0 transition-transform duration-300 ${
              sidebar === "NewChat" ? "translate-x-0" : "-translate-x-full"
            }`}
          />
        )}

        {mountedSidebars.has("DialPad") && (
          <Sidebar
            type="DialPad"
            className={`absolute z-50 inset-0 transition-transform duration-300 ${
              sidebar === "DialPad" ? "translate-x-0" : "translate-x-full"
            }`}
          />
        )}

        {mountedSidebars.has("NewContact") && (
          <Sidebar
            type="NewContact"
            className={`absolute z-50 inset-0 transition-transform duration-300 ${
              sidebar === "NewContact" ? "translate-x-0" : "translate-x-full"
            }`}
          />
        )}

        {mountedSidebars.has("AddGroupMembers") && (
          <Sidebar
            type="AddGroupMembers"
            className={`absolute z-50 inset-0 transition-transform duration-300 ${
              sidebar === "AddGroupMembers"
                ? "translate-x-0"
                : sidebar === "NewGroup"
                  ? "-translate-x-full"
                  : "translate-x-full"
            } `}
          />
        )}

        {mountedSidebars.has("NewGroup") && (
          <Sidebar
            type="NewGroup"
            className={`absolute z-50 inset-0 transition-transform duration-300 ${
              sidebar === "NewGroup" ? "translate-x-0" : "translate-x-full"
            }`}
          />
        )}
      </div>

      {/* Chat Container */}

      {isChatOpen && <ChatContainer className="z-50 h-full bg-background lg:col-span-3" />}
    </main>
  );
};

export default ChatsPage;
