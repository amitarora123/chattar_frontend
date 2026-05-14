import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";
import { AxiosError } from "axios";
import { toast } from "sonner";

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

export const getMessageDateTimeStamp = (dateString: string): string => {
  const inputDate = new Date(dateString);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfToday.getDate() - 1);

  const diffInMs = now.getTime() - inputDate.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  // ✅ If today → return hh:mm AM/PM
  if (inputDate >= startOfToday) {
    return inputDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // 👈 ensures AM/PM
    });
  }

  // ✅ If yesterday
  if (inputDate >= startOfYesterday && inputDate < startOfToday) {
    return "Yesterday";
  }

  // ✅ If within last 7 days → return weekday
  if (diffInDays < 7) {
    return inputDate.toLocaleDateString([], {
      weekday: "long",
    });
  }

  // ✅ Otherwise → return dd/mm/yyyy
  const day = String(inputDate.getDate()).padStart(2, "0");
  const month = String(inputDate.getMonth() + 1).padStart(2, "0");
  const year = inputDate.getFullYear();

  return `${day}/${month}/${year}`;
};

export const getChatKey = (user_id1: string, user_id2: string) => {
  const sortedIds = [user_id1, user_id2].sort();
  const oneToOneKey = `${sortedIds[0]}_${sortedIds[1]}`;
  return oneToOneKey;
};

export const showSuccessMessage = (message: string) => {
  toast.success(message, {
    style: {
      backgroundColor: "#0a1a0f",
      border: "1px solid #14532d",
      color: "#86efac",
    },
  });
};

export const showErrorMessage = (error: unknown | string) => {
  let message;
  if (typeof error === "string") {
    message = error;
  } else {
    const axiosError = error as AxiosError;
    message =
      (axiosError.response?.data as { message: string })?.message || (error as Error)?.message;
  }
  toast.error(message || "Something went wrong", {
    style: {
      backgroundColor: "#1a0a0a",
      border: "1px solid #7f1d1d",
      color: "#fca5a5",
    },
  });
};
