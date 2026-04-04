import AuthHeader from "@/components/auth/AuthHeader";
import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col overflow-hidden h-dvh">
      <div className="hidden sm:block">
        <AuthHeader />
      </div>
      <div className="flex-1 w-full h-full  flex justify-center items-center">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
