import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ confirmed?: string }>;
}) {
  const params = await searchParams;
  return <AuthForm mode="login" notice={params.confirmed === "1" ? "Email confirmed — log in to start building your career." : null} />;
}
