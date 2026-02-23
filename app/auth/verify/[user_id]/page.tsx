import OtpInputForm from '@/components/auth/OtpInput';

interface VerifyPageProps {
  params: Promise<{
    user_id: string;
  }>;
}

export default async function Verify({ params }: VerifyPageProps) {
  const { user_id } = await params;

  return (
    <div className="w-full h-screen flex items-center justify-center ">
      <OtpInputForm user_id={user_id} />
    </div>
  );
}
