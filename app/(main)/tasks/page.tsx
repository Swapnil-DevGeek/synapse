'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { TasksDataTable } from '@/components/features/tasks/TasksDataTable';
import { TaskFormSheet } from '@/components/features/tasks/TaskFormSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search } from 'lucide-react';

// Types
interface Task {
  _id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'To Do' | 'In Progress' | 'Done';
  dueDate?: string;
  subtasks: Array<{
    _id: string;
    title: string;
    isCompleted: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TasksPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Initialize filters from URL parameters
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    const taskId = searchParams.get('taskId');
    
    if (filterParam) {
      // Handle different filter formats from dashboard
      if (filterParam === 'priority:High') {
        setPriorityFilter('High');
      } else if (filterParam === 'deadline:week') {
        // Sort by due date for deadline view
        setSortBy('dueDate');
        setSortOrder('asc');
        setStatusFilter('To Do'); // Show only incomplete tasks
      } else if (filterParam === 'completed') {
        setStatusFilter('Done');
        setSortBy('updatedAt');
        setSortOrder('desc');
      }
    }
    
    // If taskId is provided, we could highlight or scroll to that task
    // For now, we'll just clear the URL parameter
    if (taskId) {
      const url = new URL(window.location.href);
      url.searchParams.delete('taskId');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (statusFilter !== 'all') queryParams.set('status', statusFilter);
  if (priorityFilter !== 'all') queryParams.set('priority', priorityFilter);
  queryParams.set('sortBy', sortBy);
  queryParams.set('sortOrder', sortOrder);

  // Fetch tasks with SWR
  const { data, error, isLoading, mutate } = useSWR(
    `/api/tasks?${queryParams.toString()}`,
    fetcher
  );

  // Filter tasks by search query locally
  const filteredTasks = data?.success && data.data ? 
    data.data.filter((task: Task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsCreateSheetOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsCreateSheetOpen(true);
  };

  const handleTaskUpdated = () => {
    // Refresh the task list
    mutate();
    setIsCreateSheetOpen(false);
    setSelectedTask(null);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load tasks</p>
          <Button 
            variant="outline" 
            onClick={() => mutate()}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage your tasks and stay organized
          </p>
        </div>
        <Button onClick={handleCreateTask} className="gap-2 transition-all duration-200 hover:scale-105">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="To Do">To Do</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
          const [field, order] = value.split('-');
          setSortBy(field);
          setSortOrder(order);
        }}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Newest First</SelectItem>
            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
            <SelectItem value="dueDate-asc">Due Date (Soon)</SelectItem>
            <SelectItem value="dueDate-desc">Due Date (Later)</SelectItem>
            <SelectItem value="title-asc">Title A-Z</SelectItem>
            <SelectItem value="title-desc">Title Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Table */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <TasksDataTable 
          tasks={filteredTasks}
          onEditTask={handleEditTask}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {/* Task Form Sheet */}
      <TaskFormSheet
        open={isCreateSheetOpen}
        onOpenChange={setIsCreateSheetOpen}
        task={selectedTask}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
} 