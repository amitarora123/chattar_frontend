import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Search, User, Users, UsersRound } from "lucide-react";
import { useSidebarStore } from "@/lib/store/sidebarStore";
import { useChatStore } from "@/lib/store/chatStore";
import { useTypingStore } from "@/lib/store/typingStore";
import { useEffect, useState } from "react";

import { Input } from "../../ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { getMyChats } from "@/lib/api/chat.api";
import { cn, getMessageDateTimeStamp } from "@/lib/utils";
import MobileBottomNav from "@/components/ui/mobile-bottom-navbar";
import { socket } from "@/lib/socket/socketClient";
import { useAuth } from "@/lib/providers/AuthProvider";
import { Chat } from "@/types/chat.types";
import { User as AuthUser } from "@/types/user.types";
import ChatSkelton from "@/components/skelton/ChatSkelton";
import { Ticks } from "../ChatBubble";

const EMPTY_TYPING: string[] = [];

const ChatListItem = ({
  chat,
  onlineUserIds,
  authUser,
}: {
  chat: Chat;
  onlineUserIds: string[];
  authUser: AuthUser;
}) => {
  const { selectChat, selectedChat } = useChatStore();
  const typingUserIds = useTypingStore((s) => s.typingByChatId[chat._id] ?? EMPTY_TYPING);

  let displayName = "";
  let avatar_url = "";
  let otherParticipant = null;
  if (chat.is_group) {
    displayName = chat.groupMetaData!.name;
    avatar_url = chat.groupMetaData?.avatar_url ?? "";
  } else {
    otherParticipant = chat.participants.find((p) => p.user._id !== authUser._id);
    displayName = otherParticipant?.user.display_name || otherParticipant!.user.username;
    avatar_url = otherParticipant?.user.avatar_url ?? "";
  }

  let typingLabel = "";
  if (typingUserIds.length > 0) {
    if (!chat.is_group) {
      typingLabel = "typing...";
    } else {
      const names = typingUserIds.map((uid) => {
        const p = chat.participants.find((p) => p.user._id === uid);
        return p?.user.username || "Someone";
      });
      if (names.length === 1) {
        typingLabel = `${names[0]} is typing...`;
      } else if (names.length === 2) {
        typingLabel = `${names[0]}, ${names[1]} are typing...`;
      } else {
        typingLabel = `${names[0]} and ${names.length - 1} others are typing...`;
      }
    }
  }

  const isMyMessage = chat.last_message?.sender._id === authUser._id;

  const isMessageSeen = chat.last_message?.seen.find((s) => s.user_id === authUser._id);

  const myMessageSeen = chat.last_message?.seen.filter((s) => s.user_id !== authUser._id);

  const isMyMessageSeen = chat.participants.length - 1 === myMessageSeen?.length;

  return (
    <li
      key={chat._id}
      onClick={() => selectChat(chat)}
      className={cn(
        "p-3 hover:bg-slate-900/80 cursor-pointer rounded-lg mt-2 flex gap-4 transition-colors",
        selectedChat?._id === chat._id ? "bg-slate-900/80" : ""
      )}
    >
      {/* Avatar */}
      <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
        {avatar_url ? (
          <Image
            src={avatar_url}
            width={60}
            height={60}
            alt={displayName}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center">
            <User className="size-5 text-neutral-300" />
          </div>
        )}

        {/* Online Indicator */}
        {!chat.is_group &&
          otherParticipant &&
          onlineUserIds.includes(otherParticipant.user._id) && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-neutral-900 rounded-full" />
          )}
      </div>

      {/* Chat Content */}
      <div className="flex-1 min-w-0">
        {/* Top Row */}
        <div className="flex items-center justify-between">
          <span className="font-medium truncate">{displayName}</span>

          <div className="flex items-center gap-2">
            {chat.unread_count > 0 && (
              <span className="size-4 flex items-center justify-center text-[9px] rounded-full bg-red-500 text-white">
                {chat.unread_count}
              </span>
            )}
            {chat.last_message?.createdAt && (
              <span className="text-xs whitespace-nowrap ml-2 text-neutral-400">
                {getMessageDateTimeStamp(chat.last_message.updatedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Last Message */}
        {typingLabel ? (
          <p className="truncate text-sm text-green-400 mt-1 animate-pulse">{typingLabel}</p>
        ) : chat.last_message ? (
          chat.last_message.is_deleted ? (
            <span className="text-sm italic text-neutral-400">This message was deleted</span>
          ) : (
            <div className="flex items-center gap-1">
              {isMyMessage && (
                <Ticks
                  isPending={!!chat.last_message.isPending}
                  isMessageSeen={isMyMessageSeen}
                  isMyMessage={isMyMessage}
                />
              )}
              <p
                className={`truncate text-sm mt-1 ${!isMyMessage && !isMessageSeen ? "font-semibold text-white" : "text-neutral-400"}`}
              >
                {chat.is_group && (isMyMessage ? "me: " : chat.last_message.sender.username) + ": "}
                {chat.last_message.content || chat.last_message.attachment?.file_name}
              </p>
            </div>
          )
        ) : null}
      </div>
    </li>
  );
};

const ChatList = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { changeSidebar } = useSidebarStore();
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: getMyChats,
    enabled: !!user,
  });

  const isLoading = authLoading || chatsLoading;

  const [activeTabs, setActiveTabs] = useState<"All" | "Unread">("All");

  useEffect(() => {
    socket.on("presence:initial", (users) => {
      setOnlineUserIds(users);
    });

    socket.on("user:online", (userId) => {
      setOnlineUserIds((prev) => [...prev, userId]);
    });

    socket.on("user:offline", (userId) => {
      setOnlineUserIds((prev) => prev.filter((id) => id != userId));
    });

    return () => {
      socket.off("presence:initial");
      socket.off("user:online");
      socket.off("user:offline");
    };
  }, []);

  const filteredChats =
    activeTabs === "All"
      ? chats
      : chats?.filter((c) =>
          !!c.last_message
            ? c.last_message?.sender._id !== user?._id &&
              !c.last_message?.seen?.some((s) => s.user_id === user?._id)
            : false
        );
  return (
    <>
      <div className="p-3 flex flex-col flex-1 min-h-0">
        {/* Logo */}
        <div className="flex w-full  justify-between items-center">
          <Image src="/logo_3.svg" width={150} height={150} alt="logo" />

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="rounded-full p-2 transition-colors cursor-pointer duration-200 hover:bg-neutral-800"
                  onClick={() => changeSidebar("DialPad")}
                >
                  <Users size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>People</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="rounded-full p-2 transition-colors cursor-pointer duration-200 hover:bg-neutral-800"
                  onClick={() => changeSidebar("GroupChat")}
                >
                  <UsersRound size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>New Group</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Search */}
        <div className="my-5 relative">
          <Input
            type="text"
            className="rounded-full pl-10 focus-visible:ring-0 py-5"
            placeholder="Search or start a new chat"
          />
          <div className="absolute left-3 h-full flex items-center top-0">
            <Search className="size-4 text-muted-foreground" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 items-center mb-2">
          <button
            className={cn(
              "rounded-full px-5 py-1 hover:bg-slate-900 cursor-pointer transition-colors duration-100 ease border-border text-sm border hover:text-white",
              activeTabs === "All" ? "bg-slate-100! hover:text-black text-black" : ""
            )}
            onClick={() => setActiveTabs("All")}
          >
            All
          </button>

          <button
            className={cn(
              "rounded-full px-5 py-1 cursor-pointer hover:bg-slate-900 transition-colors duration-100 ease border-border text-sm border",
              activeTabs === "Unread" ? "bg-slate-100! text-black" : ""
            )}
            onClick={() => setActiveTabs("Unread")}
          >
            Unread
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div>
              <ChatSkelton />
              <ChatSkelton />
              <ChatSkelton />
              <ChatSkelton />
              <ChatSkelton />
            </div>
          ) : chats?.length ? (
            <ul className="overflow-y-auto hide-scrollbar h-full pb-5">
              {filteredChats?.map((chat) => (
                <ChatListItem
                  key={chat._id}
                  chat={chat}
                  authUser={user!}
                  onlineUserIds={onlineUserIds}
                />
              ))}
            </ul>
          ) : (
            <p className="text-slate-400">No Chats Found</p>
          )}
        </div>
      </div>
      <MobileBottomNav />
    </>
  );
};

export default ChatList;
