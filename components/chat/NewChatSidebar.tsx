'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Input } from '../ui/input';
import Image from 'next/image';
import { ArrowLeft, Grip, Search, User } from 'lucide-react';
import { useSidebarStore } from '@/lib/store/sidebarStore';
import { getMyContacts } from '@/lib/actions/contacts';
import clsx from 'clsx';
import { useChatStore } from '@/lib/store/chatStore';
import { UsersRound, UserPlus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface NewChatSidebarProps {
  className: string;
}

const NewChatSidebar = ({ className }: NewChatSidebarProps) => {
  const { changeSidebar } = useSidebarStore();
  const { setSelectedRecipientId } = useChatStore();

  const { data: session } = useSession();
  const { token } = session || {};

  const { data: contacts } = useQuery({
    queryKey: ['contacts', session?.user.id],
    queryFn: async () => await getMyContacts(token!),
    enabled: !!token,
  });

  return (
    <section
      className={clsx(
        'border-r transition-transform bg-background  duration-300 ease-in-out pt-3 px-3 lg:col-span-1 max-lg:h-screen',
        className,
      )}
    >
      {/* Logo */}
      <div className="flex w-full justify-between items-center">
        <div className="flex gap-3 items-center">
          <button
            className="rounded-full p-2 transition-colors cursor-pointer duration-200 hover:bg-neutral-800"
            onClick={() => changeSidebar(null)}
          >
            <ArrowLeft size={20} />
          </button>
          <p>New Chat</p>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => changeSidebar('DialPad')}
              className="rounded-full p-2 transition-colors cursor-pointer duration-200 hover:bg-neutral-800"
            >
              <Grip />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Phone Number</p>
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
      {/* Quick Actions */}
      <div className="mb-3 space-y-1">
        {/* New Group */}
        <button
          onClick={() => {
            // TODO: open create group flow
            console.log('Create new group');
          }}
          className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center">
            <UsersRound size={20} className="text-white" />
          </div>
          <span className="font-medium">New group</span>
        </button>

        {/* New Contact */}
        <button
          onClick={() => {
            changeSidebar('NewContact');
          }}
          className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center">
            <UserPlus size={20} className="text-white" />
          </div>
          <span className="font-medium">New contact</span>
        </button>
      </div>
      {/* contact List */}
      <div className="px-3">
        <p className="text-slate-300 font-semibold text-sm">
          Contacts on Chattar
        </p>
      </div>{' '}
      <ul>
        {contacts?.map((contact) => (
          <li
            onClick={() => setSelectedRecipientId(contact.user._id)}
            key={contact._id}
            className="p-3 hover:bg-neutral-800 cursor-pointer rounded-lg mt-2 flex gap-4 transition-colors"
          >
            {/* Avatar */}
            <div className="w-10 h-10 shrink-0 flex items-center justify-center ">
              {contact.user.avatar_url ? (
                <Image
                  src={contact.user.avatar_url}
                  width={60}
                  height={60}
                  alt={contact.name ?? contact.user.username}
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
                  {contact.name || contact.user.username}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default NewChatSidebar;
