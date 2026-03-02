import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, User } from 'lucide-react';
import { useSidebarStore } from '@/lib/store/sidebarStore';
import { useSession } from 'next-auth/react';
import { getMyContacts } from '@/lib/actions/contacts';
import { useGroupStore } from '@/lib/store/groupStore';

const AddGroupMembers = () => {
  const { data: session } = useSession();
  const { token } = session || {};
  const { changeSidebar } = useSidebarStore();
  const { userIds, selectUserId, unSelectUserId, setUserIds } = useGroupStore();

  const { data: contacts } = useQuery({
    queryKey: ['contacts', session?.user.id],
    queryFn: async () => await getMyContacts(token!),
    enabled: !!token,
  });

  const filteredContacts = contacts?.filter(
    (c) => !userIds.includes(c.user._id),
  );

  return (
    <>
      {' '}
      {/* Logo */}
      <div className="flex w-full relative justify-between items-center">
        <div className="flex gap-3 items-center">
          <button
            className="rounded-full p-2 transition-colors cursor-pointer duration-200 hover:bg-neutral-800"
            onClick={() => {
              setUserIds([])
              changeSidebar('NewChat')
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <p>Add Group Members</p>
        </div>
      </div>
      {/* Selected Members */}
      {userIds.length > 0 && (
        <div className="flex gap-3 flex-wrap p-4  ">
          {contacts
            ?.filter((contact) => userIds.includes(contact.user._id))
            .map((contact) => (
              <div
                key={contact.user._id}
                className="flex items-center gap-2  px-3 py-2 rounded-full shrink-0"
              >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-700 flex items-center justify-center">
                  {contact.user.avatar_url ? (
                    <Image
                      src={contact.user.avatar_url}
                      width={28}
                      height={28}
                      alt=""
                      className="object-cover"
                    />
                  ) : (
                    <User className="size-4 text-neutral-300" />
                  )}
                </div>

                {/* Name */}
                <span className="text-sm max-w-25 truncate">
                  {contact.name || contact.user.username}
                </span>

                {/* Remove */}
                <button
                  onClick={() => unSelectUserId(contact.user._id)}
                  className="text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            ))}
        </div>
      )}
      <div className="w-full px-4">
        <input
          type="text"
          className="border-b outline-none ring-0 focus-visible:ring-0 focus-visible:outline-none border-neutral-800 w-full"
        />
      </div>
      <ul className="overflow-y-auto">
        {filteredContacts?.map((contact) => {
          const isSelected = userIds.find(
            (userId) => userId === contact.user._id,
          );

          return (
            <li
              key={contact._id}
              onClick={() => {
                if (isSelected) {
                  unSelectUserId(contact.user._id);
                } else {
                  selectUserId(contact.user._id);
                }
              }}
              className="p-3 cursor-pointer rounded-lg mt-2 flex gap-4 hover:bg-neutral-800 transition-colors relative"
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
          );
        })}
      </ul>
      <div className="absolute bottom-0 h-40 flex items-center justify-center w-full">
        <button
          onClick={() => changeSidebar('NewGroup')}
          className=" cursor-pointer text-black  bg-blue-700 rounded-full p-2 hover:scale-125 transition-transform duration-150 ease"
        >
          <ArrowRight size={25} />
        </button>
      </div>
    </>
  );
};

export default AddGroupMembers;
