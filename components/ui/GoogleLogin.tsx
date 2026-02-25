'use client';

import { signIn } from 'next-auth/react';
import { Button } from './button';
import { FcGoogle } from 'react-icons/fc';

const GoogleLoginButton = () => {
  return (
    <Button
      variant="outline"
      onClick={() =>
        signIn('google', {
          redirect: true,
          redirectTo: '/chats',
        })
      }
      className="w-full"
    >
      Login With Google <FcGoogle />
    </Button>
  );
};

export default GoogleLoginButton;
