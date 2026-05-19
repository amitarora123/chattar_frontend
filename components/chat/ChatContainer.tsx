import clsx from "clsx";
import { useState, useEffect } from "react";
import ChatInput from "./ChatInput";
import ChatHeader from "./ChatHeader";
import ChatSearchBar from "./ChatSearchBar";
import MessageContainer from "./MessageContainer";
import ContactInfoPanel from "./ContactInfoPanel";
import { useChatStore } from "@/lib/store/chatStore";

interface ChatContainerProps {
  className: string;
}

const ChatContainer = ({ className }: ChatContainerProps) => {
  const { selectedChat } = useChatStore();

  const [prevChatId, setPrevChatId] = useState<string | undefined>(undefined);
  const [showInfo, setShowInfo] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMatchIdx, setActiveMatchIdx] = useState(0);
  const [matchCount, setMatchCount] = useState(0);

  // Reset all state synchronously when the selected chat changes
  if (prevChatId !== selectedChat?._id) {
    setPrevChatId(selectedChat?._id);
    setShowInfo(false);
    setShowSearch(false);
    setSearchQuery("");
    setActiveMatchIdx(0);
    setMatchCount(0);
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setActiveMatchIdx(0);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery("");
    setActiveMatchIdx(0);
    setMatchCount(0);
  };

  const handlePrev = () => {
    if (matchCount === 0) return;
    setActiveMatchIdx((i) => (i - 1 + matchCount) % matchCount);
  };

  const handleNext = () => {
    if (matchCount === 0) return;
    setActiveMatchIdx((i) => (i + 1) % matchCount);
  };

  if (!selectedChat) return null;

  return (
    <section className={clsx(className, "w-full h-full flex overflow-hidden relative")}>
      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <ChatHeader
          onInfoClick={() => setShowInfo((v) => !v)}
          showInfo={showInfo}
          onSearchClick={() => setShowSearch((v) => !v)}
          showSearch={showSearch}
        />
        {showSearch && (
          <ChatSearchBar
            query={searchQuery}
            onChange={handleSearchChange}
            onClose={closeSearch}
            onPrev={handlePrev}
            onNext={handleNext}
            matchCount={matchCount}
            activeIdx={activeMatchIdx}
          />
        )}
        <MessageContainer
          searchQuery={searchQuery}
          activeMatchIdx={activeMatchIdx}
          onMatchCountChange={setMatchCount}
        />
        <ChatInput key={selectedChat._id} chatId={selectedChat._id} />
      </div>

      {/* Info panel — slides in from right */}
      <div
        className={clsx(
          "h-full border-l border-white/8 shrink-0 transition-[width] duration-300 overflow-hidden",
          showInfo ? "w-80" : "w-0"
        )}
      >
        <div className="w-80 h-full">
          <ContactInfoPanel onClose={() => setShowInfo(false)} />
        </div>
      </div>
    </section>
  );
};

export default ChatContainer;
