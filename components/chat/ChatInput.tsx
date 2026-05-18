import { Paperclip, Plus, Send, X, CornerUpLeft, Pencil } from "lucide-react";
// CornerUpLeft and Pencil are used in the reply/edit bars below
import { Button } from "../ui/button";
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useMemo } from "react";
import { socket } from "@/lib/socket/socketClient";
import { useAuth } from "@/lib/providers/AuthProvider";
import { Chat } from "@/types/chat.types";
import { Message } from "@/types/message.types";
import { useChatInputStore } from "@/lib/store/chatInputStore";
import { Image as ImageIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Image from "next/image";
import dynamic from "next/dynamic";
import { uploadAttachment } from "@/lib/api/cloudinary.api";
import { showErrorMessage } from "@/lib/utils";

const PdfPreview = dynamic(() => import("./PdfPreview"), { ssr: false });

interface ChatInputProps {
  chatId: string;
}

interface AttachmentDropdownProps {
  setImage: (file: File | null) => void;
  setDoc: (file: File | null) => void;
}

const AttachmentDropdown = ({ setImage, setDoc }: AttachmentDropdownProps) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        type="file"
        className="hidden"
        accept="image/*"
        ref={imageInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setDoc(null);
            setImage(e.target.files[0]);
          }
        }}
      />

      <input
        type="file"
        className="hidden"
        accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
        ref={docInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setImage(null);
            setDoc(e.target.files[0]);
          }
        }}
      />

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Plus className="size-5" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          alignOffset={-10} // fine-tune left offset if needed
          className="w-40"
          align="start"
          side="top"
          sideOffset={25}
          avoidCollisions={false} // prevents Radix from auto-flipping alignment
        >
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-1"
            >
              <ImageIcon className="size-4" /> Attach Photo
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => docInputRef.current?.click()}
              className="flex items-center gap-1"
            >
              <Paperclip className="size-4" /> Attach Document
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

