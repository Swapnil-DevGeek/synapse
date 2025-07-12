import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Note from '@/models/Note';

interface NoteFilter {
  userId: string;
  folder?: string | null;
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
    const { title, content, folder } = body;

    // Basic validation
    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Note title is required' },
        { status: 400 }
      );
    }

    // Create new note
    const note = new Note({
      userId: session.user.id,
      title: title.trim(),
      content: content?.trim() || '',
      folder: folder?.trim() || null,
      backlinks: []
    });

    await note.save();

    return NextResponse.json(
      { success: true, data: note },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating note:', error);
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
    const folder = searchParams.get('folder');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filter query
    const filter: NoteFilter = { userId: session.user.id };
    
    if (folder && folder !== 'all') {
      if (folder === 'root') {
        filter.folder = null;
      } else {
        filter.folder = folder;
      }
    }

    // Build sort object
    const sort: { [key: string]: 1 | -1 } = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const notes = await Note.find(filter).sort(sort);

    return NextResponse.json(
      { success: true, data: notes },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 