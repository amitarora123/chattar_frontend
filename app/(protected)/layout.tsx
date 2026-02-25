import React from 'react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <div className="h-screen  flex flex-col bg-authBg">{children}</div>;
};

export default Layout;
