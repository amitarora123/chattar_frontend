'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getUserDetails,
  resendVerificationOtp,
  verifyUser,
} from '@/lib/actions/user';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import OtpInput from '../form/OtpInput';
import { useTimer } from '@/hooks/useTimer';
import { getSecondsLeft } from '@/lib/utils';

const OTP_LENGTH = 6;

const VerificationForm = ({ user_id }: { user_id: string }) => {
  const { update } = useSession();
  const router = useRouter();

  const [otpCode, setOtpCode] = useState<string>('');

  const { secondsLeft, setSecondsLeft } = useTimer();

  const { data: user } = useQuery({
    queryKey: [user_id, 'user-details'],
    queryFn: async () => await getUserDetails(user_id),
  });

  const { mutate: resendOtp } = useMutation({
    mutationKey: ['resend-otp', user_id],
    mutationFn: async (user_id: string) => await resendVerificationOtp(user_id),
    onError: (error) => {
      const axiosError = error as AxiosError;
      const { message } = (axiosError?.response?.data || {}) as {
        message: string;
      };

      toast.error(message || 'Internal Server Error');
    },
    onSuccess: (data) => {
      const { message } = data as { message: string };
      toast.success(message || 'Otp Resend Successfully');
      const secondsLeft = getSecondsLeft(data.resendAvailableAt);
      setSecondsLeft(secondsLeft);
    },
  });

  const { mutate: verifyUserMutation } = useMutation({
    mutationKey: ['verify-user', user_id, otpCode],
    mutationFn: async ({ user_id, code }: { user_id: string; code: string }) =>
      await verifyUser(user_id, code),
    onError: (error) => {
      const axiosError = error as AxiosError;
      const { message } = (axiosError?.response?.data || {}) as {
        message: string;
      };

      toast.error(message || 'Internal Server Error');
    },
    onSuccess: async (data) => {
      const { message } = data as { message: string };
      await update({
        isVerified: true,
      });
      toast.success(message || 'User Verified Successfully');
      router.replace('/chats');
    },
  });

  const handleSubmit = useCallback(() => {
    verifyUserMutation({ user_id, code: otpCode });
  }, [user_id, otpCode, verifyUserMutation]);

  useEffect(() => {
    if (otpCode.length === OTP_LENGTH) {
      handleSubmit();
    }
  }, [otpCode, handleSubmit]);

  useEffect(() => {
    if (!user?.otp) return;
    const secondsLeft = getSecondsLeft(user.otp.resendAvailableAt);
    setSecondsLeft(secondsLeft);
  }, [user?.otp, setSecondsLeft]);

  const email = user?.email ?? '';
  const [localPart, domain] = email.split('@');

  return (
    <Card className="auth-card text-white min-w-80 sm:min-w-md ">
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
          {' '}
          Didn&apos;t receive Code?&nbsp;
          <button
            className={`text-blue-400  font-semibold  ${secondsLeft > 0 ? 'cursor-not-allowed text-white' : 'cursor-pointer hover:underline'}`}
            onClick={() => {
              resendOtp(user_id);
            }}
            disabled={secondsLeft > 0}
            aria-disabled={secondsLeft > 0}
          >
            {' '}
            {secondsLeft > 0 ? `resend in ${secondsLeft}` : 'Resend'}
          </button>
        </p>
      </CardFooter>
    </Card>
  );
};

export default VerificationForm;
