"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useChatStore } from "@/lib/store/chatStore";
import { useAuth } from "@/lib/providers/AuthProvider";
import { usePresenceStore } from "@/lib/store/presenceStore";
import { getChatAttachments } from "@/lib/api/message.api";
import { ChatParticipant } from "@/types/chat.types";
import { Crown, FileText, User, Users, X } from "lucide-react";
import Image from "next/image";

const formatLastSeen = (lastSeen: string) => {
  const date = new Date(lastSeen);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatFileSize = (bytes: number) => {
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} kB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const getDocBadge = (fileType: string) => {
  if (fileType === "application/pdf") return { label: "PDF", color: "bg-red-500" };
  if (fileType.includes("word") || fileType.includes("wordprocessingml"))
    return { label: "DOCX", color: "bg-blue-600" };
  return { label: "FILE", color: "bg-slate-500" };
};

const MemberRow = ({ participant, isMe }: { participant: ChatParticipant; isMe: boolean }) => {
  const { user, groupRole } = participant;
  const isAdmin = groupRole?.name === "Admin";
  const online = usePresenceStore((s) => s.isOnline(user._id));
  return (
    <li className="flex items-center gap-3 py-2.5 px-5">
      <div className="relative w-10 h-10 shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              width={40}
              height={40}
              alt={user.username}
              className="rounded-full object-cover w-10 h-10"
            />
          ) : (
            <User className="size-4 text-neutral-400" />
          )}
        </div>
        {online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0d1117] rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {user.display_name || user.username}
          {isMe && <span className="text-slate-500 text-xs ml-1.5">(you)</span>}
        </p>
        {isAdmin && (
          <p className="text-xs text-yellow-500/80 flex items-center gap-1 mt-0.5">
            <Crown size={10} className="fill-yellow-500/80" />
            Admin
          </p>
        )}
      </div>
    </li>
  );
};

interface ContactInfoPanelProps {
  onClose: () => void;
}

type MediaTab = "media" | "docs";

const ContactInfoPanel = ({ onClose }: ContactInfoPanelProps) => {
  const { selectedChat } = useChatStore();
  const { user } = useAuth();
  const userId = user?._id;
  const [activeTab, setActiveTab] = useState<MediaTab>("media");
  const isOnline = usePresenceStore((s) => s.isOnline);

  const { data: attachments = [], isLoading: attachmentsLoading } = useQuery({
    queryKey: ["chat-attachments", selectedChat?._id],
    queryFn: () => getChatAttachments(selectedChat!._id),
    enabled: !!selectedChat?._id,
  });

  if (!selectedChat) return null;

  const isGroup = selectedChat.is_group;
  const recipient = !isGroup ? selectedChat.participants.find((p) => p.user._id !== userId) : null;

  const avatarUrl = isGroup ? selectedChat.groupMetaData?.avatar_url : recipient?.user.avatar_url;
  const name = isGroup
    ? selectedChat.groupMetaData!.name
    : recipient?.user.display_name || recipient?.user.username;

  const images = attachments.filter((m) => m.attachment?.file_type.startsWith("image/"));
  const docs = attachments.filter(
    (m) => m.attachment && !m.attachment.file_type.startsWith("image/")
  );

  return (
    <div className="flex flex-col h-full bg-[#0d1117] overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4 border-b border-white/8 shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>
        <p className="font-medium text-sm">{isGroup ? "Group info" : "Contact info"}</p>
      </div>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center px-6 py-8 gap-3 border-b border-white/8">
        <div className="relative w-24 h-24 shrink-0">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                width={96}
                height={96}
                alt={name || ""}
                className="object-cover w-24 h-24 rounded-full"
              />
            ) : isGroup ? (
              <Users size={40} className="text-neutral-500" />
            ) : (
              <User size={40} className="text-neutral-500" />
            )}
          </div>
          {!isGroup && recipient && isOnline(recipient.user._id) && (
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-[3px] border-[#0d1117] rounded-full" />
          )}
        </div>
        <div className="text-center">
          <p className="text-base font-semibold">{name}</p>
          {!isGroup && recipient?.user.username && (
            <p className="text-sm text-slate-400 mt-0.5">@{recipient.user.username}</p>
          )}
        </div>
      </div>

      {/* Group description */}
      {isGroup && selectedChat.groupMetaData?.description && (
        <div className="px-5 py-4 border-b border-white/8">
          <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Description</p>
          <p className="text-sm text-slate-300 leading-relaxed">
            {selectedChat.groupMetaData.description}
          </p>
        </div>
      )}

      {/* Online / Last seen (DM only) */}
      {!isGroup && recipient && (
        <div className="px-5 py-4 border-b border-white/8">
          {isOnline(recipient.user._id) ? (
            <p className="text-sm text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              Online
            </p>
          ) : recipient.user.last_seen ? (
            <>
              <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Last seen</p>
              <p className="text-sm text-slate-300">{formatLastSeen(recipient.user.last_seen)}</p>
            </>
          ) : null}
        </div>
      )}

      {/* Created by (group only) */}
      {isGroup && selectedChat.groupMetaData?.created_by && (
        <div className="px-5 py-4 border-b border-white/8">
          <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wider">Created by</p>
          <p className="text-sm text-slate-300">
            {selectedChat.groupMetaData.created_by.user.display_name ||
              selectedChat.groupMetaData.created_by.user.username}
          </p>
        </div>
      )}

      {/* Media / Docs tabs */}
      <div className="border-b border-white/8">
        <div className="flex">
          {(["media", "docs"] as MediaTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-blue-500 text-white"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab === "media" ? `Media (${images.length})` : `Docs (${docs.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {attachmentsLoading ? (
        <div className="px-5 py-6 text-xs text-slate-500 text-center">Loading…</div>
      ) : activeTab === "media" ? (
        images.length === 0 ? (
          <p className="px-5 py-6 text-xs text-slate-500 text-center">No images shared yet</p>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            {images.map((m) => (
              <button
                key={m._id}
                onClick={() => window.open(m.attachment!.file_url, "_blank")}
                className="aspect-square overflow-hidden bg-neutral-800 hover:opacity-80 transition-opacity"
              >
                <Image
                  src={m.attachment!.file_url}
                  width={120}
                  height={120}
                  alt={m.attachment!.file_name ?? ""}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )
      ) : docs.length === 0 ? (
        <p className="px-5 py-6 text-xs text-slate-500 text-center">No documents shared yet</p>
      ) : (
        <ul className="divide-y divide-white/6">
          {docs.map((m) => {
            const badge = getDocBadge(m.attachment!.file_type);
            return (
              <li key={m._id}>
                <button
                  onClick={() => window.open(m.attachment!.file_url, "_blank")}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <FileText size={18} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{m.attachment!.file_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span
                        className={`${badge.color} text-white text-[10px] font-bold px-1 py-0.5 rounded mr-1.5`}
                      >
                        {badge.label}
                      </span>
                      {formatFileSize(m.attachment!.file_size)}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Group members */}
      {isGroup && (
        <div className="py-2 border-t border-white/8">
          <p className="text-xs text-slate-500 uppercase tracking-wider px-5 py-3">
            {selectedChat.participants.length} members
          </p>
          <ul>
            {selectedChat.participants.map((p) => (
              <MemberRow key={p.user._id} participant={p} isMe={p.user._id === userId} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ContactInfoPanel;
