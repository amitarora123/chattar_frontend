import clsx from 'clsx';
import React from 'react';

const ChatContainer = ({ className }: { className: string }) => {
  return (
    <section className={clsx(className, 'w-full h-full')}>
      ChatContainer
    </section>
  );
};

export default ChatContainer;
