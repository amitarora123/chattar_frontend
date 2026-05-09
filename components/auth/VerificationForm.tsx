"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useMutation } from "@tanstack/react-query";
import { resendVerificationOtp, verifyUser } from "@/lib/api/user.api";
import { useRouter } from "next/navigation";
import OtpInput from "../form/OtpInput";
import { useTimer } from "@/hooks/useTimer";
import {
  getSecondsLeft,
  showErrorMessage,
  showSuccessMessage,
} from "@/lib/utils";

const OTP_LENGTH = 6;

const VerificationForm = () => {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const [otpCode, setOtpCode] = useState<string>("");

  const { secondsLeft, setSecondsLeft } = useTimer();

  const { mutate: resendOtp } = useMutation({
    mutationKey: ["resend-otp", email],
    mutationFn: async (email: string) => await resendVerificationOtp(email),
    onError: (error) => {
      showErrorMessage(error);
    },
    onSuccess: (data) => {
      const { message } = data as { message: string };
      showSuccessMessage(message);
      const secondsLeft = getSecondsLeft(data.resendAvailableAt);
      setSecondsLeft(secondsLeft);
    },
  });

  const { mutate: verifyUserMutation } = useMutation({
    mutationKey: ["verify-user", email, otpCode],
    mutationFn: verifyUser,
    onError: (error) => {
      showErrorMessage(error);
    },
    onSuccess: async (data) => {
      const { message } = data as { message: string };
      showSuccessMessage(message);
      router.replace("/chats");
    },
  });

  const handleSubmit = useCallback(() => {
    if (!email) return;
    verifyUserMutation({ email, otp: otpCode });
  }, [email, otpCode, verifyUserMutation]);
  useEffect(() => {
    if (otpCode.length === OTP_LENGTH) {
      handleSubmit();
    }
  }, [otpCode, handleSubmit]);

  useEffect(() => {
    const handleSetEmail = () => {
      if (!sessionStorage) return;
      const email = sessionStorage.getItem("verification-email");

      if (!email) return;

      setEmail(email);
    };
    handleSetEmail();
  }, []);

  if (!email) {
    showErrorMessage("Verification Email is required");
    return <div>Verification Email is Null</div>;
  }

  const [localPart, domain] = email.split("@");

  return (
    <Card className=" text-white min-w-90 w-full sm:w-fit max-w-xl sm:h-fit h-full    ">
      <CardHeader>
        <CardTitle className="text-xl font-bold ">Verify Your Email</CardTitle>
        <CardDescription>
          We’ve sent a 6-digit verification code to {localPart.slice(0, 5)}
          **@{domain}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <label className="font-semibold">Verification Code</label>
        <OtpInput length={OTP_LENGTH} setOtpCode={setOtpCode} />
      </CardContent>

      <CardFooter className="flex flex-col gap-4 justify-start items-start">
        <p>Code expires in 5 minutes.</p>
        <p>
          {" "}
          Didn&apos;t receive Code?&nbsp;
          <button
            className={`text-blue-400  font-semibold  ${secondsLeft > 0 ? "cursor-not-allowed text-white" : "cursor-pointer hover:underline"}`}
            onClick={() => {
              resendOtp(email);
            }}
            disabled={secondsLeft > 0}
            aria-disabled={secondsLeft > 0}
          >
            {" "}
            {secondsLeft > 0 ? `resend in ${secondsLeft}` : "Resend"}
          </button>
        </p>
      </CardFooter>
    </Card>
  );
};

export default VerificationForm;
