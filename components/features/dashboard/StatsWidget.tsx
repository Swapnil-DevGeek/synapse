'use client';

import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare, FileText, TrendingUp, Brain } from "lucide-react";
import { DashboardStats } from "@/types/dashboard";
import Link from "next/link";

interface StatsWidgetProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export function StatsWidget({ stats, isLoading = false }: StatsWidgetProps) {
  const statsData = [
    {
      title: "Active Tasks",
      value: stats.activeTasks,
      icon: CheckSquare,
      href: "/tasks",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      title: "Total Notes",
      value: stats.totalNotes,
      icon: FileText,
      href: "/notes",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    },
    {
      title: "Completed This Week",
      value: stats.completedThisWeek,
      icon: TrendingUp,
      href: "/tasks?filter=completed",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      title: "Knowledge Graph",
      value: "View",
      icon: Brain,
      href: "/graph",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat, index) => {
        const IconComponent = stat.icon;
        
        return (
          <Link key={index} href={stat.href} className="group">
            <Card className={`transition-all duration-200 hover:shadow-md hover:scale-105 ${stat.bgColor} border-none`}>
              <CardContent className="p-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
                    <div className="h-6 bg-muted rounded w-12 animate-pulse"></div>
                    <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <IconComponent className={`h-8 w-8 ${stat.color} group-hover:scale-110 transition-transform duration-200`} />
                    <div className="space-y-1">
                      <div className={`text-2xl font-bold ${stat.color}`}>
                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {stat.title}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
} 