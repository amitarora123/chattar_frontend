import Image from "next/image";

const AuthHeader = () => {
  return (
    <header className=" h-20 sm:p-6 p-4">
      <Image src="/logo_2.svg" width={200} height={100} alt="auth-logo" />
    </header>
  );
};

export default AuthHeader;
