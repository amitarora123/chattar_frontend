import clsx from "clsx";
import ChatInput from "./ChatInput";
import ChatHeader from "./ChatHeader";
import MessageContainer from "./MessageContainer";
import { useChatStore } from "@/lib/store/chatStore";

interface ChatContainerProps {
  className: string;
}

const ChatContainer = ({ className }: ChatContainerProps) => {
  const { selectedChat } = useChatStore();

  if (!selectedChat) return null;

  return (
    <section className={clsx(className, "w-full h-full flex overflow-hidden flex-col  relative")}>
      <ChatHeader />
      <MessageContainer />
      {selectedChat && <ChatInput chatId={selectedChat._id} />}
    </section>
  );
};

export default ChatContainer;
