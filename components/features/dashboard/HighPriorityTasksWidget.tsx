'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Plus, Calendar, CheckCircle2 } from "lucide-react";
import { DashboardTask } from "@/types/dashboard";
import Link from "next/link";

interface HighPriorityTasksWidgetProps {
  tasks: DashboardTask[];
  isLoading?: boolean;
  onCreateTask?: () => void;
}

const priorityColors = {
  High: 'bg-red-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-green-500'
};

const statusColors = {
  'To Do': 'bg-gray-500',
  'In Progress': 'bg-blue-500',
  'Done': 'bg-green-500'
};

export function HighPriorityTasksWidget({ 
  tasks, 
  isLoading = false, 
  onCreateTask 
}: HighPriorityTasksWidgetProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          High Priority Tasks
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCreateTask}
          className="h-8 px-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          New
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground mb-3">
              No high priority tasks! You're on top of things.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCreateTask}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Create Task
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Link 
                key={task._id} 
                href={`/tasks?taskId=${task._id}`}
                className="block group"
              >
                <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm truncate flex-1 group-hover:text-primary transition-colors">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-1 ml-2">
                      {task.isOverdue && (
                        <Badge variant="destructive" className="text-xs px-1 py-0">
                          Overdue
                        </Badge>
                      )}
                      <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-0 ${statusColors[task.status]} text-white border-none`}
                    >
                      {task.status}
                    </Badge>
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className={task.isOverdue ? 'text-red-500' : ''}>
                          {task.daysUntilDue !== null && task.daysUntilDue >= 0 
                            ? `${task.daysUntilDue}d left`
                            : `${Math.abs(task.daysUntilDue || 0)}d overdue`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {task.totalSubtasks > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{task.completedSubtasks}/{task.totalSubtasks} subtasks</span>
                      </div>
                      <Progress 
                        value={(task.completedSubtasks / task.totalSubtasks) * 100} 
                        className="h-1.5"
                      />
                    </div>
                  )}
                </div>
              </Link>
            ))}
            {tasks.length >= 5 && (
              <div className="pt-2 border-t">
                <Link href="/tasks?filter=priority:High">
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    View All High Priority
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 