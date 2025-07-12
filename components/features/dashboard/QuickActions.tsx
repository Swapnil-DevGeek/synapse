'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckSquare, Brain, Zap } from "lucide-react";
import Link from "next/link";

interface QuickActionsProps {
  onCreateNote?: () => void;
  onCreateTask?: () => void;
}

export function QuickActions({ onCreateNote, onCreateTask }: QuickActionsProps) {
  const actions = [
    {
      title: "New Note",
      description: "Start writing and capture your thoughts",
      icon: FileText,
      onClick: onCreateNote,
      href: "/notes",
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    {
      title: "New Task",
      description: "Create a task to stay organized",
      icon: CheckSquare,
      onClick: onCreateTask,
      href: "/tasks",
      color: "text-green-600",
      bgColor: "bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40",
      borderColor: "border-green-200 dark:border-green-800"
    },
    {
      title: "View Graph",
      description: "Explore your knowledge connections",
      icon: Brain,
      href: "/graph",
      color: "text-purple-600",
      bgColor: "bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/40",
      borderColor: "border-purple-200 dark:border-purple-800"
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            
            const ActionButton = (
              <div 
                className={`
                  p-4 rounded-lg border cursor-pointer transition-all duration-200 
                  ${action.bgColor} ${action.borderColor}
                  hover:shadow-md hover:scale-105 group
                `}
                onClick={action.onClick}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`p-3 rounded-full bg-white dark:bg-gray-900 shadow-sm ${action.borderColor} border`}>
                    <IconComponent className={`h-6 w-6 ${action.color} group-hover:scale-110 transition-transform duration-200`} />
                  </div>
                  <div className="space-y-1">
                    <h3 className={`font-semibold text-sm ${action.color}`}>
                      {action.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </div>
              </div>
            );

            if (action.onClick) {
              return (
                <div key={index}>
                  {ActionButton}
                </div>
              );
            }

            return (
              <Link key={index} href={action.href!}>
                {ActionButton}
              </Link>
            );
          })}
        </div>
        
        {/* Secondary quick actions */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link href="/tasks?filter=priority:High">
                <CheckSquare className="h-3 w-3 mr-1" />
                High Priority Tasks
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link href="/notes?recent=true">
                <FileText className="h-3 w-3 mr-1" />
                Recent Notes
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link href="/graph">
                <Brain className="h-3 w-3 mr-1" />
                Knowledge Graph
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 