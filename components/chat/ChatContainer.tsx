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

  return (
    <section className={clsx(className, "w-full flex overflow-hidden flex-col  relative")}>
      <ChatHeader />
      <MessageContainer />

      <div className="h-fit py-5 px-5">
        {selectedChat && <ChatInput chatId={selectedChat._id} />}
      </div>
    </section>
  );
};

export default ChatContainer;
