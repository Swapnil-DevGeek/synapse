import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Task from '@/models/Task';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{
    taskId: string;
  }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { taskId } = await params;

    // Validate taskId format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { title, description, priority, dueDate, status, subtasks } = body;

    // Find task and verify ownership
    const existingTask = await Task.findOne({
      _id: taskId,
      userId: session.user.id
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (title !== undefined) existingTask.title = title.trim();
    if (description !== undefined) existingTask.description = description?.trim() || '';
    if (priority !== undefined) existingTask.priority = priority;
    if (dueDate !== undefined) existingTask.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (status !== undefined) existingTask.status = status;
    if (subtasks !== undefined) existingTask.subtasks = subtasks;

    // Save task (this will trigger the pre-save middleware for status checking)
    await existingTask.save();

    return NextResponse.json(
      { success: true, data: existingTask },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { taskId } = await params;

    // Validate taskId format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find and delete task (only if user owns it)
    const deletedTask = await Task.findOneAndDelete({
      _id: taskId,
      userId: session.user.id
    });

    if (!deletedTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Task deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { taskId } = await params;

    // Validate taskId format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find task and verify ownership
    const task = await Task.findOne({
      _id: taskId,
      userId: session.user.id
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: task },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 