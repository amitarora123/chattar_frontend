'use client';
import React, { useRef, useState } from 'react';
import { Input } from '../ui/input';

const OtpInput = ({
  length,
  setOtpCode,
}: {
  length: number;
  setOtpCode: (otp: string) => void;
}) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<HTMLInputElement[]>([]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    setOtpCode(newOtp.join(''));

    if (value && index < length - 1) {
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
    const pasted = e.clipboardData.getData('text').slice(0, length);

    console.log(e.clipboardData.getData('text'));
    if (!/^\d+$/.test(pasted)) return;

    const newOtp = pasted.split('');
    setOtpCode(pasted);
    setOtp(newOtp);

    newOtp.forEach((digit, i) => {
      if (inputsRef.current[i]) {
        inputsRef.current[i]!.value = digit;
      }
    });
  };

  return (
    <div className="flex gap-5">
      {otp.map((digit, index) => (
        <Input
          key={index}
          ref={(r) => {
            inputsRef.current[index] = r!;
          }}
          type="text"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target.value, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-2xl font-bold focus:none focus-visible:none focus:ring-0 rounded-md  border   "
        />
      ))}
    </div>
  );
};

export default OtpInput;
