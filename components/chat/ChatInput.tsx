import { Plus, Send } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { sendMessage } from "@/lib/api/message.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { socket } from "@/lib/socket/socketClient";
import { useAuth } from "@/lib/providers/AuthProvider";

interface ChatInputProps {
  chatId: string;
}

const ChatInput = ({ chatId }: ChatInputProps) => {
  const userId = useAuth().user?._id;

  const [value, setValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();

  const { mutate: sendMessageMutation } = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const handleSendMessage = () => {
    if (!value.trim()) return;
    sendMessageMutation({ content: value, chat_id: chatId });
    setValue("");
  };

  const handleTyping = (text: string) => {
    setValue(text);

    if (!userId) return;

    const room = `chat:${chatId}`;

    if (!isTyping) {
      socket.emit("typing:start", { room, userId });
      setIsTyping(true);
    }

    clearTimeout(typingTimeout.current ?? undefined);

    typingTimeout.current = setTimeout(() => {
      socket.emit("typing:stop", { room, userId });
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="relative ">
      <Input
        className="rounded-full pl-12 focus-visible:ring-0 focus-visible:border-0  h-12"
        placeholder="Type a message"
        value={value}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSendMessage();
        }}
        onChange={(e) => handleTyping(e.target.value)}
      />
      {value.length > 0 ? (
        <div className="absolute right-1 top-0  items-center h-full flex ">
          <Button
            onClick={() => handleSendMessage()}
            variant="outline"
            className="  rounded-full"
          >
            {" "}
            <Send />{" "}
          </Button>
        </div>
      ) : null}

      <div className="absolute left-4 top-0 flex items-center justify-center h-full">
        <Plus className="size-5" />
      </div>
    </div>
  );
};

export default ChatInput;
