import { getMessageDateTimeStamp } from "@/lib/utils";
import { Message } from "@/types/message.types";
import clsx from "clsx";
import { User, Clock, CheckCheck, Check } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

interface ChatBubbleProps {
  message: Message;
  userId: string;
  isGroup?: boolean;
  totalMembers: number;
  handleMessageSeen: (message_id: string) => void;
}

const formatFileSize = (fileSize: number) => {
  const fileSizeInKb = fileSize / 1024;

  // Less than 1 MB -> show in KB
  if (fileSizeInKb < 1024) {
    return `${fileSizeInKb.toFixed(2)} KB`;
  }

  // 1 MB or more -> show in MB
  const fileSizeInMb = fileSizeInKb / 1024;
  return `${fileSizeInMb.toFixed(2)} MB`;
};

const ChatBubble = ({
  userId,
  isGroup,
  message: { _id, sender, content, createdAt, attachment, isPending, chat_id, seen },
  totalMembers,
  handleMessageSeen,
}: ChatBubbleProps) => {
  const isMyMessage = sender.user._id === userId;
  const bubbleRef = useRef<HTMLDivElement>(null);
  const hasFiredRef = useRef(false);

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

    return () => {
      observer.disconnect();
    };
  }, [_id, isMyMessage, seen, userId, handleMessageSeen]);

  return (
    <div
      ref={bubbleRef}
      className={clsx(
        "flex my-1.5 items-end gap-2.5",
        isMyMessage ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar — only for group, other people's messages */}
      {isGroup && !isMyMessage && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-[#1e2230] flex items-center justify-center">
          {sender.user.avatar_url ? (
            <Image
              src={sender.user.avatar_url}
              width={32}
              height={32}
              className="rounded-full object-cover"
              alt={sender.user.username}
            />
          ) : (
            <User className="w-4 h-4 text-white/40" />
          )}
        </div>
      )}

      {/* Bubble */}
      <div
        className={clsx(
          "relative max-w-[320px] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isMyMessage
            ? "bg-[#1c2033] text-white rounded-br-[4px]"
            : "bg-[#161b27] text-white/90 rounded-bl-[4px]",
          "border",
          isMyMessage ? "border-white/[0.06]" : "border-white/[0.04]"
        )}
      >
        {attachment && (
          <div>
            <p className="text-slate-400 text-xs text-end mb-2">
              {formatFileSize(attachment.file_size)}
            </p>
            <Image
              src={attachment.file_url}
              width={200}
              height={150}
              alt={attachment.file_url}
              className="w-40 h-40 object-contain"
            />
          </div>
        )}
        {/* Sender name (group, other people only) */}
        {isGroup && !isMyMessage && (
          <p className="text-[11px] font-medium text-slate-400 mb-1 tracking-wide">
            {sender.contactName || `~ ${sender.user.display_name || sender.user.username}`}
          </p>
        )}

        {/* Message text */}
        <p className="wrap-break-word whitespace-pre-wrap">{content}</p>

        {/* Timestamp */}
        <div
          className={clsx(
            "flex items-center gap-1 mt-1",
            isMyMessage ? "justify-end" : "justify-start"
          )}
        >
          <p
            className={clsx(
              "text-[10px] text-white/30 select-none",
              isMyMessage ? "text-right" : "text-left"
            )}
          >
            {getMessageDateTimeStamp(createdAt)}
          </p>
          {isMyMessage &&
            (isPending ? (
              <Clock className="size-2 text-slate-400" />
            ) : isMessageSeen ? (
              <CheckCheck className="size-3 text-blue-400" />
            ) : (
              <CheckCheck className="size-3 text-slate-400" />
            ))}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
