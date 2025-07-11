export interface DashboardNote {
  _id: string;
  title: string;
  updatedAt: Date;
  createdAt: Date;
  folder?: string;
  timeAgo: string;
  isNew: boolean;
}

export interface DashboardTask {
  _id: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'To Do' | 'In Progress' | 'Done';
  dueDate?: Date;
  subtasks?: Array<{
    _id: string;
    title: string;
    isCompleted: boolean;
  }>;
  completedSubtasks: number;
  totalSubtasks: number;
  daysUntilDue?: number | null;
  isOverdue?: boolean;
  isUrgent?: boolean;
}

export interface DashboardStats {
  activeTasks: number;
  totalNotes: number;
  completedThisWeek: number;
}

export interface DashboardData {
  recentNotes: DashboardNote[];
  highPriorityTasks: DashboardTask[];
  approachingDeadlines: DashboardTask[];
  stats: DashboardStats;
} 