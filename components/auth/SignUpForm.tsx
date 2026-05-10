"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomFormField from "../form/CustomFormField";
import { Button } from "../ui/button";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SignUpProps } from "@/types/auth.types";
import { checkUsernameUniqueness } from "@/lib/api/user.api";
import { Check, Loader2, X } from "lucide-react";
import useDebounce from "@/hooks/useDebounce";
import GoogleLoginButton from "./GoogleLogin";
import { showErrorMessage, showSuccessMessage } from "@/lib/utils";
import { signUp } from "@/lib/api/auth.api";

const signUpSchema = z
  .object({
    username: z.string().min(4, "Username must be at least 4 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
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

type SignUpSchema = z.infer<typeof signUpSchema>;

const SignUpForm = () => {
  const router = useRouter();

  const signUpForm = useForm<SignUpSchema>({
    defaultValues: {
      email: "",
      password: "",
      username: "",
      confirmPassword: "",
    },
    resolver: zodResolver(signUpSchema),
  });

  const username = useWatch({
    control: signUpForm.control,
    name: "username",
  });
  const debouncedUsername = useDebounce(username, 500);

  const {
    data: isUsernameUnique,
    isLoading: usernameLoading,
    isEnabled,
  } = useQuery({
    queryKey: ["user", debouncedUsername],
    queryFn: async () => await checkUsernameUniqueness(debouncedUsername),
    enabled: debouncedUsername.length > 3,
    retry: false,
  });
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: SignUpProps) => await signUp(data),
    mutationKey: ["sign-up"],
    onSuccess: (data) => {
      showSuccessMessage("Sign Up Successful\nPlease verify to continue");
      sessionStorage.setItem("verification-email", signUpForm.getValues("email"));
      signUpForm.reset();
      router.replace(`/auth/verify/${data._id}`);
    },
    onError: (error) => {
      showErrorMessage(error);
    },
  });

  const handleSignUp = async (data: SignUpSchema) => {
    if (data.password != data.confirmPassword) {
      toast.info("confirm password must match");
    }
    mutate(data);
  };

  return (
    <Card className=" rounded-sm  min-w-90 w-full sm:w-fit max-w-xl sm:h-fit h-full   text-white ">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Sign Up</CardTitle>
        <CardDescription>Get Started with Chattar</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-signIn"
          className="flex flex-col gap-5"
          onSubmit={signUpForm.handleSubmit(handleSignUp)}
        >
          <div>
            <CustomFormField
              control={signUpForm.control}
              label={
                <p className="w-full flex items-center justify-between">
                  <span>Username</span>
                  {isEnabled &&
                    (usernameLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : isUsernameUnique ? (
                      <span className="text-green-400 flex justify-center items-center gap-2">
                        Username is available <Check />
                      </span>
                    ) : (
                      <span className="text-red-400 flex justify-center items-center gap-2">
                        Username is not available <X />
                      </span>
                    ))}
                </p>
              }
              type="text"
              name="username"
              placeholder="Enter your username"
            />
          </div>

          <CustomFormField
            control={signUpForm.control}
            label="Email"
            type="email"
            name="email"
            placeholder="Enter your email"
          />

          <CustomFormField
            control={signUpForm.control}
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password"
          />

          <CustomFormField
            control={signUpForm.control}
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
            {isPending ? "Signing up..." : "Sign Up"}
          </Button>
        </form>
        <CardFooter className="p-0 mt-5 flex flex-col gap-3 items-start">
          <GoogleLoginButton />
          <p className="font-bold text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-in" className="text-blue-400 hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </CardContent>
    </Card>
  );
};

export default SignUpForm;
