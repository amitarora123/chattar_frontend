import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Suspense } from "react";
const ResetPasswordPage = () => {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
};
export default ResetPasswordPage;
