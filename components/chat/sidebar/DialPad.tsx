import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { ArrowLeft, User } from "lucide-react";
import { useSidebarStore } from "@/lib/store/sidebarStore";
import { useState } from "react";
import { searchUsers } from "@/lib/api/user.api";
import useDebounce from "@/hooks/useDebounce";
import { useChatStore } from "@/lib/store/chatStore";
import { createDirectChat } from "@/lib/api/chat.api";

const DialPad = () => {
  const { changeSidebar } = useSidebarStore();
  const { selectChat } = useChatStore();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState("");

  const debouncedUsername = useDebounce(username, 500);

  const { data: users, isLoading: isChecking } = useQuery({
    queryKey: ["chats", debouncedUsername],
    queryFn: async () => await searchUsers({ username: debouncedUsername }),
    enabled: debouncedUsername.length > 3,
  });

  const { mutate: startChat } = useMutation({
    mutationFn: createDirectChat,
    onSuccess: (chat) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      selectChat(chat);
      changeSidebar("ChatList");
    },
  });

  return (
    <div className="p-3">
      <div className="flex w-full justify-between items-center">
        <div className="flex gap-3 items-center">
          <button
            className="rounded-full p-2 transition-colors cursor-pointer duration-200 hover:bg-neutral-800"
            onClick={() => changeSidebar("NewChat")}
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
            ? "Enter a Username to start a chat"
            : (!users || users.length === 0) && !isChecking
              ? "No User Found With this username"
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
                startChat(user.user._id);
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
    </div>
  );
};

export default DialPad;
