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

const ChatBubble = ({
  userId,
  isGroup,
  message: { sender, content, createdAt },
}: ChatBubbleProps) => {
  const isMyMessage = sender.user._id === userId;

  return (
    <div
      className={clsx("flex my-3 items-center", `${isMyMessage ? "justify-end" : "justify-start"}`)}
    >
      <div className="flex items-start  gap-2">
        {isGroup && !isMyMessage ? (
          <div className="rounded-full">
            {sender.user.avatar_url ? (
              <Image
                src={sender.user.avatar_url}
                width={30}
                height={30}
                className="rounded-full"
                alt={sender.user.username}
              />
            ) : (
              <User />
            )}
          </div>
        ) : null}
        <div className=" text-white bg-neutral-800 rounded-lg px-3 py-2">
          {!isMyMessage && (
            <p className="text-xs text-slate-400">
              {sender.contactName || `~ ${sender.user.display_name || sender.user.username}`}
            </p>
          )}
          {content}
          <p className="text-xs mr-2 text-slate-400">{getMessageDateTimeStamp(createdAt)}</p>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
