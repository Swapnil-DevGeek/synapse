import { ReactNode } from "react";
import { MainSidebar } from "@/components/shared/MainSidebar";
import { MainHeader } from "@/components/shared/MainHeader";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Main application container */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <MainSidebar />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <MainHeader />
          
          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 