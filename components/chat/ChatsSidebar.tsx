'use client';

import { getMyChats } from '@/lib/actions/chat';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import { Input } from '../ui/input';
import Image from 'next/image';
import { Search, User } from 'lucide-react';
import { Button } from '../ui/button';
import { useState } from 'react';
import { getMessageDateTimeStamp } from '@/lib/utils';
import { Chat } from '@/types/chat.types';

interface ChatSidebarProps {
  className: string;
  setSelectedChat: (chat: Chat) => void;
}

const ChatsSidebar = ({ className, setSelectedChat }: ChatSidebarProps) => {
  const { data: session } = useSession();
  const { token } = session || {};

  const { data: chats } = useQuery({
    queryKey: ['chats', session?.user.id],
    queryFn: async () => await getMyChats(token!),
    enabled: !!token,
  });

  const [activeTabs, setActiveTabs] = useState<'All' | 'Unread'>('All');

  return (
    <section className={clsx(className, 'border-r pt-3 px-3')}>
      {/* Logo */}
      <div className="flex w-full justify-between items-center">
        <Image src="/logo_3.svg" width={150} height={150} alt="logo" />
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
            'rounded-full',
            activeTabs === 'All' && 'bg-neutral-700',
          )}
          onClick={() => setActiveTabs('All')}
        >
          All
        </Button>

        <Button
          variant="outline"
          className={clsx(
            'rounded-full',
            activeTabs === 'Unread' && 'bg-neutral-700',
          )}
          onClick={() => setActiveTabs('Unread')}
        >
          Unread
        </Button>
      </div>

      {/* Chat List */}
      <ul>
        {chats?.map((chat) => (
          <li
            key={chat._id}
            onClick={() => setSelectedChat(chat)}
            className="p-3 hover:bg-neutral-800 cursor-pointer rounded-lg mt-2 flex gap-4 transition-colors"
          >
            {/* Avatar */}
            <div className="w-10 h-10 shrink-0 flex items-center justify-center ">
              {chat.avatar ? (
                <Image
                  src={chat.avatar}
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
            </div>

            {/* Chat Content */}
            <div className="flex-1 min-w-0">
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <span className="font-medium truncate">{chat.name}</span>

                {chat.last_message?.createdAt && (
                  <span className="text-xs whitespace-nowrap ml-2 text-neutral-400">
                    {getMessageDateTimeStamp(chat.last_message.createdAt)}
                  </span>
                )}
              </div>

              {/* Last Message */}
              {chat.last_message && (
                <p className="truncate text-sm text-neutral-400 mt-1">
                  {chat.isGroup &&
                    (chat.last_message.sender?._id === session?.user.id
                      ? 'me: '
                      : chat.last_message.sender?.username + ' :')}
                  {chat.last_message.content}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ChatsSidebar;
