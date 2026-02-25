'use client';
import Image from 'next/image';
import { Button } from '../ui/button';
import { signOut } from 'next-auth/react';
import ProfileDropdown from '../user-profile/ProfileDropdown';
const Header = () => {
  return (
    <div className=" h-20 py-10 flex justify-between items-center px-5">
      <Image src="/logo_3.svg" width={200} height={200} alt="Chattar" />
      {/* <Button
        className="mr-10 bg-blue-400 text-white hover:bg-blue-400 hover:opacity-80 cursor-pointer"
        onClick={() =>
          signOut({
            redirect: true,
            redirectTo: '/auth/sign-in',
          })
        }
      >
        Sign Out
      </Button> */}

      <ProfileDropdown />
    </div>
  );
};

export default Header;
