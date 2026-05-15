import { useChatStore } from "@/lib/store/chatStore";
import { cn } from "@/lib/utils";
import { FileText, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Document, Page } from "react-pdf";

const AttachmentPreview = () => {
  const { attachment, setAttachment } = useChatStore();

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (attachment) setVisible(true);
    else setVisible(false);
  }, [attachment]);

  useEffect(() => {
    let objectUrl = "";
    if (attachment) {
      setIsLoading(true);
      try {
        objectUrl = URL.createObjectURL(attachment);
        setBlobUrl(objectUrl);
      } catch {
        setBlobUrl(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      setBlobUrl(null);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment]);

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 bg-slate-900 flex flex-col transition-transform duration-300 ease-in-out",
        visible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/60">
        <button
          className="cursor-pointer p-1 rounded-full hover:bg-slate-700/50 transition-colors"
          onClick={() => setAttachment(null)}
        >
          <X className="size-5 text-slate-300" />
        </button>
        <span className="text-white font-medium text-sm truncate flex-1">{attachment?.name}</span>
        {attachment && (
          <span className="text-slate-400 text-xs shrink-0">
            {(attachment.size / 1024).toFixed(1)} KB
          </span>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden p-6">
        {isLoading ? (
          <Loader2 className="animate-spin size-10 text-primary" />
        ) : attachment && blobUrl ? (
          attachment.type === "application/pdf" ? (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-700/40">
                <Document file={blobUrl}>
                  <Page
                    pageNumber={1}
                    width={220}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
              </div>
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                <div className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  PDF
                </div>
                <span className="text-sm text-slate-200 truncate max-w-45">{attachment.name}</span>
              </div>
            </div>
          ) : attachment.type.startsWith("image/") ? (
            <Image
              src={blobUrl}
              width={600}
              height={600}
              alt={attachment.name}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-slate-700 rounded-2xl p-8">
                <FileText className="size-16 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium truncate max-w-60">{attachment.name}</p>
                <p className="text-slate-400 text-sm mt-1">
                  {(attachment.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
};

export default AttachmentPreview;
