"use client";

import { Button } from "../ui/button";
import { FcGoogle } from "react-icons/fc";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

const GoogleLoginButton = () => {
  const handleGoogleLogin = () => {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASEURI}/auth/google/callback`,
      response_type: "code",
      scope: "email profile",
      prompt: "select_account",
    });
    window.location.href = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleLogin}
      className="w-full cursor-pointer"
    >
      <FcGoogle className="mr-2" /> Login with Google
    </Button>
  );
};

export default GoogleLoginButton;
