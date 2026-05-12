import { Paperclip, Plus, Send, X } from "lucide-react";
import { Button } from "../ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { socket } from "@/lib/socket/socketClient";
import { useAuth } from "@/lib/providers/AuthProvider";
import { Chat } from "@/types/chat.types";
import { Message } from "@/types/message.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Image from "next/image";
import { uploadImage } from "@/lib/api/cloudinary.api";
import { showErrorMessage } from "@/lib/utils";

interface ChatInputProps {
  chatId: string;
}

interface AttachmentDropdownProps {
  setImage: (file: File) => void;
}

const AttachmentDropdown = ({ setImage }: AttachmentDropdownProps) => {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        type="file"
        className="hidden"
        accept="image/*"
        ref={ref}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
          }
        }}
      />

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Plus className="size-5" />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-40" align="start">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => ref.current?.click()}
              className="flex items-center gap-1"
            >
              <Paperclip className="size-4" /> Add Photo
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

  const [image, setImage] = useState<File | null>();
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  const uploadImageMutation = useMutation({
    mutationFn: uploadImage,
    onError: (error) => {
      showErrorMessage(error);
    },
  });

  const [value, setValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();

  const stopTyping = () => {
    if (!userId || !isTyping) return;
    clearTimeout(typingTimeout.current ?? undefined);
    socket.emit("typing:stop", { room: `chat:${chatId}`, userId });
    setIsTyping(false);
  };

  const handleSendMessage = async () => {
    if ((!value.trim() && !image) || !userId) return;

    if (!user) return;

    const content = value.trim();
    const tempId = `temp-${Date.now()}`;

    if (image) {
      // Optimistic update: Add temp message with local image URL
      const tempMessage: Message = {
        _id: tempId,
        chat_id: chatId,
        sender: {
          user: {
            _id: user._id,
            username: user.username,
            display_name: user.username,
            avatar_url: user.avatar_url,
            last_seen: new Date().toISOString(),
          },
          isContact: true,
          contactName: null,
        },
        seen: [],
        content,
        attachment: {
          file_url: imagePreviewUrl,
          file_type: image.type,
          file_size: image.size,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        is_edited: false,
        is_deleted: false,
        isPending: true,
      };

      queryClient.setQueryData(["chat-messages", chatId], (old: Message[] | undefined) =>
        old ? [...old, tempMessage] : [tempMessage]
      );

      // Clear UI immediately
      setValue("");
      setImage(null);
      setImagePreviewUrl("");
      stopTyping();

      // Upload image and send message
      uploadImageMutation.mutate(image, {
        onSuccess: (data) => {
          socket.emit(
            "message:send",
            {
              room: `chat:${chatId}`,
              chat_id: chatId,
              content,
              attachment: {
                file_url: data.secure_url,
                file_type: image.type,
                file_size: image.size,
              },
            },
            (response: { error?: string; data?: Message }) => {
              if (response.error || !response.data) {
                // Remove temp message on error
                queryClient.setQueryData(["chat-messages", chatId], (old: Message[] | undefined) =>
                  old ? old.filter((msg) => msg._id !== tempId) : []
                );
                return;
              }
              // Replace temp message with real message
              queryClient.setQueryData(["chat-messages", chatId], (old: Message[] | undefined) =>
                old
                  ? old.map((msg) => (msg._id === tempId ? response.data! : msg))
                  : [response.data!]
              );
              queryClient.setQueryData(["chats"], (old: Chat[] | undefined) =>
                old?.map((c) => (c._id === chatId ? { ...c, last_message: response.data! } : c))
              );
            }
          );
        },
        onError: (error) => {
          // Remove temp message on upload failure
          queryClient.setQueryData(["chat-messages", chatId], (old: Message[] | undefined) =>
            old ? old.filter((msg) => msg._id !== tempId) : []
          );
          showErrorMessage(error);
        },
      });
    } else {
      // Optimistic update for text message
      const tempMessage: Message = {
        _id: tempId,
        chat_id: chatId,
        sender: {
          user: {
            _id: user._id,
            username: user.username,
            display_name: user.username,
            avatar_url: user.avatar_url,
            last_seen: new Date().toISOString(),
          },
          isContact: true,
          contactName: null,
        },
        seen: [],
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        is_edited: false,
        is_deleted: false,
        isPending: true,
      };

      queryClient.setQueryData(["chat-messages", chatId], (old: Message[] | undefined) =>
        old ? [...old, tempMessage] : [tempMessage]
      );

      // Clear UI immediately
      setValue("");
      stopTyping();

      // Send message
      socket.emit(
        "message:send",
        { room: `chat:${chatId}`, chat_id: chatId, content },
        (response: { error?: string; data?: Message }) => {
          if (response.error || !response.data) {
            // Remove temp message on error
            queryClient.setQueryData(["chat-messages", chatId], (old: Message[] | undefined) =>
              old ? old.filter((msg) => msg._id !== tempId) : []
            );
            return;
          }
          // Replace temp message with real message
          queryClient.setQueryData(["chat-messages", chatId], (old: Message[] | undefined) =>
            old ? old.map((msg) => (msg._id === tempId ? response.data! : msg)) : [response.data!]
          );
          queryClient.setQueryData(["chats"], (old: Chat[] | undefined) =>
            old?.map((c) => (c._id === chatId ? { ...c, last_message: response.data! } : c))
          );
        }
      );
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

  useEffect(() => {
    const handleImagePreview = () => {
      if (image) {
        const imageUrl = URL.createObjectURL(image);
        setImagePreviewUrl(imageUrl);
      } else setImagePreviewUrl("");
    };
    handleImagePreview();
  }, [image]);

  return (
    <div className="flex relative items-center mx-5 pl-4 pr-1 my-5 bg-slate-800/30 rounded-full border-border border gap-2">
      <AttachmentDropdown setImage={setImage} />
      {imagePreviewUrl.length > 0 && (
        <div className="absolute mb-5 p-5 bg-slate-900 rounded-2xl  bottom-full">
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
      <input
        className="rounded-full focus-visible:outline-none  flex-1 focus-visible:ring-0 focus-visible:border-0  h-12"
        placeholder="Type a message"
        value={value}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSendMessage();
        }}
        onChange={(e) => handleTyping(e.target.value)}
      />
      {value.length > 0 || image ? (
        <Button
          onClick={() => handleSendMessage()}
          variant="outline"
          className=" py-5 rounded-full"
        >
          {" "}
          <Send />{" "}
        </Button>
      ) : null}
    </div>
  );
};

export default ChatInput;
