const ChatSkelton = () => {
  return (
    <div className="w-full max-w-md  p-4 rounded-xl">
      <div className="flex items-start gap-3 animate-pulse">
        {/* <!-- Avatar --> */}
        <div className="w-12 h-12 rounded-full bg-slate-700"></div>

        {/* <!-- Content --> */}
        <div className="flex-1 space-y-3">
          {/* <!-- Username + Time --> */}
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-slate-700"></div>
            <div className="h-3 w-12 rounded bg-slate-800"></div>
          </div>

          {/* <!-- Message --> */}
          <div className="space-y-2">
            <div className="h-3 w-3/4 rounded bg-slate-700"></div>
            <div className="h-3 w-1/2 rounded bg-slate-800"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSkelton;
