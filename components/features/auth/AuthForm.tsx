"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Brain, Mail, Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Form validation schemas
const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type AuthFormData = z.infer<typeof authSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  const authForm = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onAuthSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        // For signup, use credentials provider to create account
        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          action: "signup",
          redirect: false,
        });

        if (result?.error) {
          setError(result.error);
        } else {
          // Account created successfully, now send OTP
          setUserEmail(data.email);
          await sendOTP(data.email);
          setShowOTPVerification(true);
        }
      } else {
        // For login, use credentials provider to authenticate
        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          action: "signin",
          redirect: false,
        });

        if (result?.error) {
          setError(result.error);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (_error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Auth error:", _error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (email: string) => {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to send OTP");
      }
    } catch (err) {
      console.error("sendOTP error:", err);
      setError("Failed to send verification email");
    }
  };

  const onOTPSubmit = async (data: OTPFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          email: userEmail,
          otp: data.otp,
        }),
      });

      if (response.ok) {
        // OTP verified, now sign in the user
        const result = await signIn("credentials", {
          email: userEmail,
          password: authForm.getValues("password"),
          action: "signin",
          redirect: false,
        });

        if (result?.error) {
          setError(result.error);
        } else {
          router.push("/dashboard");
        }
      } else {
        const data = await response.json();
        setError(data.error || "Invalid OTP");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err) {
      console.error("Google sign in error:", err);
      setError("Google sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (showOTPVerification) {
    return (
      <Card className="w-full py-4">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Brain className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent a 6-digit code to {userEmail}
          </CardDescription>
        </CardHeader>
        <form onSubmit={otpForm.handleSubmit(onOTPSubmit)}>
          <CardContent className="space-y-4 mb-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpForm.watch("otp")}
                  onChange={(value) => otpForm.setValue("otp", value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {otpForm.formState.errors.otp && (
                <p className="text-sm text-destructive">
                  {otpForm.formState.errors.otp.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify Email"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => sendOTP(userEmail)}
              disabled={isLoading}
            >
              Resend Code
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <Brain className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Sign in to your Synapse account"
            : "Sign up to get started with Synapse"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <Mail className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={authForm.handleSubmit(onAuthSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...authForm.register("email")}
            />
            {authForm.formState.errors.email && (
              <p className="text-sm text-destructive">
                {authForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...authForm.register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {authForm.formState.errors.password && (
              <p className="text-sm text-destructive">
                {authForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 