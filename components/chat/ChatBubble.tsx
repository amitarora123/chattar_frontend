import { getMessageDateTimeStamp } from '@/lib/utils';
import { Message } from '@/types/Message.types';
import clsx from 'clsx';

interface ChatBubbleProps {
  message: Message;
  userId: string;
}

const ChatBubble = ({
  userId,
  message: { sender, content, createdAt },
}: ChatBubbleProps) => {
  return (
    <div
      className={clsx(
        'flex items-center',
        `${sender._id === userId ? 'justify-end' : 'justify-start'}`,
      )}
    >
      <div className=" text-white bg-neutral-800 rounded-lg px-3 py-2">
        {content}
        <p className="text-xs mr-2 text-slate-400">
          {getMessageDateTimeStamp(createdAt)}
        </p>
      </div>
    </div>
  );
};

export default ChatBubble;
