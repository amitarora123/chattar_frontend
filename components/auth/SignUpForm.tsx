'use client';

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
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import CustomFormField from '../form/CustomFormField';
import { Button } from '../ui/button';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { SignUpProps } from '@/types/auth.types';
import { checkUsernameUniqueness, signUp } from '@/lib/actions/user';
import { AxiosError } from 'axios';
import { Check, Loader2, X } from 'lucide-react';
import useDebounce from '@/hooks/useDebounce';

const signUpSchema = z.object({
  username: z.string().min(4, 'Username must be of minimum 4 length'),
  email: z.email(),
  password: z.string().min(6, 'Password must be of minimum 6 length'),
  confirmPassword: z.string().min(6, 'Password must be of minimum 6 length'),
});

type SignUpSchema = z.infer<typeof signUpSchema>;

const SignUpForm = () => {
  const router = useRouter();

  const signUpForm = useForm<SignUpSchema>({
    defaultValues: {
      email: '',
      password: '',
      username: '',
      confirmPassword: '',
    },
    resolver: zodResolver(signUpSchema),
  });

  const username = useWatch({
    control: signUpForm.control,
    name: 'username',
  });
  const debouncedUsername = useDebounce(username, 500);

  const {
    data: isUsernameUnique,
    isLoading: usernameLoading,
    isEnabled,
  } = useQuery({
    queryKey: ['user', debouncedUsername],
    queryFn: async () => await checkUsernameUniqueness(debouncedUsername),
    enabled: debouncedUsername.length > 3,
    retry: false,
  });
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: SignUpProps) => await signUp(data),
    mutationKey: ['sign-up'],
    onSuccess: (data) => {
      toast.success('Sign Up Successful\nPlease verify to continue');
      router.replace(`/auth/verify/${data._id}`);
    },
    onError: (error) => {
      const axiosError = error as AxiosError;
      const { message } = axiosError?.response?.data as { message: string };
      toast.error(message || 'Internal Server Error');
    },
  });

  const handleSignUp = async (data: SignUpSchema) => {
    if (data.password != data.confirmPassword) {
      toast.info('confirm password must match');
    }
    mutate(data);
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
            className="bg-authBtn text-white opacity-70 hover:bg-authBtn hover:opacity-65"
          >
            {isPending ? 'Signing up' : 'Sign Up'}
          </Button>
        </form>
        <CardFooter className="p-0 mt-5 ">
          <p className="font-bold text-sm">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/sign-in"
              className="text-blue-400 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </CardFooter>
      </CardContent>
    </Card>
  );
};

export default SignUpForm;
