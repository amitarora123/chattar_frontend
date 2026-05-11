import { getMessageDateTimeStamp } from "@/lib/utils";
import { Message } from "@/types/message.types";
import clsx from "clsx";
import { User } from "lucide-react";
import Image from "next/image";

interface ChatBubbleProps {
  message: Message;
  userId: string;
  isGroup?: boolean;
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
  message: { sender, content, createdAt, attachment },
}: ChatBubbleProps) => {
  const isMyMessage = sender.user._id === userId;

  return (
    <div
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
        <p className="break-words whitespace-pre-wrap">{content}</p>

        {/* Timestamp */}
        <p
          className={clsx(
            "text-[10px] mt-1 text-white/30 select-none",
            isMyMessage ? "text-right" : "text-left"
          )}
        >
          {getMessageDateTimeStamp(createdAt)}
        </p>
      </div>
    </div>
  );
};

export default ChatBubble;
