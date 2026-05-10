"use client";
import AppSidebar from "@/components/ui/AppSidebar";
import React, { useEffect } from "react";
import { socket } from "@/lib/socket/socketClient";
import AuthProvider, { useAuth } from "@/lib/providers/AuthProvider";

const SocketConnector = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?._id) return;
    socket.auth = { userId: user._id };
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [user?._id]);

  return null;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <SocketConnector />
      <div className="h-dvh  lg:flex  ">
        <AppSidebar />
        {children}
      </div>
    </AuthProvider>
  );
};

export default Layout;
