import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import { useInfiniteQuery, InfiniteData } from "@tanstack/react-query";
import { getChatMessages } from "@/lib/api/message.api";
import { useChatStore } from "@/lib/store/chatStore";
import { socket } from "@/lib/socket/socketClient";
import { useQueryClient } from "@tanstack/react-query";
import { Message, MessageSeen } from "@/types/message.types";
import Image from "next/image";
import TypingIndicator from "./TypingIndicator";
import { useAuth } from "@/lib/providers/AuthProvider";
import { User } from "lucide-react";
import MessageSkeleton from "../skelton/MessageSkelton";
import { Chat } from "@/types/chat.types";

const LIMIT = 30;

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatDateSeparator = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const MessageContainer = () => {
  const userId = useAuth().user?._id;
  const { selectedChat } = useChatStore();
  const selectedChatId = selectedChat?._id;

  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const separatorRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledInitialRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const prevPagesLengthRef = useRef(0);

  const [prevChatId, setPrevChatId] = useState<string | undefined>(undefined);
  const [initialUnreadCount, setInitialUnreadCount] = useState(0);
  if (prevChatId !== selectedChatId) {
    setPrevChatId(selectedChatId);
    setInitialUnreadCount(selectedChat?.unread_count ?? 0);
  }

  const queryClient = useQueryClient();

  useEffect(() => {
    hasScrolledInitialRef.current = false;
    prevPagesLengthRef.current = 0;
  }, [selectedChatId]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["chat-messages", selectedChatId],
    queryFn: ({ pageParam }) =>
      getChatMessages({
        chat_id: selectedChatId!,
        offset: pageParam as number,
        limit: LIMIT,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < LIMIT) return undefined;
      return pages.length * LIMIT;
    },
    enabled: !!selectedChatId,
  });

  // pages[0] = most recent batch, pages[N] = oldest batch (each page sorted ASC)
  // Reverse page order so oldest messages appear at top
  const messages = data?.pages.slice().reverse().flat() ?? [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView();
  };

  // Restore scroll position after older messages are prepended (runs before paint)
  useLayoutEffect(() => {
    const pagesLength = data?.pages.length ?? 0;
    if (pagesLength <= 1) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
  }, [data?.pages.length]);

  // Scroll to bottom on new messages / initial load; skip when an older page just loaded
  useEffect(() => {
    const currentPagesLength = data?.pages.length ?? 0;
    const isOlderPageLoaded =
      currentPagesLength > prevPagesLengthRef.current && currentPagesLength > 1;
    prevPagesLengthRef.current = currentPagesLength;

    if (!messages.length || isOlderPageLoaded) return;

    if (!hasScrolledInitialRef.current) {
      hasScrolledInitialRef.current = true;
      if (separatorRef.current) {
        separatorRef.current.scrollIntoView({ block: "nearest" });
        return;
      }
    }

    scrollToBottom();
  }, [messages.length, data?.pages.length]);

  // Load older messages when the top sentinel becomes visible
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage &&
          hasScrolledInitialRef.current
        ) {
          prevScrollHeightRef.current = container.scrollHeight;
          fetchNextPage();
        }
      },
      { root: container, threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const decreaseUnreadCount = useCallback(
    (message_id: string, data: MessageSeen) => {
      queryClient.setQueryData(["chats"], (chats: Chat[]) => {
        const updatedChats = chats.map((c) =>
          c._id === selectedChat!._id
            ? {
                ...c,
                unread_count: c.unread_count - 1,
                last_message:
                  c.last_message?._id === message_id
                    ? { ...c.last_message, seen: [c.last_message.seen, data] }
                    : c.last_message,
              }
            : c
        );
        return updatedChats;
      });
    },
    [selectedChat, queryClient]
  );

  const handleMessageSeen = useCallback(
    (message_id: string) => {
      socket.emit(
        "message:seen",
        { room: `chat:${selectedChat!._id}`, userId, message_id },
        (response: { error?: string; data?: MessageSeen }) => {
          if (response.error) {
            console.error("Failed to mark seen:", response.error);
          }
          if (response.data) {
            decreaseUnreadCount(message_id, response.data);
          }
        }
      );
    },
    [selectedChat, userId, decreaseUnreadCount]
  );

  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      queryClient.setQueryData(
        ["chat-messages", selectedChatId],
        (oldData: InfiniteData<Message[]> | undefined) => {
          if (!oldData) return oldData;
          const alreadyExists = oldData.pages.some((page) =>
            page.some((m) => m._id === message._id)
          );
          if (alreadyExists) return oldData;
          const newPages = [...oldData.pages];
          newPages[0] = [...newPages[0], message];
          return { ...oldData, pages: newPages };
        }
      );
      queryClient.setQueryData(["chats"], (chats: Chat[]) => {
        const updatedChats = chats.map((c) =>
          c._id === selectedChat!._id ? { ...c, last_message: message } : c
        );
        return updatedChats;
      });
    };

    const handleNewSeen = (data: { message_id: string; userId: string; seen_at: string }) => {
      queryClient.setQueryData(
        ["chat-messages", selectedChatId],
        (oldData: InfiniteData<Message[]> | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.map((m) => {
                if (m._id !== data.message_id) return m;
                const alreadySeen = m.seen.some((s) => s.user_id === data.userId);
                if (alreadySeen) return m;
                return {
                  ...m,
                  seen: [...m.seen, { participant_id: data.userId, viewed_at: data.seen_at }],
                };
              })
            ),
          };
        }
      );
    };

    const handleTypingStart = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => [...new Set([...prev, userId])]);
    };

    const handleTypingStop = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    };

    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("message:new", handleNewMessage);
    socket.on("message:new_seen", handleNewSeen);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:new_seen", handleNewSeen);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, [queryClient, selectedChatId, selectedChat]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 px-5 py-4">
        <MessageSkeleton type="left" />
        <MessageSkeleton type="right" />
        <MessageSkeleton type="right" />
        <MessageSkeleton type="left" />
        <MessageSkeleton type="right" />
      </div>
    );
  }

  const firstUnreadIndex =
    initialUnreadCount > 0 ? Math.max(0, messages.length - initialUnreadCount) : -1;

  return (
    <div
      ref={scrollContainerRef}
      className="overflow-y-auto gap-3 min-h-0 flex-1 px-5 hide-scrollbar"
    >
      <div ref={topSentinelRef} />
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <span className="text-xs text-slate-400">Loading older messages...</span>
        </div>
      )}
      {messages.map((message, index) => {
        const showDateSeparator =
          index === 0 ||
          !isSameDay(new Date(message.createdAt), new Date(messages[index - 1].createdAt));

        return (
          <Fragment key={message._id}>
            {showDateSeparator && (
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-600/60" />
                <span className="text-xs text-slate-400 px-3 py-1 rounded-full bg-slate-800/60 whitespace-nowrap">
                  {formatDateSeparator(message.createdAt)}
                </span>
                <div className="flex-1 h-px bg-slate-600/60" />
              </div>
            )}
            {index === firstUnreadIndex && (
              <div ref={separatorRef} className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-600/60" />
                <span className="text-xs text-slate-400 px-2 whitespace-nowrap">
                  {initialUnreadCount} unread {initialUnreadCount === 1 ? "message" : "messages"}
                </span>
                <div className="flex-1 h-px bg-slate-600/60" />
              </div>
            )}
            <ChatBubble
              isGroup={!!selectedChat?.is_group}
              message={message}
              userId={userId || ""}
              totalMembers={selectedChat?.participants.length || 0}
              handleMessageSeen={handleMessageSeen}
            />
          </Fragment>
        );
      })}

      {typingUsers.map((userId) => {
        const participant = selectedChat?.participants?.find((p) => p.user._id === userId);

        return (
          <div key={userId} className="flex items-center">
            <div className="flex items-start gap-2">
              {selectedChat?.is_group && (
                <div className="rounded-full">
                  {participant?.user.avatar_url ? (
                    <Image
                      src={participant.user.avatar_url}
                      width={30}
                      height={30}
                      className="rounded-full"
                      alt={participant.user.username}
                    />
                  ) : (
                    <User />
                  )}
                </div>
              )}
              <div className="text-white bg-neutral-800 rounded-lg px-3 py-2">
                {participant && (
                  <p className="text-xs text-slate-400">{`~ ${participant.user.username}`}</p>
                )}
                <TypingIndicator />
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} className="w-full h-1" />
    </div>
  );
};

export default MessageContainer;
