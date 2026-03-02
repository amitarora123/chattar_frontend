import AppSidebar from '@/components/ui/AppSidebar';
import React from 'react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen  lg:flex  ">
      <AppSidebar />
      {children}
    </div>
  );
};

export default Layout;
