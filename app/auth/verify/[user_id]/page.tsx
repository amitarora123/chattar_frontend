import VerificationForm from "@/components/auth/VerificationForm";

interface VerifyPageProps {
  params: Promise<{
    user_id: string;
  }>;
}

export default async function Verify({ params }: VerifyPageProps) {
  const { user_id } = await params;

  return <VerificationForm user_id={user_id} />;
}
