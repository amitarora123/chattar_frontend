import { clearChat } from "@/lib/api/chat.api";
import { useChatStore } from "@/lib/store/chatStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, X } from "lucide-react";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { useEffect } from "react";
import { socket } from "@/lib/socket/socketClient";
import ChatClear from "./ChatClear";
import { useAuth } from "@/lib/providers/AuthProvider";

const ChatHeader = () => {
  const { selectedChat, selectChat } = useChatStore();
  const { user } = useAuth();
  const userId = user?._id;

  const queryClient = useQueryClient();

  const { mutate: clearChatMutate } = useMutation({
    mutationKey: ["clear-chat", selectedChat!._id],
    mutationFn: clearChat,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chat-messages", selectedChat!._id],
      });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const handleClearChat = () => {
    clearChatMutate(selectedChat!._id);
  };

  useEffect(() => {
    if (!selectedChat) return;

    const room = `chat:${selectedChat._id}`;
    const joinRoom = () => socket.emit("chat:join", room);

    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);

    return () => {
      socket.off("connect", joinRoom);
    };
  }, [selectedChat, userId]);

  if (!selectedChat) return null;

  const recipient = selectedChat.participants.find((p) => p.user._id !== userId);
  const avatar_url = selectedChat.is_group
    ? selectedChat.groupMetaData?.avatar_url
    : recipient?.user.avatar_url || "";
  const displayName = selectedChat.is_group
    ? selectedChat.groupMetaData!.name
    : recipient?.contactName || recipient?.user.display_name || recipient?.user.username;
  const participantsName = selectedChat.is_group
    ? selectedChat.participants.map((p) => p.contactName || p.user.display_name || p.user.username)
    : [];

  return (
    <>
      <header className="px-4 py-3  ">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {avatar_url ? (
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
              <p className="text-slate-400 text-sm">({participantsName.join(", ")})</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ChatClear onConfirm={handleClearChat} />
            <Button onClick={() => selectChat(null)} variant="outline">
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
