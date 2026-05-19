import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ChatBubble from "./ChatBubble";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getChatMessages, searchMessages } from "@/lib/api/message.api";
import useDebounce from "@/lib/hooks/useDebounce";
import { useChatStore } from "@/lib/store/chatStore";
import { useTypingStore } from "@/lib/store/typingStore";
import { socket } from "@/lib/socket/socketClient";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSeen } from "@/types/message.types";
import { useAuth } from "@/lib/providers/AuthProvider";
import MessageSkeleton from "../skelton/MessageSkelton";
import { Chat } from "@/types/chat.types";
import { toast } from "sonner";

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

const EMPTY_TYPING: string[] = [];

interface MessageContainerProps {
  searchQuery?: string;
  activeMatchIdx?: number;
  onMatchCountChange?: (count: number) => void;
}

const MessageContainer = ({
  searchQuery = "",
  activeMatchIdx = 0,
  onMatchCountChange,
}: MessageContainerProps) => {
  const userId = useAuth().user?._id;
  const { selectedChat } = useChatStore();
  const selectedChatId = selectedChat?._id;

  const typingUsers = useTypingStore((s) => s.typingByChatId[selectedChatId ?? ""] ?? EMPTY_TYPING);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const separatorRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledInitialRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const prevPagesLengthRef = useRef(0);
  const pendingScrollToId = useRef<string | null>(null);

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
    pendingScrollToId.current = null;
    toast.dismiss("search-nav-load");
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
  const messages = useMemo(() => data?.pages.slice().reverse().flat() ?? [], [data?.pages]);

  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: searchResults } = useQuery({
    queryKey: ["message-search", selectedChatId, debouncedQuery],
    queryFn: () => searchMessages({ chat_id: selectedChatId!, q: debouncedQuery }),
    enabled: !!selectedChatId && debouncedQuery.trim().length >= 2,
    staleTime: 30_000,
  });

  const matchIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    // Use backend results once the debounced query has settled and results arrived
    if (searchResults !== undefined && debouncedQuery.trim().toLowerCase() === q) {
      return searchResults.map((m) => m._id);
    }
    // Fallback to local filter while the backend request is in-flight
    return messages
      .filter((m) => !m.is_deleted && m.content.toLowerCase().includes(q))
      .map((m) => m._id);
  }, [messages, searchQuery, searchResults, debouncedQuery]);

  const activeMatchId = matchIds[activeMatchIdx] ?? null;

  useEffect(() => {
    onMatchCountChange?.(matchIds.length);
  }, [matchIds.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const SEARCH_TOAST_ID = "search-nav-load";

  useEffect(() => {
    if (!activeMatchId || !scrollContainerRef.current) return;
    toast.dismiss(SEARCH_TOAST_ID);
    const el = scrollContainerRef.current.querySelector(`[data-message-id="${activeMatchId}"]`);
    if (el) {
      pendingScrollToId.current = null;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (hasNextPage && !isFetchingNextPage) {
      pendingScrollToId.current = activeMatchId;
      toast.loading("Loading message…", { id: SEARCH_TOAST_ID });
      prevScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
      fetchNextPage();
    }
  }, [activeMatchId]); // eslint-disable-line react-hooks/exhaustive-deps

  // After each page loads, check if the pending scroll target is now in the DOM
  useEffect(() => {
    const id = pendingScrollToId.current;
    if (!id || isFetchingNextPage || !scrollContainerRef.current) return;
    const el = scrollContainerRef.current.querySelector(`[data-message-id="${id}"]`);
    if (el) {
      pendingScrollToId.current = null;
      toast.dismiss(SEARCH_TOAST_ID);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (hasNextPage) {
      prevScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
      fetchNextPage();
    } else {
      pendingScrollToId.current = null;
      toast.dismiss(SEARCH_TOAST_ID);
    }
  }, [messages.length, isFetchingNextPage]); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if (typingUsers.length > 0) scrollToBottom();
  }, [typingUsers.length]);

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
                    ? { ...c.last_message, seen: [...c.last_message.seen, data] }
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
      className="overflow-y-auto gap-3 min-h-0 flex flex-col flex-1 px-5 hide-scrollbar"
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
              searchQuery={searchQuery}
              isActiveMatch={message._id === activeMatchId}
            />
          </Fragment>
        );
      })}

      {typingUsers.map((typingUserId) => {
        const participant = selectedChat?.participants?.find((p) => p.user._id === typingUserId);
        return (
          <ChatBubble
            key={typingUserId}
            isTyping
            isGroup={!!selectedChat?.is_group}
            senderName={participant?.user.username}
            senderAvatarUrl={participant?.user.avatar_url ?? undefined}
          />
        );
      })}
      <div ref={messagesEndRef} className="w-full h-1" />
    </div>
  );
};

export default MessageContainer;
