import { clearChat, getChatById } from "@/lib/api/chat.api";
import { useChatStore } from "@/lib/store/chatStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User, X } from "lucide-react";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { useEffect } from "react";
import { socket } from "@/lib/socket/socketClient";
import ChatClear from "./ChatClear";
import { useAuth } from "@/lib/providers/AuthProvider";

const ChatHeader = () => {
  const { selectedChatId, setSelectedChatId } = useChatStore();

  const { user } = useAuth();
  const userId = user?._id;
  const queryClient = useQueryClient();

  const { data: chat } = useQuery({
    queryKey: ["chat", selectedChatId],
    queryFn: async () => await getChatById(selectedChatId!),
    enabled: !!selectedChatId,
  });

  const { mutate: clearChatMutate } = useMutation({
    mutationKey: ["clear-chat", selectedChatId],
    mutationFn: clearChat,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chat-messages", selectedChatId],
      });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const handleClearChat = () => {
    if (!selectedChatId) return;
    clearChatMutate(selectedChatId);
  };

  useEffect(() => {
    if (!selectedChatId || !userId) return;

    const room = `chat:${selectedChatId}`;
    const joinRoom = () => socket.emit("chat:join", room);

    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);

    return () => {
      socket.off("connect", joinRoom);
    };
  }, [selectedChatId, userId]);

  if (!chat) return null;

  const recipient = chat.members.find((m) => m._id !== userId);

  const avatar_url = chat.isGroup ? "" : recipient?.avatar || "";
  const displayName = chat.name;
  const participantsName = chat.isGroup
    ? chat.members.map((m) => m.name || m.username)
    : [];

  return (
    <>
      <header className="px-4 py-3  ">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {avatar_url.length > 0 ? (
              <Image
                src={avatar_url}
                width={40}
                height={40}
                alt={displayName || "Avatar"}
                className="rounded-full"
              />
            ) : (
              <User size={20} className="rounded-full" />
            )}
            <p>{displayName}</p>
            {participantsName.length > 0 && (
              <p className="text-slate-400 text-sm">
                ({participantsName.join(", ")})
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ChatClear onConfirm={handleClearChat} />
            <Button
              onClick={() => setSelectedChatId(null)}
              variant="outline"
            >
              <X />
            </Button>
          </div>
        </div>
      </header>
      <Separator />
    </>
  );
};
export default ChatHeader;
