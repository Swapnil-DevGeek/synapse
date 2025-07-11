import Link from "next/link";
import { AuthForm } from "@/components/features/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <AuthForm mode="login" />
      
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Don't have an account? </span>
        <Link
          href="/signup"
          className="text-primary font-medium hover:underline"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
} 