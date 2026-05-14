import { getMessageDateTimeStamp } from "@/lib/utils";
import { Message } from "@/types/message.types";
import clsx from "clsx";
import { User, Clock, CheckCheck, X } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef } from "react";

const PdfPreview = dynamic(() => import("./PdfPreview"));

interface ChatBubbleProps {
  message: Message;
  userId: string;
  isGroup?: boolean;
  totalMembers: number;
  handleMessageSeen: (message_id: string) => void;
}

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

const Ticks = ({ isMyMessage, isPending, isMessageSeen }: TicksProps) => {
  if (!isMyMessage) return null;
  if (isPending) return <Clock className="size-3 text-slate-400 shrink-0" />;
  if (isMessageSeen) return <CheckCheck className="size-3 text-blue-400 shrink-0" />;
  return <CheckCheck className="size-3 text-slate-400 shrink-0" />;
};

const ChatBubble = ({
  userId,
  isGroup,
  message: { _id, sender, content, createdAt, attachment, isPending, seen },
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

  const senderName = sender.contactName || sender.user.display_name || sender.user.username;

  return (
    <div
      ref={bubbleRef}
      className={clsx(
        "flex my-1.5 items-end gap-2.5",
        isMyMessage ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar — group, received only */}
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
          "relative max-w-[320px] text-sm overflow-hidden",
          "rounded-2xl border",
          isMyMessage
            ? "bg-[#1c2033] text-white rounded-br-lg border-white/6"
            : "bg-[#161b27] text-white/90 rounded-bl-lg border-white/4"
        )}
      >
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
                alt={attachment.file_name}
                className="w-full max-w-75 object-cover block"
              />
            )}

            {/* Upload spinner overlay — ring around X in primary blue */}
            {isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-400/20 border-t-blue-400 animate-spin" />
                  <X className="size-4 text-white/80" />
                </div>
              </div>
            )}

            {/* Timestamp overlay when image-only and fully sent */}
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
            {/* Group sender name */}
            {isGroup && !isMyMessage && (
              <div className="px-3 pt-2.5 pb-0">
                <p className="text-[11px] font-semibold text-slate-400">{senderName}</p>
              </div>
            )}

            {/* PDF first-page preview — blob URLs work too, so show immediately */}
            {isPdf && (
              <div className="overflow-hidden bg-white" style={{ height: "150px" }}>
                <PdfPreview url={attachment.file_url} />
              </div>
            )}

            {/* File metadata row */}
            <div className="flex items-center gap-3 px-3 py-3">
              <div
                className={clsx(
                  "text-white text-[10px] font-bold px-1.5 py-1 rounded flex-shrink-0",
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
              {/* Timestamp / upload spinner — right of filename, no caption */}
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

            {/* Open / Save as buttons — hidden while uploading */}
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

        {/* Text content with inline timestamp */}
        {content && (
          <div className="relative px-3.5 py-2.5">
            {/* Sender name for text-only group messages */}
            {isGroup && !isMyMessage && !isDocument && (
              <p className="text-[11px] font-medium text-slate-400 mb-1 tracking-wide">
                {senderName}
              </p>
            )}
            <p className="wrap-break-word whitespace-pre-wrap leading-relaxed">
              {content}
              {/* Invisible spacer prevents text overlapping the timestamp */}
              <span
                className="inline-block select-none pointer-events-none"
                style={{ width: isMyMessage ? "70px" : "50px" }}
                aria-hidden
              />
            </p>
            <div className="absolute bottom-2.5 right-3.5 flex items-center gap-1">
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
    </div>
  );
};

export default ChatBubble;
