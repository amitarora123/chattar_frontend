"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomFormField from "../form/CustomFormField";
import { Button } from "../ui/button";
import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "@/lib/api/auth.api";
import { AxiosError } from "axios";
import { useEffect } from "react";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be of minimum 6 length"),
    confirmPassword: z.string(),
    token: z.jwt(),
  })
  .superRefine((data, ctx) => {
    const { password, confirmPassword } = data;

    // 1. Uppercase check
    if (!/[A-Z]/.test(password)) {
      ctx.addIssue({
        code: "custom",
        message: "Password must contain at least one uppercase letter",
        path: ["password"],
      });
      return; // stop further checks
    }

    // 2. Lowercase check
    if (!/[a-z]/.test(password)) {
      ctx.addIssue({
        code: "custom",
        message: "Password must contain at least one lowercase letter",
        path: ["password"],
      });
      return;
    }

    // 3. Number check
    if (!/\d/.test(password)) {
      ctx.addIssue({
        code: "custom",
        message: "Password must contain at least one number",
        path: ["password"],
      });
      return;
    }

    // 4. Special character check
    if (!/[@$!%*?&^#()[\]{}\-_=+|;:,.<>/?]/.test(password)) {
      ctx.addIssue({
        code: "custom",
        message: "Password must contain at least one special character",
        path: ["password"],
      });
      return;
    }

    // 5. Confirm password match (only if password valid)
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const resetPasswordForm = useForm<ResetPasswordSchema>({
    defaultValues: {
      password: "",
      confirmPassword: "",
      token: "",
    },
    resolver: zodResolver(resetPasswordSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: ResetPasswordSchema) =>
      await resetPassword({ ...data, newPassword: data.password }),
    mutationKey: ["reset-password"],
    onSuccess: () => {
      toast.success("password reset successfully Please Sign in to continue");
      resetPasswordForm.reset();
      router.replace("/auth/sign-in");
    },
    onError: (error) => {
      const axiosError = error as AxiosError;
      const { message } = axiosError?.response?.data as { message: string };
      toast.error(message || "Internal Server Error");
    },
  });

  const handleSignUp = async (data: ResetPasswordSchema) => {
    if (data.password != data.confirmPassword) {
      toast.info("confirm password must match");
    }
    mutate(data);
  };

  useEffect(() => {
    if (!token) {
      toast.error("token is required");
      return;
    }
    resetPasswordForm.setValue("token", token);
  }, [token, resetPasswordForm]);

  return (
    <Card className=" rounded-sm  min-w-90 w-full sm:w-fit max-w-xl sm:h-fit h-full   text-white ">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Reset Your Password</CardTitle>
        <CardDescription>
          Create a new password for your account. Make sure it’s strong and secure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-signIn"
          className="flex flex-col gap-5"
          onSubmit={resetPasswordForm.handleSubmit(handleSignUp)}
        >
          <CustomFormField
            control={resetPasswordForm.control}
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password"
          />

          <CustomFormField
            control={resetPasswordForm.control}
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
          />

          <Button
            type="submit"
            disabled={isPending}
            className="bg-authBtn text-white cursor-pointer hover:bg-authBtn hover:opacity-85"
          >
            {isPending ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ResetPasswordForm;
