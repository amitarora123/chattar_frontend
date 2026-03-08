'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useSidebarStore } from '@/lib/store/sidebarStore';
import { useState } from 'react';
import { checkUsernameUniqueness } from '@/lib/actions/user';
import useDebounce from '@/hooks/useDebounce';
import { useSession } from 'next-auth/react';
import { createContacts } from '@/lib/actions/contacts';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import { AxiosError } from 'axios';

const NewContact = () => {
  const { data: session } = useSession();
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
    onError: (error) => {
      const axiosError = error as AxiosError;
      const { message } = axiosError?.response?.data as { message: string };
      toast.error(message);
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
    <div className="p-3  flex-1">
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
            className="w-full mt-1 bg-transparent border-b border-slate-600  focus:border-blue-400 outline-none py-2"
          />
        </div>

        {/* Username */}
        <div className="my-10">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="w-full mt-1 bg-transparent border-b border-slate-600  focus:border-blue-400 outline-none py-2"
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

export default NewContact;
