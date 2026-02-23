'use client';

import { useRef, useState } from 'react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getUserDetails, resendVerificationOtp } from '@/lib/actions/user';

const OTP_LENGTH = 6;

const OtpInputForm = ({ user_id }: { user_id: string }) => {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const { data: user } = useQuery({
    queryKey: [user_id, 'user-details'],
    queryFn: async () => await getUserDetails(user_id),
  });

  const email = user?.email ?? '';
  const [localPart, domain] = email.split('@');

  const { mutate } = useMutation({
    mutationKey: ['resend-otp', user_id],
    mutationFn: async (user_id: string) => await resendVerificationOtp(user_id),
  });

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, OTP_LENGTH);

    if (!/^\d+$/.test(pasted)) return;

    const newOtp = pasted.split('');
    setOtp(newOtp);

    newOtp.forEach((digit, i) => {
      if (inputsRef.current[i]) {
        inputsRef.current[i]!.value = digit;
      }
    });
  };

  const handleSubmit = () => {
    const finalOtp = otp.join('');
    console.log('OTP:', finalOtp);
  };

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
        <div className="flex gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-2xl font-bold rounded-md bg-authBg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-authBtn"
            />
          ))}
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full bg-authBtn text-white hover:opacity-90"
        >
          Verify
        </Button>
      </CardContent>

      <CardFooter>
        <p>
          {' '}
          Did&apos;t receive Code?
          <button
            className="text-blue-400 hover:underline font-semibold cursor-pointer"
            onClick={() => mutate(user_id)}
          >
            Resend
          </button>
        </p>
      </CardFooter>
    </Card>
  );
};

export default OtpInputForm;
