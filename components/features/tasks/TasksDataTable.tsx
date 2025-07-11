'use client';

import { useState } from 'react';
import { format, isValid } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

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

interface TasksDataTableProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onTaskUpdated: () => void;
}

export function TasksDataTable({ tasks, onEditTask, onTaskUpdated }: TasksDataTableProps) {
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set());

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'To Do':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Done':
        return <CheckCircle className="h-3 w-3" />;
      case 'In Progress':
        return <Clock className="h-3 w-3" />;
      case 'To Do':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'MMM d, yyyy') : '—';
  };

  const getSubtaskProgress = (subtasks: Task['subtasks']) => {
    if (!subtasks || subtasks.length === 0) return null;
    const completed = subtasks.filter(st => st.isCompleted).length;
    const total = subtasks.length;
    const percentage = (completed / total) * 100;
    
    return {
      completed,
      total,
      percentage
    };
  };

  const handleDeleteTask = async (taskId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onTaskUpdated();
      } else {
        console.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsDeleting(false);
      setDeleteTaskId(null);
    }
  };

  const handleQuickStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        onTaskUpdated();
      } else {
        console.error('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleSubtaskToggle = async (taskId: string, subtaskIndex: number, isCompleted: boolean) => {
    try {
      // Find the current task to get its subtasks
      const currentTask = tasks.find(task => task._id === taskId);
      if (!currentTask) return;

      // Create updated subtasks array
      const updatedSubtasks = currentTask.subtasks.map((subtask, index) => ({
        ...subtask,
        isCompleted: index === subtaskIndex ? isCompleted : subtask.isCompleted
      }));

      // Check if all subtasks are now completed
      const allSubtasksCompleted = updatedSubtasks.every(st => st.isCompleted);
      const hasSubtasks = updatedSubtasks.length > 0;
      
      // Determine new task status based on subtask completion and current status
      let newTaskStatus = currentTask.status;
      if (hasSubtasks && allSubtasksCompleted && currentTask.status !== 'Done') {
        // If all subtasks are completed and task is not already done, mark as done
        newTaskStatus = 'Done';
      } else if (hasSubtasks && !allSubtasksCompleted && currentTask.status === 'Done') {
        // If not all subtasks are completed but task was done, move back to in progress
        newTaskStatus = 'In Progress';
      } else if (hasSubtasks && isCompleted && currentTask.status === 'To Do') {
        // If we're completing a subtask and task is still "To Do", move to "In Progress"
        newTaskStatus = 'In Progress';
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          subtasks: updatedSubtasks,
          ...(newTaskStatus !== currentTask.status && { status: newTaskStatus })
        }),
      });

      if (response.ok) {
        onTaskUpdated();
        
        // Show toast notification based on the action and status change
        if (isCompleted) {
          toast.success(`Subtask completed!`, {
            description: `"${updatedSubtasks[subtaskIndex].title}" marked as done`,
          });
          
          if (newTaskStatus === 'Done' && currentTask.status !== 'Done') {
            toast.success(`🎉 Task completed!`, {
              description: `"${currentTask.title}" - all subtasks finished`,
            });
          } else if (newTaskStatus === 'In Progress' && currentTask.status === 'To Do') {
            toast.info(`Task in progress`, {
              description: `"${currentTask.title}" moved to In Progress`,
            });
          }
        } else {
          toast(`Subtask unchecked`, {
            description: `"${updatedSubtasks[subtaskIndex].title}" marked as incomplete`,
          });
          
          if (newTaskStatus === 'In Progress' && currentTask.status === 'Done') {
            toast.info(`Task reopened`, {
              description: `"${currentTask.title}" moved back to In Progress`,
            });
          }
        }
      } else {
        console.error('Failed to update subtask');
        toast.error('Failed to update subtask', {
          description: 'Please try again'
        });
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const toggleTaskCollapse = (taskId: string) => {
    setCollapsedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No tasks found</h3>
        <p className="text-muted-foreground mb-4">
          Create your first task to get started with organizing your work.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const progress = getSubtaskProgress(task.subtasks);
              
              return (
                <TableRow 
                  key={`${task._id}-${task.status}-${task.subtasks?.filter(st => st.isCompleted).length}`} 
                  className={`group transition-all duration-300 hover:bg-muted/50 animate-in fade-in duration-200 ${
                    task.status === 'Done' ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                  }`}
                >
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{task.title}</span>
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                            {task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {task.description}
                        </div>
                      )}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="space-y-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskCollapse(task._id);
                            }}
                            className="flex items-center gap-2 text-xs text-muted-foreground font-medium hover:text-foreground transition-colors"
                          >
                            <svg 
                              className={`w-3 h-3 transition-transform duration-200 ${
                                collapsedTasks.has(task._id) ? 'rotate-0' : 'rotate-90'
                              }`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            Subtasks ({task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length})
                          </button>
                          
                          {!collapsedTasks.has(task._id) && (
                            <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                              {task.subtasks.map((subtask, index) => (
                                <div 
                                  key={index} 
                                  className="flex items-center gap-2 text-xs group/subtask cursor-pointer hover:bg-muted/30 rounded-sm p-1 transition-all duration-200 ml-4"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSubtaskToggle(task._id, index, !subtask.isCompleted);
                                  }}
                                >
                                  <div className={`w-3 h-3 rounded-sm border flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                                    subtask.isCompleted 
                                      ? 'bg-green-500 border-green-500 text-white shadow-sm' 
                                      : 'border-muted-foreground/30 hover:border-green-400 hover:bg-green-50'
                                  }`}>
                                    {subtask.isCompleted && (
                                      <CheckCircle className="h-2 w-2 animate-in fade-in duration-200" />
                                    )}
                                  </div>
                                  <span className={`truncate transition-all duration-300 select-none ${
                                    subtask.isCompleted 
                                      ? 'line-through text-muted-foreground opacity-70' 
                                      : 'group-hover/subtask:text-foreground'
                                  }`}>
                                    {subtask.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={`gap-1 transition-all duration-500 hover:scale-105 ${getStatusColor(task.status)}`}
                    >
                      <span className="transition-transform duration-300">
                        {getStatusIcon(task.status)}
                      </span>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`transition-colors ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {progress ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <Progress 
                            value={progress.percentage} 
                            className="flex-1 h-2 transition-all duration-500 ease-out" 
                          />
                          <span className="text-xs text-muted-foreground font-medium min-w-[2rem] transition-all duration-300">
                            {progress.completed}/{progress.total}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground transition-all duration-300">
                          {Math.round(progress.percentage)}% complete
                          {progress.percentage === 100 && (
                            <span className="ml-1 text-green-600 animate-pulse">✓</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No subtasks</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatDate(task.dueDate)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-muted"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => onEditTask(task)}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {task.status !== 'To Do' && (
                          <DropdownMenuItem 
                            onClick={() => handleQuickStatusUpdate(task._id, 'To Do')}
                          >
                            Mark as To Do
                          </DropdownMenuItem>
                        )}
                        {task.status !== 'In Progress' && (
                          <DropdownMenuItem 
                            onClick={() => handleQuickStatusUpdate(task._id, 'In Progress')}
                          >
                            Mark as In Progress
                          </DropdownMenuItem>
                        )}
                        {task.status !== 'Done' && (
                          <DropdownMenuItem 
                            onClick={() => handleQuickStatusUpdate(task._id, 'Done')}
                          >
                            Mark as Done
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteTaskId(task._id)}
                          className="gap-2 text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTaskId && handleDeleteTask(deleteTaskId)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 