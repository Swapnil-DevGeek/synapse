import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Centered authentication container */}
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
} 