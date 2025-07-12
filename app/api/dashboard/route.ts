import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Task from '@/models/Task';
import Note from '@/models/Note';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- request object not used in this handler
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const userId = session.user.id;
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Fetch all dashboard data in parallel for optimal performance
    const [recentNotes, highPriorityTasks, approachingDeadlines, totalStats] = await Promise.all([
      // Recent Notes - last 5 updated notes
      Note.find({ userId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('title updatedAt folder createdAt')
        .lean(),
      
      // High Priority Tasks - incomplete tasks marked as High priority
      Task.find({ 
        userId, 
        priority: 'High', 
        status: { $ne: 'Done' } 
      })
        .sort({ dueDate: 1, createdAt: -1 })
        .limit(10)
        .select('title priority status dueDate subtasks')
        .lean(),
      
      // Approaching Deadlines - tasks due within 7 days
      Task.find({
        userId,
        status: { $ne: 'Done' },
        dueDate: { 
          $gte: now, 
          $lte: sevenDaysFromNow 
        }
      })
        .sort({ dueDate: 1 })
        .limit(10)
        .select('title priority status dueDate subtasks')
        .lean(),
      
      // Quick stats for dashboard summary
      Promise.all([
        Task.countDocuments({ userId, status: { $ne: 'Done' } }), // Active tasks
        Note.countDocuments({ userId }), // Total notes
        Task.countDocuments({ 
          userId, 
          status: 'Done',
          updatedAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        }), // Completed this week
      ])
    ]);

    // Calculate additional metadata for better UX
    const enhancedRecentNotes = recentNotes.map(note => ({
      ...note,
      timeAgo: getTimeAgo(note.updatedAt),
      isNew: isWithinHours(note.createdAt, 24)
    }));

    const enhancedHighPriorityTasks = highPriorityTasks.map(task => ({
      ...task,
      completedSubtasks: task.subtasks?.filter((st: { isCompleted: boolean; }) => st.isCompleted).length || 0,
      totalSubtasks: task.subtasks?.length || 0,
      daysUntilDue: task.dueDate ? getDaysUntilDate(task.dueDate) : null,
      isOverdue: task.dueDate ? new Date(task.dueDate) < now : false
    }));

    const enhancedApproachingDeadlines = approachingDeadlines.map(task => ({
      ...task,
      completedSubtasks: task.subtasks?.filter((st: { isCompleted: boolean; }) => st.isCompleted).length || 0,
      totalSubtasks: task.subtasks?.length || 0,
      daysUntilDue: getDaysUntilDate(task.dueDate),
      isUrgent: getDaysUntilDate(task.dueDate) <= 2
    }));

    const [activeTasks, totalNotes, completedThisWeek] = totalStats;

    return NextResponse.json({
      success: true,
      data: {
        recentNotes: enhancedRecentNotes,
        highPriorityTasks: enhancedHighPriorityTasks,
        approachingDeadlines: enhancedApproachingDeadlines,
        stats: {
          activeTasks,
          totalNotes,
          completedThisWeek
        }
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions for better UX
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function getDaysUntilDate(date: Date): number {
  const now = new Date();
  const diffInMs = new Date(date).getTime() - now.getTime();
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
}

function isWithinHours(date: Date, hours: number): boolean {
  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
  return diffInMs <= hours * 60 * 60 * 1000;
} 