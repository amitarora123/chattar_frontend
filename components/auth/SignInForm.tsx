"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomFormField from "../form/CustomFormField";
import { Button } from "../ui/button";
import Link from "next/link";
import { useState } from "react";
import GoogleLoginButton from "./GoogleLogin";
import { useMutation } from "@tanstack/react-query";
import { signIn } from "@/lib/api/auth.api";
import { showErrorMessage, showSuccessMessage } from "@/lib/utils";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "Password must be of minimum 6 length"),
});

type SignInSchema = z.infer<typeof signInSchema>;

const SignInForm = () => {
  const router = useRouter();

  const signInForm = useForm<SignInSchema>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(signInSchema),
  });

  const signInMutation = useMutation({
    mutationKey: ["sign-in"],
    mutationFn: signIn,
    onSuccess: () => {
      router.replace("/chats");
    },
    onError: (error) => {
      showErrorMessage(error);
    },
  });

  const handleSignIn = async (data: SignInSchema) => {
    signInMutation.mutate(data);
  };

  return (
    <Card className=" rounded-sm min-w-90 w-full sm:w-fit max-w-xl sm:h-fit h-full   text-white  ">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Sign In</CardTitle>
        <CardDescription>Welcome back to Chattar</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-signIn"
          className="flex flex-col gap-5"
          onSubmit={signInForm.handleSubmit(handleSignIn)}
        >
          <CustomFormField
            control={signInForm.control}
            label="Email"
            type="email"
            name="email"
            placeholder="Enter your email"
          />

          <CustomFormField
            control={signInForm.control}
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password"
          />

          <Button
            type="submit"
            className="bg-authBtn text-white cursor-pointer hover:bg-authBtn hover:opacity-85"
            onClick={() => signInForm.handleSubmit(handleSignIn)}
            disabled={signInMutation.isPending}
          >
            {signInMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <CardFooter className="p-0 mt-5 flex flex-col gap-3 items-start">
          <GoogleLoginButton />
          <p className="font-bold text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="text-blue-400 hover:underline">
              Sign Up
            </Link>
          </p>
          <p className="font-bold text-sm">
            <Link href="/auth/forgot-password" className="text-blue-400 hover:underline">
              Forgot Password
            </Link>
          </p>
        </CardFooter>
      </CardContent>
    </Card>
  );
};

export default SignInForm;
