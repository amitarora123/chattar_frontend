import { getMessageDateTimeStamp } from "@/lib/utils";
import { Message, ReplyMessage } from "@/types/message.types";
import { useChatInputStore } from "@/lib/store/chatInputStore";
import clsx from "clsx";
import { User, Clock, CheckCheck, CornerUpLeft, Pencil, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { socket } from "@/lib/socket/socketClient";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { useChatStore } from "@/lib/store/chatStore";
import { Chat } from "@/types/chat.types";

const PdfPreview = dynamic(() => import("./PdfPreview"));

interface ChatBubbleInnerProps {
  message: Message;
  userId: string;
  isGroup?: boolean;
  totalMembers: number;
  handleMessageSeen: (message_id: string) => void;
  searchQuery?: string;
  isActiveMatch?: boolean;
}

const HighlightText = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  const lower = text.toLowerCase();
  const lowerQ = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let last = 0;
  let i = lower.indexOf(lowerQ, last);
  while (i !== -1) {
    if (i > last) parts.push(text.slice(last, i));
    parts.push(
      <mark key={i} className="bg-yellow-400/50 text-white not-italic rounded-sm">
        {text.slice(i, i + query.length)}
      </mark>
    );
    last = i + query.length;
    i = lower.indexOf(lowerQ, last);
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
};

type ChatBubbleProps =
  | (ChatBubbleInnerProps & { isTyping?: false })
  | { isTyping: true; isGroup?: boolean; senderName?: string; senderAvatarUrl?: string };

const formatFileSize = (bytes: number) => {
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} kB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const getDocMeta = (fileType: string) => {
  if (fileType === "application/pdf") return { badge: "PDF", badgeColor: "bg-red-500" };
  if (fileType.includes("word") || fileType.includes("wordprocessingml"))
    return { badge: "DOCX", badgeColor: "bg-blue-600" };
  return { badge: "FILE", badgeColor: "bg-slate-500" };
};

interface TicksProps {
  isMyMessage: boolean;
  isPending: boolean;
  isMessageSeen: boolean;
}

export const Ticks = ({ isMyMessage, isPending, isMessageSeen }: TicksProps) => {
  if (!isMyMessage) return null;
  if (isPending) return <Clock className="size-3 text-slate-400 shrink-0" />;
  if (isMessageSeen) return <CheckCheck className="size-3 text-blue-400 shrink-0" />;
  return <CheckCheck className="size-3 text-slate-400 shrink-0" />;
};

const ReplyBlock = ({
  reply_to,
  isMyMessage,
}: {
  reply_to: ReplyMessage;
  isMyMessage: boolean;
}) => {
  const preview = reply_to.is_deleted
    ? "This message was deleted"
    : reply_to.content || reply_to.attachment?.file_name || "";
  const senderName = reply_to.sender.username;

  return (
    <div
      className={clsx(
        "flex flex-col px-3 pt-2.5 pb-1.5 border-l-2 rounded-t-xl rounded-b-none mx-0 text-xs",
        isMyMessage
          ? "border-blue-400 bg-white/5 text-white/60"
          : "border-slate-400 bg-white/5 text-white/60"
      )}
    >
      <span className="font-semibold text-white/80 truncate">{senderName}</span>
      <span className="truncate mt-0.5">{preview}</span>
    </div>
  );
};

const ChatBubbleInner = ({
  userId,
  isGroup,
  message,
  totalMembers,
  handleMessageSeen,
  searchQuery = "",
  isActiveMatch = false,
}: ChatBubbleInnerProps) => {
  const {
    _id,
    sender,
    content,
    createdAt,
    attachment,
    isPending,
    seen,
    is_edited,
    is_deleted,
    reply_to,
  } = message;
  const isMyMessage = sender._id === userId;
  const bubbleRef = useRef<HTMLDivElement>(null);
  const hasFiredRef = useRef(false);

  const { setReplyingTo, setEditingMessage } = useChatInputStore();
  const queryClient = useQueryClient();
  const selectedChat = useChatStore((s) => s.selectedChat);

  const isMessageSeen = seen.filter((s) => s.user_id !== userId).length === totalMembers - 1;

  useEffect(() => {
    if (!userId || isMyMessage) return;
    if (hasFiredRef.current) return;
    if (seen.some((s) => s.user_id === userId)) {
      hasFiredRef.current = true;
      return;
    }

    const element = bubbleRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasFiredRef.current) {
          hasFiredRef.current = true;
          handleMessageSeen(_id);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [_id, isMyMessage, seen, userId, handleMessageSeen]);

  const handleDelete = () => {
    if (!selectedChat) return;
    const room = `chat:${selectedChat._id}`;

    // Optimistic update
    queryClient.setQueryData(
      ["chat-messages", selectedChat._id],
      (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((m) =>
              m._id === _id ? { ...m, is_deleted: true, content: "", attachment: undefined } : m
            )
          ),
        };
      }
    );

    queryClient.setQueryData(["chats"], (old: Chat[] | undefined) => {
      if (!old) return old;

      return old.map((o) =>
        o._id !== selectedChat._id
          ? o
          : o.last_message?._id === _id
            ? { ...o, last_message: { ...o.last_message, is_deleted: true, content: "" } }
            : o.last_message
      );
    });

    socket.emit("message:delete", { room, message_id: _id }, ({ error }: { error?: string }) => {
      if (error) {
        // Rollback on failure
        queryClient.setQueryData(
          ["chat-messages", selectedChat._id],
          (old: InfiniteData<Message[]> | undefined) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => page.map((m) => (m._id === _id ? message : m))),
            };
          }
        );
      }
    });
  };

  const isImage = attachment?.file_type.startsWith("image/");
  const isDocument = attachment && !isImage;
  const isPdf = attachment?.file_type === "application/pdf";
  const docMeta = attachment ? getDocMeta(attachment.file_type) : null;
  const timestamp = getMessageDateTimeStamp(createdAt);

  const handleOpen = () => {
    if (attachment) window.open(attachment.file_url, "_blank");
  };

  const handleSaveAs = () => {
    if (!attachment) return;
    const a = document.createElement("a");
    a.href = attachment.file_url;
    a.download = attachment.file_name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const senderName = sender.username;
  const isMatch = !!searchQuery.trim() && content.toLowerCase().includes(searchQuery.toLowerCase());

  // Deleted message — render a minimal tombstone
  if (is_deleted) {
    return (
      <div
        ref={bubbleRef}
        data-message-id={_id}
        className={clsx(
          "flex my-1.5 items-end gap-2.5",
          isMyMessage ? "flex-row-reverse" : "flex-row"
        )}
      >
        {isGroup && !isMyMessage && (
          <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden bg-[#1e2230] flex items-center justify-center">
            {sender.avatar_url ? (
              <Image
                src={sender.avatar_url}
                width={32}
                height={32}
                className="rounded-full object-cover"
                alt={sender.username}
              />
            ) : (
              <User className="w-4 h-4 text-white/40" />
            )}
          </div>
        )}
        <div
          className={clsx(
            "px-4 py-2 rounded-2xl border text-sm italic text-white/30 border-white/6",
            isMyMessage ? "rounded-br-lg bg-[#1c2033]" : "rounded-bl-lg bg-[#161b27]"
          )}
        >
          This message was deleted
        </div>
      </div>
    );
  }

  const canEdit = isMyMessage && !attachment && !isPending;

  return (
    <div
      ref={bubbleRef}
      data-message-id={_id}
      className={clsx(
        "flex my-1.5 items-end gap-1.5 group",
        isMyMessage ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar — group received only */}
      {isGroup && !isMyMessage && (
        <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden bg-[#1e2230] flex items-center justify-center">
          {sender.avatar_url ? (
            <Image
              src={sender.avatar_url}
              width={32}
              height={32}
              className="rounded-full object-cover"
              alt={sender.username}
            />
          ) : (
            <User className="w-4 h-4 text-white/40" />
          )}
        </div>
      )}

      {/* Bubble */}
      <div
        className={clsx(
          "relative max-w-[320px] text-sm overflow-hidden",
          "rounded-2xl border",
          isMyMessage
            ? "bg-[#1c2033] text-white rounded-br-lg border-white/6"
            : "bg-[#161b27] text-white/90 rounded-bl-lg border-white/4",
          isActiveMatch && "ring-2 ring-yellow-400/70",
          isMatch && !isActiveMatch && "ring-1 ring-yellow-400/30"
        )}
      >
        {/* Reply block */}
        {reply_to && <ReplyBlock reply_to={reply_to} isMyMessage={isMyMessage} />}

        {/* Image attachment */}
        {isImage && attachment && (
          <div className="relative">
            {attachment.file_url.startsWith("blob:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={attachment.file_url}
                alt={attachment.file_name}
                className={clsx("w-full max-w-75 object-cover block", isPending && "opacity-60")}
              />
            ) : (
              <Image
                src={attachment.file_url}
                width={300}
                height={220}
                alt={attachment.file_name || attachment.file_url}
                className="w-full max-w-75 object-cover block"
              />
            )}
            {isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-400/20 border-t-blue-400 animate-spin" />
                </div>
              </div>
            )}
            {!content && !isPending && (
              <div className="absolute bottom-1.5 right-2 flex items-center gap-1 bg-black/50 rounded px-1.5 py-0.5">
                <span className="text-[11px] text-white/80 select-none">{timestamp}</span>
                <Ticks
                  isMyMessage={isMyMessage}
                  isPending={!!isPending}
                  isMessageSeen={isMessageSeen}
                />
              </div>
            )}
          </div>
        )}

        {/* Document attachment */}
        {isDocument && attachment && docMeta && (
          <>
            {isGroup && !isMyMessage && (
              <div className="px-3 pt-2.5 pb-0">
                <p className="text-[11px] font-semibold text-slate-400">{senderName}</p>
              </div>
            )}
            {isPdf && (
              <div className="overflow-hidden bg-white" style={{ height: "150px" }}>
                <PdfPreview url={attachment.file_url} />
              </div>
            )}
            <div className="flex items-center gap-3 px-3 py-3">
              <div
                className={clsx(
                  "text-white text-[10px] font-bold px-1.5 py-1 rounded shrink-0",
                  docMeta.badgeColor
                )}
              >
                {docMeta.badge}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm text-white font-medium truncate max-w-45">
                  {attachment.file_name}
                </span>
                <span className="text-xs text-white/40">
                  {docMeta.badge} • {formatFileSize(attachment.file_size)}
                </span>
              </div>
              {!content && (
                <div className="shrink-0 flex items-center gap-0.5">
                  {isPending ? (
                    <div className="w-4 h-4 rounded-full border-2 border-blue-400/20 border-t-blue-400 animate-spin" />
                  ) : (
                    <>
                      <span className="text-[11px] text-white/30 select-none">{timestamp}</span>
                      <Ticks
                        isMyMessage={isMyMessage}
                        isPending={!!isPending}
                        isMessageSeen={isMessageSeen}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
            {!isPending && (
              <div className="flex border-t border-white/6">
                <button
                  onClick={handleOpen}
                  className="flex-1 py-2.5 text-[13px] font-medium text-blue-400 hover:bg-white/5 transition-colors"
                >
                  Open
                </button>
                <div className="w-px my-1.5 bg-white/6" />
                <button
                  onClick={handleSaveAs}
                  className="flex-1 py-2.5 text-[13px] font-medium text-blue-400 hover:bg-white/5 transition-colors"
                >
                  Save as...
                </button>
              </div>
            )}
          </>
        )}

        {/* Text content */}
        {content && (
          <div className="relative px-3.5 py-2.5">
            {isGroup && !isMyMessage && !isDocument && (
              <p className="text-[11px] font-medium text-slate-400 mb-1 tracking-wide">
                {senderName}
              </p>
            )}
            <p className="wrap-break-word whitespace-pre-wrap leading-relaxed">
              <HighlightText text={content} query={searchQuery} />
              <span
                className="inline-block select-none pointer-events-none"
                style={{
                  width: is_edited
                    ? isMyMessage
                      ? "105px"
                      : "88px"
                    : isMyMessage
                      ? "70px"
                      : "50px",
                }}
                aria-hidden
              />
            </p>
            <div className="absolute bottom-2.5 right-3.5 flex items-center gap-1">
              {is_edited && <span className="text-[10px] text-white/50 select-none">edited</span>}
              <span className="text-[10px] text-white/30 select-none">{timestamp}</span>
              <Ticks
                isMyMessage={isMyMessage}
                isPending={!!isPending}
                isMessageSeen={isMessageSeen}
              />
            </div>
          </div>
        )}
      </div>

      {/* Hover action buttons */}
      {!isPending && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 self-end pb-1.5">
          <button
            onClick={() => setReplyingTo(message)}
            title="Reply"
            className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
          >
            <CornerUpLeft className="size-3.5" />
          </button>
          {canEdit && (
            <button
              onClick={() => setEditingMessage(message)}
              title="Edit"
              className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
            >
              <Pencil className="size-3.5" />
            </button>
          )}
          {isMyMessage && (
            <button
              onClick={handleDelete}
              title="Delete"
              className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:red-400 transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const TypingBubble = ({
  isGroup,
  senderName,
  senderAvatarUrl,
}: {
  isGroup?: boolean;
  senderName?: string;
  senderAvatarUrl?: string;
}) => (
  <div className="flex my-1.5 items-end gap-1.5">
    {isGroup && (
      <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden bg-[#1e2230] flex items-center justify-center">
        {senderAvatarUrl ? (
          <Image
            src={senderAvatarUrl}
            width={32}
            height={32}
            className="rounded-full object-cover"
            alt={senderName ?? ""}
          />
        ) : (
          <User className="w-4 h-4 text-white/40" />
        )}
      </div>
    )}
    <div className="relative max-w-[320px] text-sm overflow-hidden rounded-2xl border bg-[#161b27] text-white/90 rounded-bl-lg border-white/4 px-3.5 py-2.5">
      {isGroup && senderName && (
        <p className="text-[11px] font-medium text-slate-400 mb-1 tracking-wide">{senderName}</p>
      )}
      <div className="flex items-center gap-1 py-0.5">
        <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
      </div>
    </div>
  </div>
);

const ChatBubble = (props: ChatBubbleProps) => {
  if (props.isTyping) {
    return (
      <TypingBubble
        isGroup={props.isGroup}
        senderName={props.senderName}
        senderAvatarUrl={props.senderAvatarUrl}
      />
    );
  }
  return <ChatBubbleInner {...props} />;
};

export default ChatBubble;
