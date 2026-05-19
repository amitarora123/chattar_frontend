"use client";

import { googleLogin } from "@/lib/api/auth.api";
import { showErrorMessage } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const GoogleCallback = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { mutate } = useMutation({
    mutationFn: googleLogin,
    onSuccess: () => {
      router.replace("/chats");
    },
    onError: (error) => {
      showErrorMessage(error);
      router.replace("/auth/sign-in");
    },
  });

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      showErrorMessage("Google login was cancelled");
      router.replace("/auth/sign-in");
      return;
    }

    mutate({ code });
  }, []);

  return (
    <div className="flex items-center justify-center h-screen text-white">
      <p>Signing you in with Google...</p>
    </div>
  );
};

const GoogleCallbackPage = () => (
  <Suspense>
    <GoogleCallback />
  </Suspense>
);

export default GoogleCallbackPage;