const ChatInput = ({ chatId }: ChatInputProps) => {
  const user = useAuth().user;
  const userId = user?._id;

  const { replyingTo, editingMessage, clear } = useChatInputStore();

  const [doc, setDoc] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const imagePreviewUrl = useMemo(() => (image ? URL.createObjectURL(image) : ""), [image]);
  const docPreviewUrl = useMemo(() => (doc ? URL.createObjectURL(doc) : ""), [doc]);

  const uploadAttachmentMutation = useMutation({
    mutationFn: uploadAttachment,
    onError: (error) => showErrorMessage(error),
  });

  const [value, setValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();

  // Sync input value when edit mode is entered/exited
  const [prevEditingId, setPrevEditingId] = useState<string | undefined>(undefined);
  if (prevEditingId !== editingMessage?._id) {
    setPrevEditingId(editingMessage?._id);
    setValue(editingMessage ? editingMessage.content : "");
  }

  const stopTyping = () => {
    if (!userId || !isTyping) return;
    clearTimeout(typingTimeout.current ?? undefined);
    socket.emit("typing:stop", { room: `chat:${chatId}`, userId });
    setIsTyping(false);
  };

  const handleEditSubmit = () => {
    if (!editingMessage || !value.trim()) return;
    const content = value.trim();
    const original = editingMessage;

    // Optimistic update
    queryClient.setQueryData(
      ["chat-messages", chatId],
      (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((m) => (m._id === original._id ? { ...m, content, is_edited: true } : m))
          ),
        };
      }
    );

    setValue("");
    clear();
    stopTyping();

    socket.emit(
      "message:edit",
      { room: `chat:${chatId}`, message_id: original._id, content },
      ({ error, data }: { error?: string; data?: Message }) => {
        if (error) {
          // Rollback
          queryClient.setQueryData(
            ["chat-messages", chatId],
            (old: InfiniteData<Message[]> | undefined) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page) =>
                  page.map((m) => (m._id === original._id ? original : m))
                ),
              };
            }
          );
          return;
        }
        if (data) {
          queryClient.setQueryData(
            ["chat-messages", chatId],
            (old: InfiniteData<Message[]> | undefined) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page) =>
                  page.map((m) => (m._id === original._id ? data! : m))
                ),
              };
            }
          );
        }
      }
    );
  };

  const handleSendMessage = async () => {
    if (editingMessage) return handleEditSubmit();
    if ((!value.trim() && !image && !doc) || !userId || !user) return;

    const content = value.trim();
    const tempId = `temp-${Date.now()}`;
    const currentReply = replyingTo;

    const tempMessage: Message = {
      _id: tempId,
      chat_id: chatId,
      sender: {
        _id: user._id,
        username: user.username,
        avatar_url: user.avatar_url,
      },
      seen: [],
      content,
      reply_to: currentReply ?? undefined,
      ...((image || doc) && {
        attachment: {
          file_url: image ? imagePreviewUrl : docPreviewUrl,
          file_type: image ? image.type : doc!.type,
          file_size: image ? image.size : doc!.size,
          file_name: image ? image.name : doc!.name,
        },
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      is_edited: false,
      is_deleted: false,
      isPending: true,
    };

    queryClient.setQueryData(
      ["chat-messages", chatId],
      (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return old;
        const newPages = [...old.pages];
        newPages[0] = [...newPages[0], tempMessage];
        return { ...old, pages: newPages };
      }
    );

    queryClient.setQueryData(["chats"], (chats: Chat[]) =>
      chats.map((c) =>
        c._id === chatId ? { ...c, unread_count: c.unread_count - 1, last_message: tempMessage } : c
      )
    );

    setValue("");
    setImage(null);
    setDoc(null);
    clear();
    stopTyping();

    const removeTempMessage = () => {
      queryClient.setQueryData(
        ["chat-messages", chatId],
        (old: InfiniteData<Message[]> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => page.filter((msg) => msg._id !== tempId)),
          };
        }
      );
    };

    const onMessageSent = (response: { error?: string; data?: Message }) => {
      if (response.error || !response.data) return removeTempMessage();
      queryClient.setQueryData(
        ["chat-messages", chatId],
        (old: InfiniteData<Message[]> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((msg) => (msg._id === tempId ? response.data! : msg))
            ),
          };
        }
      );
      queryClient.setQueryData(["chats"], (old: Chat[] | undefined) =>
        old?.map((c) => (c._id === chatId ? { ...c, last_message: response.data! } : c))
      );
    };

    const sendMessage = (attachment?: Message["attachment"]) => {
      socket.emit(
        "message:send",
        {
          room: `chat:${chatId}`,
          chat_id: chatId,
          content,
          ...(attachment && { attachment }),
          ...(currentReply && { reply_to: currentReply._id }),
        },
        onMessageSent
      );
    };

    if (image) {
      uploadAttachmentMutation.mutate(
        { attachmentType: "image", file: image },
        {
          onSuccess: (data) =>
            sendMessage({
              file_url: data.secure_url,
              file_type: image.type,
              file_size: image.size,
              file_name: image.name,
            }),
          onError: (error) => {
            removeTempMessage();
            showErrorMessage(error);
          },
        }
      );
    } else if (doc) {
      uploadAttachmentMutation.mutate(
        { attachmentType: "doc", file: doc },
        {
          onSuccess: (data) =>
            sendMessage({
              file_url: data.secure_url,
              file_type: doc.type,
              file_size: doc.size,
              file_name: doc.name,
            }),
          onError: (error) => {
            removeTempMessage();
            showErrorMessage(error);
          },
        }
      );
    } else {
      sendMessage();
    }
  };

  const handleTyping = (text: string) => {
    setValue(text);
    if (!userId) return;
    const room = `chat:${chatId}`;
    if (!text) {
      stopTyping();
      return;
    }
    if (!isTyping) {
      socket.emit("typing:start", { room, userId });
      setIsTyping(true);
    }
    clearTimeout(typingTimeout.current ?? undefined);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing:stop", { room, userId });
      setIsTyping(false);
    }, 2000);
  };

  const replyName = replyingTo ? replyingTo.sender.username : "";
  const replyPreview = replyingTo
    ? replyingTo.content || replyingTo.attachment?.file_name || ""
    : "";

  return (
    <div className="mx-5 my-5">
      {/* Reply bar */}
      {replyingTo && (
        <div className="flex items-center gap-3 bg-slate-800/60 border border-white/6 rounded-t-2xl px-4 py-2.5">
          <CornerUpLeft className="size-4 text-blue-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-400">{replyName}</p>
            <p className="text-xs text-white/45 truncate mt-0.5">{replyPreview}</p>
          </div>
          <button onClick={clear} className="text-white/40 hover:text-white/80 transition-colors">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Edit bar */}
      {editingMessage && (
        <div className="flex items-center gap-3 bg-slate-800/60 border border-white/6 rounded-t-2xl px-4 py-2.5">
          <Pencil className="size-4 text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-green-400">Editing message</p>
            <p className="text-xs text-white/45 truncate mt-0.5">{editingMessage.content}</p>
          </div>
          <button
            onClick={() => {
              clear();
              setValue("");
            }}
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Main input row */}
      <div
        className={`flex relative items-center pl-4 pr-1 bg-slate-800/30 border-border border gap-2 ${replyingTo || editingMessage ? "rounded-b-full border-t-0" : "rounded-full"}`}
      >
        <AttachmentDropdown setDoc={setDoc} setImage={setImage} />

        {imagePreviewUrl.length > 0 && (
          <div className="absolute mb-5 p-5 bg-slate-900 rounded-2xl bottom-full">
            <div className="flex justify-end">
              <button className="cursor-pointer" onClick={() => setImage(null)}>
                <X
                  className="text-slate-400 hover:text-slate-200 transition-colors duration-150 ease"
                  size={20}
                />
              </button>
            </div>
            <Image
              src={imagePreviewUrl}
              alt="ImageAttachmentPreview"
              width={200}
              height={100}
              className="object-contain w-30 h-30"
            />
          </div>
        )}

        {doc && docPreviewUrl && (
          <div className="absolute mb-5 bg-slate-900 rounded-2xl bottom-full overflow-hidden w-64">
            <div className="flex justify-end p-2">
              <button onClick={() => setDoc(null)}>
                <X className="text-slate-400 hover:text-slate-200" size={20} />
              </button>
            </div>
            {doc.type === "application/pdf" && (
              <div className="px-3 overflow-hidden" style={{ height: "150px" }}>
                <PdfPreview url={docPreviewUrl} />
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-slate-800">
              <div className="bg-red-500 text-white text-xs font-bold px-1.5 py-1 rounded">PDF</div>
              <div className="flex flex-col">
                <span className="text-sm text-slate-200 truncate max-w-40">{doc.name}</span>
                <span className="text-xs text-slate-400">{(doc.size / 1024).toFixed(1)} kB</span>
              </div>
            </div>
          </div>
        )}

        <input
          className="rounded-full focus-visible:outline-none flex-1 focus-visible:ring-0 focus-visible:border-0 h-12"
          placeholder={editingMessage ? "Edit message..." : "Type a message"}
          value={value}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
          onChange={(e) => handleTyping(e.target.value)}
        />

        {(value.length > 0 || image || doc) && (
          <Button onClick={handleSendMessage} variant="outline" className="py-5 rounded-full">
            <Send />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
