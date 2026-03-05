import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { BatteryPlus, Search, User } from 'lucide-react';
import { useSidebarStore } from '@/lib/store/sidebarStore';
import clsx from 'clsx';
import { useChatStore } from '@/lib/store/chatStore';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { getMyChats } from '@/lib/actions/chat';
import { getMessageDateTimeStamp } from '@/lib/utils';
import MobileBottomNav from '@/components/ui/mobile-bottom-navbar';

const AllChats = () => {
  const { changeSidebar } = useSidebarStore();
  const { setSelectedRecipientId, setSelectedChatId } = useChatStore();

  const { data: session } = useSession();
  const { token } = session || {};

  const { data: chats } = useQuery({
    queryKey: ['chats', session?.user.id],
    queryFn: async () => await getMyChats(token!),
    enabled: !!token,
  });

  const [activeTabs, setActiveTabs] = useState<'All' | 'Unread'>('All');

  return (
    <>
      {/* Logo */}
      <div className="flex w-full justify-between items-center">
        <Image src="/logo_3.svg" width={150} height={150} alt="logo" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="rounded-full p-2 transition-colors cursor-pointer duration-200 hover:bg-neutral-800"
              onClick={() => changeSidebar('NewChat')}
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
      <ul className="overflow-y-auto  hide-scrollbar max-lg:h-107  pb-5">
        {chats?.map((chat) => {
          console.log(chat);
          const avatar = chat.is_group
            ? chat.groupMetaData?.avatar_url
            : chat.participants![0].user.avatar_url;
          const displayName = chat.groupMetaData
            ? chat.groupMetaData?.name
            : chat.participants![0].contactName ||
              chat.participants![0].user.username;
          return (
            <li
              key={chat._id}
              onClick={() => {
                if (chat.is_group) {
                  setSelectedRecipientId(null);
                  setSelectedChatId(chat._id);
                } else {
                  setSelectedChatId(null);
                  setSelectedRecipientId(
                    chat.participants ? chat.participants[0].user._id : null,
                  );
                }
              }}
              className="p-3 hover:bg-neutral-800 cursor-pointer rounded-lg mt-2 flex gap-4 transition-colors"
            >
              {/* Avatar */}
              <div className="w-10 h-10 shrink-0 flex items-center justify-center ">
                {avatar ? (
                  <Image
                    src={avatar}
                    width={60}
                    height={60}
                    alt={displayName}
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
                  <span className="font-medium truncate">
                    {chat.groupMetaData
                      ? chat.groupMetaData.name
                      : chat.participants![0].contactName ||
                        chat.participants![0].user.username}
                  </span>

                  {chat.last_message?.createdAt && (
                    <span className="text-xs whitespace-nowrap ml-2 text-neutral-400">
                      {getMessageDateTimeStamp(chat.last_message.createdAt)}
                    </span>
                  )}
                </div>

                {/* Last Message */}
                {chat.last_message && (
                  <p className="truncate text-sm text-neutral-400 mt-1">
                    {chat.is_group &&
                      (chat.last_message?.sender?.user._id === session?.user.id
                        ? 'me: '
                        : (chat.last_message?.sender?.contactName ||
                            chat.last_message?.sender.user.username) + ': ')}
                    {chat.last_message?.content}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <MobileBottomNav />
    </>
  );
};

export default AllChats;
