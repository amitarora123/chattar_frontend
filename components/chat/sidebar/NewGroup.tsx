import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { ArrowLeft, User } from 'lucide-react';
import { useSidebarStore } from '@/lib/store/sidebarStore';
import { useSession } from 'next-auth/react';
import { getMyContacts } from '@/lib/actions/contacts';

const NewGroup = () => {
  const { data: session } = useSession();
  const { token } = session || {};
  const { changeSidebar } = useSidebarStore();

  const { data: contacts } = useQuery({
    queryKey: ['contacts', session?.user.id],
    queryFn: async () => await getMyContacts(token!),
    enabled: !!token,
  });
  return (
    <>
      {' '}
      {/* Logo */}
      <div className="flex w-full justify-between items-center">
        <div className="flex gap-3 items-center">
          <button
            className="rounded-full p-2 transition-colors cursor-pointer duration-200 hover:bg-neutral-800"
            onClick={() => changeSidebar('NewChat')}
          >
            <ArrowLeft size={20} />
          </button>
          <p>New Group</p>
        </div>
      </div>
      <ul>
        {contacts?.map((contact) => (
          <li
            onClick={() => {}}
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
    </>
  );
};

export default NewGroup;
