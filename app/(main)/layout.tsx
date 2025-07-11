import { ReactNode } from "react";
import { MainSidebar } from "@/components/shared/MainSidebar";
import { MainHeader } from "@/components/shared/MainHeader";
import { SidebarProvider } from "@/contexts/SidebarContext";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
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
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
} 