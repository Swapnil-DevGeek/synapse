import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Task from '@/models/Task';

interface TaskFilter {
  userId: string;
  priority?: string;
  status?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { title, description, priority, dueDate, subtasks } = body;

    // Basic validation
    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Task title is required' },
        { status: 400 }
      );
    }

    // Create new task
    const task = new Task({
      userId: session.user.id,
      title: title.trim(),
      description: description?.trim() || '',
      priority: priority || 'Medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: 'To Do',
      subtasks: subtasks || []
    });

    await task.save();

    return NextResponse.json(
      { success: true, data: task },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filter query
    const filter: TaskFilter = { userId: session.user.id };
    
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Build sort object
    const sort: { [key: string]: 1 | -1 } = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const tasks = await Task.find(filter).sort(sort);

    return NextResponse.json(
      { success: true, data: tasks },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 