import { useChatStore } from "@/lib/store/chatStore";
import { usePresenceStore } from "@/lib/store/presenceStore";
import { ArrowLeft, Info, Search, User } from "lucide-react";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { useEffect } from "react";
import { socket } from "@/lib/socket/socketClient";
import { useAuth } from "@/lib/providers/AuthProvider";

interface ChatHeaderProps {
  onInfoClick: () => void;
  showInfo: boolean;
  onSearchClick: () => void;
  showSearch: boolean;
}

const ChatHeader = ({ onInfoClick, showInfo, onSearchClick, showSearch }: ChatHeaderProps) => {
  const { selectedChat, selectChat } = useChatStore();
  const { user } = useAuth();
  const userId = user?._id;
  const isOnline = usePresenceStore((s) => s.isOnline);

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
  const avatarUrl = selectedChat.is_group
    ? selectedChat.groupMetaData?.avatar_url
    : recipient?.user.avatar_url || "";
  const displayName = selectedChat.is_group
    ? selectedChat.groupMetaData!.name
    : recipient?.user.display_name || recipient?.user.username;
  const recipientOnline = !selectedChat.is_group && !!recipient && isOnline(recipient.user._id);
  const onlineCount = selectedChat.is_group
    ? selectedChat.participants.filter((p) => isOnline(p.user._id)).length
    : 0;
  const subtitle = selectedChat.is_group
    ? onlineCount > 0
      ? `${selectedChat.participants.length} members, ${onlineCount} online`
      : `${selectedChat.participants.length} members`
    : recipientOnline
      ? "Online"
      : recipient?.user.username
        ? `@${recipient.user.username}`
        : null;

  return (
    <>
      <header className="px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Left: back + avatar + name — clickable to open info panel */}
          <button
            onClick={onInfoClick}
            className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
          >
            <span
              className="md:hidden shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                selectChat(null);
              }}
            >
              <ArrowLeft className="size-5 text-white font-semibold" />
            </span>
            <span className="relative shrink-0 w-9 h-9">
              <span className="w-9 h-9 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    width={36}
                    height={36}
                    alt={displayName || "Avatar"}
                    className="rounded-full object-cover w-9 h-9"
                  />
                ) : (
                  <User size={18} className="text-neutral-400" />
                )}
              </span>
              {recipientOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0d1117] rounded-full" />
              )}
            </span>
            <span className="flex flex-col min-w-0">
              <span className="font-medium text-sm truncate leading-tight">{displayName}</span>
              {subtitle && (
                <span className="text-xs text-slate-400 truncate leading-tight mt-0.5">
                  {subtitle}
                </span>
              )}
            </span>
          </button>

          {/* Right: search + info toggles */}
          <div className="flex items-center gap-1">
            <button
              onClick={onSearchClick}
              className={`p-2 rounded-full transition-colors ${
                showSearch
                  ? "bg-white/15 text-white"
                  : "hover:bg-white/10 text-slate-400 hover:text-white"
              }`}
              title="Search messages"
            >
              <Search size={18} />
            </button>
            <button
              onClick={onInfoClick}
              className={`p-2 rounded-full transition-colors ${
                showInfo
                  ? "bg-white/15 text-white"
                  : "hover:bg-white/10 text-slate-400 hover:text-white"
              }`}
              title={showInfo ? "Close info" : "Contact info"}
            >
              <Info size={18} />
            </button>
          </div>
        </div>
      </header>
      <Separator />
    </>
  );
};

export default ChatHeader;
