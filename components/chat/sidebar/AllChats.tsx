import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { BatteryPlus, Search, User } from "lucide-react";
import { useSidebarStore } from "@/lib/store/sidebarStore";
import clsx from "clsx";
import { useChatStore } from "@/lib/store/chatStore";
import { useEffect, useState } from "react";

import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { getMyChats } from "@/lib/api/chat.api";
import { getMessageDateTimeStamp } from "@/lib/utils";
import MobileBottomNav from "@/components/ui/mobile-bottom-navbar";
import { socket } from "@/lib/socket/socketClient";
import { useAuth } from "@/lib/providers/AuthProvider";

const AllChats = () => {
  const { user } = useAuth();
  const userId = user?._id;
  const { changeSidebar } = useSidebarStore();
  const { setSelectedChatId } = useChatStore();
  const [onilneUserIds, setOnlineUserIds] = useState<string[]>([]);

  const { data: chats } = useQuery({
    queryKey: ["chats"],
    queryFn: getMyChats,
  });

  const [activeTabs, setActiveTabs] = useState<"All" | "Unread">("All");

  useEffect(() => {
    socket.on("presence:initial", (users) => {
      setOnlineUserIds(users);
    });

    socket.on("user:online", (userId) => {
      console.log(userId, "came online");
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
  return (
    <>
      <div className="p-3 flex flex-col flex-1 min-h-0">
        {/* Logo */}
        <div className="flex w-full  justify-between items-center">
          <Image src="/logo_3.svg" width={150} height={150} alt="logo" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="rounded-full p-2 transition-colors cursor-pointer duration-200 hover:bg-neutral-800"
                onClick={() => changeSidebar("NewChat")}
              >
                <BatteryPlus />
              </button>
            </TooltipTrigger>

            <TooltipContent>
              <p>Add new Chat</p>
            </TooltipContent>
          </Tooltip>
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
          <Button
            variant="outline"
            className={clsx(
              "rounded-full",
              activeTabs === "All" && "bg-neutral-700",
            )}
            onClick={() => setActiveTabs("All")}
          >
            All
          </Button>

          <Button
            variant="outline"
            className={clsx(
              "rounded-full",
              activeTabs === "Unread" && "bg-neutral-700",
            )}
            onClick={() => setActiveTabs("Unread")}
          >
            Unread
          </Button>
        </div>

        {/* Chat List */}
        <div className="flex-1 min-h-0">
          <ul className="overflow-y-auto hide-scrollbar h-full pb-5">
            {chats?.map((chat) => {
              const otherMember = chat.members.find((m) => m._id !== userId);
              const avatar = chat.isGroup ? undefined : otherMember?.avatar;
              return (
                <li
                  key={chat._id}
                  onClick={() => setSelectedChatId(chat._id)}
                  className="p-3 hover:bg-neutral-800 cursor-pointer rounded-lg mt-2 flex gap-4 transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
                    {avatar ? (
                      <Image
                        src={avatar}
                        width={60}
                        height={60}
                        alt={chat.name}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center">
                        <User className="size-5 text-neutral-300" />
                      </div>
                    )}

                    {/* Online Indicator */}
                    {!chat.isGroup && otherMember && onilneUserIds.includes(otherMember._id) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-neutral-900 rounded-full" />
                    )}
                  </div>

                  {/* Chat Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top Row */}
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{chat.name}</span>

                      {chat.lastMessage?.createdAt && (
                        <span className="text-xs whitespace-nowrap ml-2 text-neutral-400">
                          {getMessageDateTimeStamp(chat.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>

                    {/* Last Message */}
                    {chat.lastMessage && (
                      <p className="truncate text-sm text-neutral-400 mt-1">
                        {chat.isGroup &&
                          (chat.lastMessage.sender._id === userId
                            ? "me: "
                            : (chat.lastMessage.sender.name || chat.lastMessage.sender.username) + ": ")}
                        {chat.lastMessage.content}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <MobileBottomNav />
    </>
  );
};

export default AllChats;
