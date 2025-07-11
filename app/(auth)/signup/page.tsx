import Link from "next/link";
import { AuthForm } from "@/components/features/auth/AuthForm";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <AuthForm mode="signup" />
      
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link
          href="/login"
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </Link>
      </div>
      
      <div className="text-center text-xs text-muted-foreground">
        By signing up, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
} 