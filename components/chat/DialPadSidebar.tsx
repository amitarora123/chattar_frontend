'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { ArrowLeft, User } from 'lucide-react';
import { useSidebarStore } from '@/lib/store/sidebarStore';
import clsx from 'clsx';
import { useChatStore } from '@/lib/store/chatStore';
import { useState } from 'react';
import { checkUsernameUniqueness, searchUsers } from '@/lib/actions/user';
import useDebounce from '@/hooks/useDebounce';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { createContacts } from '@/lib/actions/contacts';
import { toast } from 'sonner';
import { Button } from '../ui/button';

interface DialPadSidebarProps {
  className: string;
}

const DialPad = () => {
  const { changeSidebar } = useSidebarStore();
  const { setSelectedRecipientId } = useChatStore();

  const [username, setUsername] = useState('');

  const debouncedUsername = useDebounce(username, 500);

  const { data: users, isLoading: isChecking } = useQuery({
    queryKey: ['chats', debouncedUsername],
    queryFn: async () => await searchUsers({ username: debouncedUsername }),
    enabled: debouncedUsername.length > 3,
  });

  return (
    <>
      <div className="flex w-full justify-between items-center">
        <div className="flex gap-3 items-center">
          <button
            className="rounded-full p-2 transition-colors cursor-pointer duration-200 hover:bg-neutral-800"
            onClick={() => changeSidebar('NewChat')}
          >
            <ArrowLeft size={20} />
          </button>
          <p>Username</p>
        </div>
      </div>

      <div className="my-5">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="  outline-none border-b-2 font-semibold text-lg  border-blue-500 w-full"
        />
      </div>

      <div className="my-10">
        <p className="text-center text-slate-400 text-sm font-semibold">
          {username.length < 3
            ? 'Enter a Username to start a chat'
            : (!users || users.length === 0) && !isChecking
              ? 'No User Found With this username'
              : null}
        </p>
      </div>

      <ul>
        {users?.map((user) => {
          const avatar = user.user.avatar_url;
          const displayName = user.contactName || user.user.username;
          return (
            <li
              key={user.user._id}
              onClick={() => {
                setSelectedRecipientId(user.user._id);
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
                  <span className="font-medium truncate">{displayName}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
};

export const NewContact = ({ session }: { session: Session | null }) => {
  const token = session?.token;
  const { changeSidebar } = useSidebarStore();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');

  const debouncedUsername = useDebounce(username, 500);
  const queryClient = useQueryClient();

  const { data: isUsernameUnique, isFetching: checking } = useQuery({
    queryKey: ['check-username', debouncedUsername],
    queryFn: () => checkUsernameUniqueness(debouncedUsername),
    enabled: !!debouncedUsername && debouncedUsername.length >= 3,
    staleTime: 1000 * 60, // cache 1 min
  });

  const userExists = !isUsernameUnique;

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createContacts(token!, {
        name,
        username: debouncedUsername,
      }),
    onSuccess: () => {
      toast.success('Contact created');
      queryClient.invalidateQueries({
        queryKey: ['chats'],
      });
      queryClient.invalidateQueries({
        queryKey: ['contacts'],
      });
      setName('');
      setUsername('');
      changeSidebar('NewChat');
    },
  });

  /* ---------------- Submit ---------------- */

  const handleSubmit = () => {
    if (!token) {
      toast.error('Invalid token');
      return;
    }

    if (!userExists) {
      toast.error('Username does not exist');
      return;
    }

    if (!name.trim() || !username.trim()) {
      toast.error('All fields are required');
      return;
    }

    mutate();
  };

  const isDisabled =
    !name.trim() || !username.trim() || !userExists || isPending;

  /* ---------------- UI ---------------- */

  return (
    <div className="p-5 text-white bg-[#0f172a] min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          className="rounded-full p-2 hover:bg-blue-600/20 transition"
          onClick={() => changeSidebar('NewChat')}
        >
          <ArrowLeft size={20} />
        </button>
        <p className="text-lg font-semibold">New Contact</p>
      </div>

      <div>
        {/* Name */}
        <div className="my-10">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
            className="w-full mt-1 bg-transparent border-b border-blue-700 focus:border-blue-400 outline-none py-2"
          />
        </div>

        {/* Username */}
        <div className="my-10">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="w-full mt-1 bg-transparent border-b border-blue-700 focus:border-blue-400 outline-none py-2"
          />
        </div>

        {/* Status */}
        <div className="h-6 text-sm">
          {checking && <p className="text-blue-400">Checking username...</p>}

          {!checking && debouncedUsername && !userExists && (
            <p className="text-red-500">User is not on Chattar </p>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isDisabled}
          variant="default"
          className="w-full mt-6 bg-blue-900! hover:bg-blue-700  "
        >
          {isPending ? 'Saving...' : 'Save Contact'}
        </Button>
      </div>
    </div>
  );
};

const DialPadSidebar = ({ className }: DialPadSidebarProps) => {
  const { data: session } = useSession();
  const { sidebar } = useSidebarStore();
  return (
    <section
      className={clsx(
        'border-r transition-transform bg-background  duration-300 ease-in-out pt-3 px-3 lg:col-span-1 max-lg:h-screen',
        className,
      )}
    >
      {sidebar === 'NewContact' ? (
        <NewContact session={session} />
      ) : (
        <DialPad />
      )}
    </section>
  );
};

export default DialPadSidebar;
