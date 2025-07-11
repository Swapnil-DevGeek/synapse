import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Note from '@/models/Note';

export async function PUT(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { folder } = await request.json();
    const { noteId } = params;

    // Find and update the note
    const note = await Note.findOne({
      _id: noteId,
      userId: session.user.id
    });

    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      );
    }

    // Update the folder
    note.folder = folder || null;
    await note.save();

    // Return updated note
    const updatedNote = await Note.findById(noteId).populate('backlinks', 'title');

    return NextResponse.json({
      success: true,
      data: updatedNote
    });

  } catch (error) {
    console.error('Error moving note:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 