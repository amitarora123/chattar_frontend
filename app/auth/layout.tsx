import AuthHeader from '@/components/auth/AuthHeader';
import React from 'react';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className=" overflow-hidden">
      <AuthHeader />
      {children}
    </div>
  );
};

export default AuthLayout;
