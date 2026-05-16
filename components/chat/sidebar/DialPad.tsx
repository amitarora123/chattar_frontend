import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { ArrowLeft, Search, User } from "lucide-react";
import { useSidebarStore } from "@/lib/store/sidebarStore";
import { useState } from "react";
import { searchUsers } from "@/lib/api/user.api";
import useDebounce from "@/hooks/useDebounce";
import { useChatStore } from "@/lib/store/chatStore";
import { createDirectChat } from "@/lib/api/chat.api";
import { Input } from "../../ui/input";
import { useAuth } from "@/lib/providers/AuthProvider";

const DialPad = () => {
  const { changeSidebar } = useSidebarStore();
  const { selectChat } = useChatStore();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data: users, isLoading } = useQuery({
    queryKey: ["dial-pad-users", debouncedSearch],
    queryFn: () => searchUsers({ username: debouncedSearch || undefined }),
  });

  const filteredUsers = users?.filter((u) => u.user._id !== user?._id);

  const { mutate: startChat } = useMutation({
    mutationFn: createDirectChat,
    onSuccess: (chat) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      selectChat(chat);
      changeSidebar("ChatList");
    },
  });

  return (
    <div className="p-3 flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex gap-3 items-center">
        <button
          className="rounded-full p-2 transition-colors cursor-pointer duration-200 hover:bg-neutral-800"
          onClick={() => changeSidebar("ChatList")}
        >
          <ArrowLeft size={20} />
        </button>
        <p>People</p>
      </div>

      {/* Search */}
      <div className="my-4 relative">
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-full pl-10 focus-visible:ring-0 py-5"
          placeholder="Search users"
        />
        <div className="absolute left-3 h-full flex items-center top-0">
          <Search className="size-4 text-muted-foreground" />
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        {isLoading ? (
          <p className="text-slate-400 text-sm text-center mt-6">Loading...</p>
        ) : filteredUsers?.length === 0 ? (
          <p className="text-slate-400 text-sm text-center mt-6">No users found</p>
        ) : (
          <ul>
            {filteredUsers?.map((u) => (
              <li
                key={u.user._id}
                onClick={() => startChat(u.user._id)}
                className="p-3 hover:bg-neutral-800 cursor-pointer rounded-lg mt-1 flex gap-4 transition-colors"
              >
                <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                  {u.user.avatar_url ? (
                    <Image
                      src={u.user.avatar_url}
                      width={40}
                      height={40}
                      alt={u.user.username}
                      className="rounded-full object-cover w-10 h-10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center">
                      <User className="size-5 text-neutral-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex items-center">
                  <span className="font-medium truncate">{u.user.username}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DialPad;
