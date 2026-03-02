'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import { useGroupStore } from '@/lib/store/groupStore';
import { useSidebarStore } from '@/lib/store/sidebarStore';
import { createGroup } from '@/lib/actions/chat';
import { ArrowLeft, Camera, Users } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';

const NewGroup = () => {
  const { changeSidebar } = useSidebarStore();
  const { userIds } = useGroupStore();
  const { data: session } = useSession();
  const token = session?.token;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async () =>
      createGroup(token!, {
        memberIds: userIds,
        adminIds: [],
        name,
        description,
        // avatar_url: avatarPreview || undefined,
      }),
    onSuccess: (data) => {
      toast.success(data.message || 'Group Created Successfully');
      changeSidebar('AllChats'); // go back to chats
    },
    onError: (error) => {
      console.log(error);
      const { message } = (error as AxiosError).response?.data as {
        message: string;
      };
      toast.error(message);
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => changeSidebar('AddGroupMembers')}
          className="p-2 rounded-full hover:bg-neutral-800"
        >
          <ArrowLeft size={20} />
        </button>
        <p className="text-lg font-medium">New Group</p>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center px-6 mt-6 gap-6">
        {/* Avatar Upload */}
        <label className="relative cursor-pointer">
          <div className="w-28 h-28 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Group Avatar"
                fill
                className="object-cover rounded-full"
              />
            ) : (
              <Users size={50} className="text-blue-200" />
              //   <span className="text-sm text-neutral-400">Add group icon</span>
            )}
          </div>
          <Camera className="absolute bottom-2 right-1 text-blue-200" />
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
        </label>

        {/* Group Name */}
        <div className="w-full relative">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="w-full bg-transparent border-b border-slate-600 outline-none py-2 pr-8"
          />
          {/* <Smile
            size={20}
            className="absolute right-0 top-2 text-neutral-400"
          /> */}
        </div>

        {/* Description */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Group description (optional)"
          className="w-full border-b border-b-slate-600   outline-none resize-none"
        />

        {/* Create Button */}
        <Button
          className="w-full mt-5 rounded-none"
          disabled={!name || isPending}
          onClick={() => mutate()}
        >
          {isPending ? 'Creating...' : 'Create Group'}
        </Button>
      </div>
    </div>
  );
};

export default NewGroup;
