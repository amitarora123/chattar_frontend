"use client";
import AppSidebar from "@/components/ui/AppSidebar";
import React, { useEffect } from "react";
import { socket } from "@/lib/socket/socketClient";
import { useQuery } from "@tanstack/react-query";
import AuthProvider from "@/lib/providers/AuthProvider";

const Layout = ({ children }: { children: React.ReactNode }) => {
  // useEffect(() => {
  //   if (!session) return;
  //   socket.auth = {
  //     userId: session?.user.id,
  //   };
  //   socket.connect();
  // }, [session]);

  return (
    <AuthProvider>
      <div className="h-dvh  lg:flex  ">
        <AppSidebar />
        {children}
      </div>
    </AuthProvider>
  );
};

export default Layout;
