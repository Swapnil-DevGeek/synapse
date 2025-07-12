'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Plus } from "lucide-react";
import { DashboardData } from "@/types/dashboard";
import { RecentNotesWidget } from "@/components/features/dashboard/RecentNotesWidget";
import { HighPriorityTasksWidget } from "@/components/features/dashboard/HighPriorityTasksWidget";
import { ApproachingDeadlinesWidget } from "@/components/features/dashboard/ApproachingDeadlinesWidget";
import { StatsWidget } from "@/components/features/dashboard/StatsWidget";
import { QuickActions } from "@/components/features/dashboard/QuickActions";
import { TaskFormSheet } from "@/components/features/tasks/TaskFormSheet";
import { useRouter } from 'next/navigation';

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return res.json();
};

export default function DashboardPage() {
  const router = useRouter();
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  
  // Fetch dashboard data with SWR
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: DashboardData;
  }>('/api/dashboard', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
  });

  const handleCreateNote = () => {
    // Navigate to notes page and trigger note creation
    router.push('/notes?action=new');
  };

  const handleCreateTask = () => {
    setIsTaskSheetOpen(true);
  };

  const handleTaskCreated = () => {
    // Refresh dashboard data when a task is created
    mutate();
    setIsTaskSheetOpen(false);
  };

  const handleRefresh = () => {
    mutate();
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load dashboard data. Please try again.
            </AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const dashboardData = data?.data;
  const stats = dashboardData?.stats || { activeTasks: 0, totalNotes: 0, completedThisWeek: 0 };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Header with welcome message */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here&apos;s what&apos;s happening with your work.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleCreateNote}>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Overview</h2>
          <StatsWidget stats={stats} isLoading={isLoading} />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <QuickActions 
            onCreateNote={handleCreateNote}
            onCreateTask={handleCreateTask}
          />
        </div>

        {/* Main Dashboard Widgets */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Your Work</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Notes Widget */}
            <RecentNotesWidget
              notes={dashboardData?.recentNotes || []}
              isLoading={isLoading}
              onCreateNote={handleCreateNote}
            />

            {/* High Priority Tasks Widget */}
            <HighPriorityTasksWidget
              tasks={dashboardData?.highPriorityTasks || []}
              isLoading={isLoading}
              onCreateTask={handleCreateTask}
            />

            {/* Approaching Deadlines Widget */}
            <ApproachingDeadlinesWidget
              tasks={dashboardData?.approachingDeadlines || []}
              isLoading={isLoading}
              onCreateTask={handleCreateTask}
            />
          </div>
        </div>

        {/* Motivational footer */}
        {!isLoading && dashboardData && (
          <div className="pt-8 border-t">
            <div className="text-center space-y-2">
              {stats.activeTasks === 0 && stats.totalNotes > 0 ? (
                <p className="text-sm text-muted-foreground">
                  🎉 All caught up! Time to create some new notes or plan your next project.
                </p>
              ) : stats.activeTasks > 0 ? (
                <p className="text-sm text-muted-foreground">
                  💪 You have {stats.activeTasks} active tasks. Keep up the great work!
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  ✨ Ready to get started? Create your first note or task above.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Creation Sheet */}
      <TaskFormSheet
        open={isTaskSheetOpen}
        onOpenChange={setIsTaskSheetOpen}
        onTaskUpdated={handleTaskCreated}
      />
    </div>
  );
} 