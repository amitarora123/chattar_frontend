"use client";
import Image from "next/image";
import ProfileDropdown from "../user-profile/ProfileDropdown";
const Header = () => {
  return (
    <div className=" h-20 py-10 flex justify-between items-center px-5">
      <Image src="/logo_3.svg" width={200} height={200} alt="Chattar" />
      <ProfileDropdown />
    </div>
  );
};

export default Header;
