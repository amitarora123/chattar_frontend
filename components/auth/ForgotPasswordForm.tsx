'use client';

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
import { useMutation } from '@tanstack/react-query';
import { forgotPassword } from '@/lib/actions/user';
import { AxiosError } from 'axios';

const forgotPasswordSchema = z.object({
  email: z.email(),
});

type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordForm = () => {
  const forgotPasswordForm = useForm<ForgotPasswordSchema>({
    defaultValues: {
      email: '',
    },
    resolver: zodResolver(forgotPasswordSchema),
  });

  const { mutate: forgotPasswordMutation, isPending } = useMutation({
    mutationFn: async ({ email }: ForgotPasswordSchema) =>
      await forgotPassword(email),

    mutationKey: ['forgot-password'],
    onSuccess: (data) => {
      toast.success(data.message || 'If an account exists, reset link sent');
      forgotPasswordForm.reset();
    },
    onError: (error) => {
      const axiosError = error as AxiosError;
      const { message } = axiosError?.response?.data as { message: string };
      toast.error(message || 'Internal Server Error');
    },
  });

  return (
    <Card className=" rounded-sm  text-white min-w-80 sm:min-w-90">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Forgot Password</CardTitle>
        <CardDescription>
          No worries — enter your email and we’ll send you a secure link to
          reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-signIn"
          className="flex flex-col gap-5"
          onSubmit={forgotPasswordForm.handleSubmit((data) =>
            forgotPasswordMutation(data),
          )}
        >
          <CustomFormField
            control={forgotPasswordForm.control}
            label="Email"
            type="email"
            name="email"
            placeholder="Enter your email"
          />

          <Button
            type="submit"
            className="bg-authBtn text-white cursor-pointer hover:bg-authBtn hover:opacity-85"
            onClick={() =>
              forgotPasswordForm.handleSubmit((data) =>
                forgotPasswordMutation(data),
              )
            }
            disabled={isPending}
          >
            {isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
        <CardFooter className="p-0 mt-5 flex flex-col gap-3 items-start">
          <p className="font-bold text-sm">
            <Link
              href="/auth/sign-in"
              className="text-blue-400 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordForm;
