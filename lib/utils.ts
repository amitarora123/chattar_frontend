import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import crypto from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getSecondsLeft = (timestamp: Date | string) => {
  const expiryTime = new Date(timestamp).getTime();
  const now = Date.now();

  const diff = Math.floor((expiryTime - now) / 1000);

  return Math.max(0, diff);
};

export const generateOtp = () => {
  return crypto.randomInt(100000, 1000000);
};

export const generateExpiresIn = (minutes: number) => {
  return Date.now() + minutes * 60 * 1000;
};

