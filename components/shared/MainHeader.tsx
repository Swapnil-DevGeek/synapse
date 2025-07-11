"use client";

import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { User, Settings } from "lucide-react";

export function MainHeader() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left side - could be breadcrumbs or page title */}
        <div className="flex items-center space-x-4">
          {/* This can be expanded later for breadcrumbs */}
        </div>

        {/* Right side - user actions */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {/* User profile button - placeholder for now */}
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="icon">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
} 