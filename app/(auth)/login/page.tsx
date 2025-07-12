import Link from "next/link";
import { AuthForm } from "@/components/features/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>
      
      <AuthForm mode="login" />
      
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Don't have an account? </span>
        <Link
          href="/signup"
          className="text-primary font-medium hover:underline transition-colors"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
} 