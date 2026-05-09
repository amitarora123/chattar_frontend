"use client";

import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { useMutation } from "@tanstack/react-query";
import { googleLogin } from "@/lib/api/auth.api";
import { showErrorMessage } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { setRefreshToken } from "@/lib/auth/session";
const GoogleLoginButton = () => {
  const router = useRouter();

  const googleLoginMutation = useMutation({
    mutationKey: ["google-login"],
    mutationFn: googleLogin,
    onError: (error) => {
      showErrorMessage(error);
    },
    onSuccess: (data) => {
      setRefreshToken(data.refreshToken);
      router.replace("/chats");
    },
  });

  const handleGoogleLogin = (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      showErrorMessage("Invalid idToken");
      return;
    }
    googleLoginMutation.mutate({
      id_token: idToken,
    });
  };

  return (
    <GoogleLogin onSuccess={handleGoogleLogin} />
    // <Button
    //   variant="outline"
    //   onClick={() =>
    //     signIn("google", {
    //       redirect: true,
    //       redirectTo: "/chats",
    //     })
    //   }
    //   className="w-full hover:opacity-80 hover:text-white cursor-pointer"
    // >
    //   Login With Google <FcGoogle />
    // </Button>
  );
};

export default GoogleLoginButton;
