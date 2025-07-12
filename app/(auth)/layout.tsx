import { ReactNode } from "react";
import { Brain } from "lucide-react";
import Link from "next/link";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5" />
      
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>
      
      {/* Header with logo */}
      <div className="relative z-10 p-6">
        <Link href="/" className="flex items-center space-x-2 w-fit">
          <Brain className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Synapse
          </span>
        </Link>
      </div>
      
      {/* Centered authentication container */}
      <div className="flex items-center justify-center min-h-screen p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Card with backdrop blur */}
          <div className="bg-card/80 backdrop-blur-sm border rounded-lg shadow-lg p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 