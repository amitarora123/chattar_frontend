'use client';

import { getMyChats } from '@/lib/actions/chat';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import { Input } from '../ui/input';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { Button } from '../ui/button';
import { useState } from 'react';

const ChatsSidebar = ({ className }: { className: string }) => {
  const { data: session } = useSession();
  const { token } = session || {};

  const { data: chats } = useQuery({
    queryKey: ['chats', session?.user.id],
    queryFn: async () => await getMyChats(token!),
    enabled: !!token,
  });

  const [activeTabs, setActiveTabs] = useState<'All' | 'Unread'>('All');

  console.log(activeTabs);

  return (
    <section className={clsx(className, 'border-r pt-3 px-5')}>
      <div className="flex w-full justify-between items-center">
        <Image src="/logo_3.svg" width={200} height={200} alt="logo" />
        <button className=" flex items-center flex-col gap-1">
          <div className="size-1 bg-white rounded-full" />
          <div className="size-1 rounded-full bg-white" />
          <div className="size-1 rounded-full bg-white" />
        </button>
      </div>

      <div className="my-3 relative">
        <Input
          type="text"
          className="rounded-full pl-10 focus-visible:border-ring-0 focus-visible:ring-0 "
          placeholder="Search or start a new chat"
        />
        <div className="absolute left-3  h-full flex items-center justify-center top-0">
          <Search className="size-4 " />
        </div>
      </div>
      <div className="flex gap-3 items-center">
        <Button
          variant="outline"
          className={`rounded-full ${activeTabs === 'All' ? 'bg-neutral-700!' : ''}`}
          onClick={() => setActiveTabs('All')}
        >
          All
        </Button>
        <Button
          variant="outline"
          className={clsx(
            'rounded-full',
            activeTabs === 'Unread' ? 'bg-neutral-700!' : '',
          )}
          onClick={() => setActiveTabs('Unread')}
        >
          Unread
        </Button>
      </div>
    </section>
  );
};

export default ChatsSidebar;
