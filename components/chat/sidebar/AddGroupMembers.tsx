import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Search, User } from "lucide-react";
import { useSidebarStore } from "@/lib/store/sidebarStore";
import { useGroupStore } from "@/lib/store/groupStore";
import { searchUsers } from "@/lib/api/user.api";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useState } from "react";
import useDebounce from "@/hooks/useDebounce";
import { Input } from "../../ui/input";

const AddGroupMembers = () => {
  const { user } = useAuth();
  const { changeSidebar } = useSidebarStore();
  const { userIds, selectUserId, unSelectUserId, setUserIds } = useGroupStore();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data: users } = useQuery({
    queryKey: ["add-group-users", debouncedSearch],
    queryFn: () => searchUsers({ username: debouncedSearch || undefined }),
  });

  const allUsers = users?.filter((u) => u.user._id !== user?._id) ?? [];
  const listUsers = allUsers.filter((u) => !userIds.includes(u.user._id));
  const selectedUsers = allUsers.filter((u) => userIds.includes(u.user._id));

  return (
    <div className="p-3 flex flex-col h-full">
      {/* Header */}
      <div className="flex w-full justify-between items-center">
        <div className="flex gap-3 items-center">
          <button
            className="rounded-full p-2 transition-colors cursor-pointer duration-200 hover:bg-neutral-800"
            onClick={() => {
              setUserIds([]);
              changeSidebar("ChatList");
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <p>Add Group Members</p>
        </div>
      </div>

      {/* Selected Members Chips */}
      {selectedUsers.length > 0 && (
        <div className="flex gap-2 flex-wrap px-1 py-3">
          {selectedUsers.map((u) => (
            <div
              key={u.user._id}
              className="flex items-center gap-2 bg-neutral-800 px-3 py-1.5 rounded-full shrink-0"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-neutral-700 flex items-center justify-center">
                {u.user.avatar_url ? (
                  <Image
                    src={u.user.avatar_url}
                    width={20}
                    height={20}
                    alt={u.user.username}
                    className="object-cover"
                  />
                ) : (
                  <User className="size-3 text-neutral-300" />
                )}
              </div>
              <span className="text-sm max-w-24 truncate">{u.user.username}</span>
              <button
                onClick={() => unSelectUserId(u.user._id)}
                className="text-neutral-400 hover:text-white leading-none"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="my-3 relative">
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
      <ul className="overflow-y-auto flex-1 min-h-0 hide-scrollbar pb-20">
        {listUsers.map((u) => {
          const isSelected = userIds.includes(u.user._id);
          return (
            <li
              key={u.user._id}
              onClick={() => {
                if (isSelected) {
                  unSelectUserId(u.user._id);
                } else {
                  selectUserId(u.user._id);
                }
              }}
              className="p-3 cursor-pointer rounded-lg mt-1 flex gap-4 hover:bg-neutral-800 transition-colors"
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
          );
        })}
      </ul>

      {/* Proceed button */}
      {userIds.length > 0 && (
        <div className="absolute bottom-8 flex items-center justify-center w-full left-0">
          <button
            onClick={() => changeSidebar("GroupChat")}
            className="cursor-pointer text-white bg-blue-600 hover:bg-blue-700 rounded-full p-3 shadow-lg transition-colors"
          >
            <ArrowRight size={22} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AddGroupMembers;
