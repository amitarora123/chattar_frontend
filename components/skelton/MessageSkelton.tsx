interface MessageSkeletonProps {
  type: "left" | "right";
  lines?: 1 | 2 | 3;
  showAvatar?: boolean;
}

const MessageSkeleton = ({ type, lines = 2, showAvatar = true }: MessageSkeletonProps) => {
  const isRight = type === "right";

  const lineWidths = {
    1: ["w-36"],
    2: ["w-44", "w-28"],
    3: ["w-48", "w-40", "w-24"],
  }[lines];

  return (
    <div className={`flex items-end gap-2.5 ${isRight ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {showAvatar && !isRight && (
        <div className="relative w-[30px] h-[30px] flex-shrink-0 rounded-full overflow-hidden bg-white/[0.06] animate-pulse">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.2s_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`
          relative overflow-hidden
          max-w-[260px]
          rounded-[18px]
          px-4 py-3
          flex flex-col gap-2
          animate-pulse
          border
          ${
            isRight
              ? "rounded-br-[4px] bg-[#1a2035] border-[rgba(99,132,255,0.1)]"
              : "rounded-bl-[4px] bg-[#161b27] border-white/[0.05]"
          }
        `}
      >
        {/* Shimmer sweep */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2.2s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
        </div>

        {/* Lines */}
        <div className="relative z-10 flex flex-col gap-2">
          {lineWidths.map((w, i) => (
            <div
              key={i}
              className={`h-3 rounded-full bg-white/[0.08] ${w} ${isRight ? "self-end" : "self-start"}`}
            />
          ))}

          {/* Timestamp */}
          <div
            className={`h-2 w-10 rounded-full bg-white/[0.04] mt-0.5 ${isRight ? "self-end" : "self-start"}`}
          />
        </div>
      </div>
    </div>
  );
};

export default MessageSkeleton;
