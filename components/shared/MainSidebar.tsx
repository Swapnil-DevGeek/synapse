"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  GitBranch,
  Brain
} from "lucide-react";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "Notes",
    href: "/notes",
    icon: FileText,
  },
  {
    title: "Graph View",
    href: "/graph",
    icon: GitBranch,
  },
];

export function MainSidebar() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  return (
    <div className={cn(
      "bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className={cn(
          "border-b border-sidebar-border transition-all duration-300",
          isCollapsed ? "p-3" : "p-6"
        )}>
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Brain className={cn(
              "text-primary transition-all duration-300",
              isCollapsed ? "h-6 w-6" : "h-8 w-8"
            )} />
            {!isCollapsed && (
              <span className="text-xl font-bold text-sidebar-foreground transition-opacity duration-300">
                Synapse
              </span>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className={cn(
          "flex-1 space-y-2 transition-all duration-300",
          isCollapsed ? "p-2" : "p-4"
        )}>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg transition-all duration-300",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground",
                  isCollapsed ? "px-2 py-3 justify-center" : "px-3 py-2 space-x-3"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium transition-opacity duration-300">
                    {item.title}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 