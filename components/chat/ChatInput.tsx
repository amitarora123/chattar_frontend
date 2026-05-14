import { Paperclip, Plus, Send, X } from "lucide-react";
import { Button } from "../ui/button";
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { socket } from "@/lib/socket/socketClient";
import { useAuth } from "@/lib/providers/AuthProvider";
import { Chat } from "@/types/chat.types";
import { Message } from "@/types/message.types";
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
import { AxiosError } from "axios";

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

        <DropdownMenuContent className="w-40" align="start" side="top" sideOffset={20}>
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

  const [doc, setDoc] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);

  const [docPreviewUrl, setDocPreviewUrl] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  const uploadAttachmentMutation = useMutation({
    mutationFn: uploadAttachment,
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
    if ((!value.trim() && !image && !doc) || !userId || !user) return;

    const content = value.trim();
    const tempId = `temp-${Date.now()}`;

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

    // Optimistic update
    queryClient.setQueryData(
      ["chat-messages", chatId],
      (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return old;
        const newPages = [...old.pages];
        newPages[0] = [...newPages[0], tempMessage];
        return { ...old, pages: newPages };
      }
    );

    // Clear UI immediately
    setValue("");
    setImage(null);
    setDoc(null);
    setImagePreviewUrl("");
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

      console.log(response.data.attachment);
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
        { room: `chat:${chatId}`, chat_id: chatId, content, ...(attachment && { attachment }) },
        onMessageSent
      );
    };

    if (image) {
      uploadAttachmentMutation.mutate(
        {
          attachmentType: "image",
          file: image,
        },
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
        {
          attachmentType: "doc",
          file: doc,
        },
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

  useEffect(() => {
    const handleImagePreview = () => {
      if (image) {
        const imageUrl = URL.createObjectURL(image);
        setImagePreviewUrl(imageUrl);
      } else setImagePreviewUrl("");
    };
    handleImagePreview();
  }, [image]);

  useEffect(() => {
    const handleDocPreview = () => {
      if (doc) {
        const docUrl = URL.createObjectURL(doc);
        setDocPreviewUrl(docUrl);
      } else setDocPreviewUrl("");
    };

    handleDocPreview();
  }, [doc]);

  return (
    <div className="flex relative items-center mx-5 pl-4 pr-1 my-5 bg-slate-800/30 rounded-full border-border border gap-2">
      <AttachmentDropdown setDoc={setDoc} setImage={setImage} />
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
      {doc && docPreviewUrl && (
        <div className="absolute mb-5 bg-slate-900 rounded-2xl bottom-full overflow-hidden w-64">
          <div className="flex justify-end p-2">
            <button onClick={() => setDoc(null)}>
              <X className="text-slate-400 hover:text-slate-200" size={20} />
            </button>
          </div>

          {/* PDF first page preview */}
          {doc.type === "application/pdf" && (
            <div className="px-3 overflow-hidden" style={{ height: "150px" }}>
              <PdfPreview url={docPreviewUrl} />
            </div>
          )}

          {/* Metadata bar — like WhatsApp */}
          <div className="flex items-center gap-3 p-3 bg-slate-800">
            <div className="bg-red-500 text-white text-xs font-bold px-1.5 py-1 rounded">PDF</div>
            <div className="flex flex-col">
              <span className="text-sm text-slate-200 truncate max-w-[160px]">{doc.name}</span>
              <span className="text-xs text-slate-400">{(doc.size / 1024).toFixed(1)} kB</span>
            </div>
          </div>
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
      {value.length > 0 || image || doc ? (
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
