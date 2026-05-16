"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Camera, Crown, Search, User, Users } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useSidebarStore } from "@/lib/store/sidebarStore";
import { useAuth } from "@/lib/providers/AuthProvider";
import { searchUsers } from "@/lib/api/user.api";
import { createGroup } from "@/lib/api/chat.api";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import useDebounce from "@/hooks/useDebounce";
import { uploadAttachment } from "@/lib/api/cloudinary.api";

const GroupChat = () => {
  const { changeSidebar } = useSidebarStore();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Step 1 state
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  // Step 2 state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [adminIds, setAdminIds] = useState<string[]>([]);

  const { data: users } = useQuery({
    queryKey: ["group-users", debouncedSearch],
    queryFn: () => searchUsers({ username: debouncedSearch || undefined }),
  });

  const allUsers = users?.filter((u) => u.user._id !== user?._id) ?? [];
  const listUsers = allUsers.filter((u) => !selectedIds.includes(u.user._id));
  const selectedUsers = allUsers.filter((u) => selectedIds.includes(u.user._id));

  const toggleUser = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAdmin = (id: string) =>
    setAdminIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const uploadGroupAvatarMutation = useMutation({
    mutationFn: uploadAttachment,
    mutationKey: ["upload-group-avatar"],
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const { mutate, isPending } = useMutation({
    mutationFn: createGroup,
    onSuccess: (data) => {
      toast.success(data.message || "Group created");
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      changeSidebar("ChatList");
    },
    onError: (error) => {
      const { message } = (error as AxiosError).response?.data as { message: string };
      toast.error(message);
    },
  });

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      setSelectedIds([]);
      setSearch("");
      changeSidebar("ChatList");
    }
  };

  const handleSubmit = async () => {
    let avatar_url = "";
    if (avatar) {
      const res = await uploadGroupAvatarMutation.mutateAsync({
        file: avatar,
        attachmentType: "image",
      });
      avatar_url = res.secure_url;
    }

    // Always include current user's id as admin, merged with user-selected admins
    const finalAdminIds = Array.from(new Set([...(user?._id ? [user._id] : []), ...adminIds]));

    mutate({
      adminIds: finalAdminIds,
      memberIds: selectedIds,
      name,
      avatar_url,
      description,
    });
  };

  // ── Step 1: Select Members ──────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="p-3 flex flex-col h-full">
        <div className="flex gap-3 items-center">
          <button
            className="rounded-full p-2 transition-colors cursor-pointer duration-200 hover:bg-neutral-800"
            onClick={handleBack}
          >
            <ArrowLeft size={20} />
          </button>
          <p className="font-medium">Create Group</p>
        </div>

        {/* Selected chips */}
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
                  onClick={() => toggleUser(u.user._id)}
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

        {/* Users list */}
        <ul className="overflow-y-auto flex-1 min-h-0 hide-scrollbar pb-20">
          {listUsers.map((u) => (
            <li
              key={u.user._id}
              onClick={() => toggleUser(u.user._id)}
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
          ))}
        </ul>

        {/* Next button */}
        {selectedIds.length > 0 && (
          <div className="absolute bottom-8 flex items-center justify-center w-full left-0">
            <button
              onClick={() => setStep(2)}
              className="cursor-pointer text-white bg-blue-600 hover:bg-blue-700 rounded-full p-3 shadow-lg transition-colors"
            >
              <ArrowRight size={22} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Step 2: Group Metadata ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-y-auto hide-scrollbar">
      <div className="flex items-center gap-3 p-4">
        <button onClick={handleBack} className="p-2 rounded-full hover:bg-neutral-800">
          <ArrowLeft size={20} />
        </button>
        <p className="font-medium">Group Info</p>
      </div>

      <div className="flex flex-col items-center px-6 mt-6 gap-6">
        {/* Avatar */}
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
            )}
          </div>
          <Camera className="absolute bottom-2 right-1 text-blue-200" />
          <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </label>

        {/* Group name */}
        <div className="w-full">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="w-full bg-transparent border-b border-slate-600 outline-none py-2"
          />
        </div>

        {/* Description */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Group description (optional)"
          className="w-full border-b border-slate-600 outline-none resize-none bg-transparent"
          rows={2}
        />

        {/* Admin selection */}
        <div className="w-full">
          <p className="text-sm text-neutral-400 mb-3">
            Set admins <span className="text-neutral-500 text-xs">(you are always an admin)</span>
          </p>
          <ul className="flex flex-col gap-1">
            {selectedUsers.map((u) => {
              const isAdmin = adminIds.includes(u.user._id);
              return (
                <li
                  key={u.user._id}
                  onClick={() => toggleAdmin(u.user._id)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                    isAdmin ? "bg-blue-600/20 hover:bg-blue-600/30" : "hover:bg-neutral-800"
                  }`}
                >
                  <div className="w-9 h-9 shrink-0">
                    {u.user.avatar_url ? (
                      <Image
                        src={u.user.avatar_url}
                        width={36}
                        height={36}
                        alt={u.user.username}
                        className="rounded-full object-cover w-9 h-9"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center">
                        <User className="size-4 text-neutral-300" />
                      </div>
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium truncate">{u.user.username}</span>
                  <Crown
                    size={18}
                    className={`shrink-0 transition-colors ${
                      isAdmin ? "text-yellow-400 fill-yellow-400" : "text-neutral-600"
                    }`}
                  />
                </li>
              );
            })}
          </ul>
        </div>

        <Button
          className="w-full mt-2 mb-8 rounded-full"
          disabled={!name.trim() || isPending}
          onClick={handleSubmit}
        >
          {isPending ? "Creating..." : "Create Group"}
        </Button>
      </div>
    </div>
  );
};

export default GroupChat;
