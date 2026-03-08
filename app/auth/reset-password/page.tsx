import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { Suspense } from 'react';
const ResetPasswordPage = () => {
  return (
    <div className=" w-full h-screen flex justify-center items-center">
      <Suspense fallback={<p>Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
};
export default ResetPasswordPage;
