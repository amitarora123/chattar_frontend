'use client';
import AppSidebar from '@/components/ui/AppSidebar';
import React, { useEffect } from 'react';
import { socket } from '@/lib/socket/socketClient';
import { useSession } from 'next-auth/react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  useEffect(() => {
    if (!session) return;
    socket.auth = {
      userId: session?.user.id,
    };
    socket.connect();
  }, [session]);

  return (
    <div className="h-screen  lg:flex  ">
      <AppSidebar />
      {children}
    </div>
  );
};

export default Layout;
