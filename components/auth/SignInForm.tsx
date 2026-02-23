'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import CustomFormField from '../form/CustomFormField';
import { Button } from '../ui/button';
import Link from 'next/link';

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(6, 'Password must be of minimum 6 length'),
});

type SignInSchema = z.infer<typeof signInSchema>;

const SignInForm = () => {
  const router = useRouter();

  const signInForm = useForm<SignInSchema>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(signInSchema),
  });

  const handleSignIn = async ({ email, password }: SignInSchema) => {
    console.log('sign in called');
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (res.ok) router.replace('/chats');
      if (res.error) {
        toast.error(res.code);
      }
    } catch (error) {
      console.log(error);
      const { message } = error as { message: string };
      toast.error(message || 'Internal Server Error');
    }
  };

  return (
    <Card className="auth-card rounded-sm  text-white min-w-80 sm:min-w-90">
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
            className="bg-authBtn text-white opacity-70 hover:bg-authBtn hover:opacity-65"
            onClick={() => signInForm.handleSubmit(handleSignIn)}
          >
            Sign in
          </Button>
        </form>
        <CardFooter className="p-0 mt-5 ">
          <p className="font-bold text-sm">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/sign-up"
              className="text-blue-400 hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </CardContent>
    </Card>
  );
};

export default SignInForm;
