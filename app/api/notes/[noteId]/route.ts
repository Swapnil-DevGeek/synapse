import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Note from '@/models/Note';

// Helper function to parse [[Note Title]] links from content
function parseBacklinks(content: string): string[] {
  const backlinkRegex = /\[\[([^\]]+)\]\]/g;
  const matches = [];
  let match;
  
  while ((match = backlinkRegex.exec(content)) !== null) {
    matches.push(match[1].trim());
  }
  
  return matches;
}

// Helper function to update backlinks
async function updateBacklinks(noteId: string, userId: string, oldContent: string = '', newContent: string = '') {
  const oldLinks = parseBacklinks(oldContent);
  const newLinks = parseBacklinks(newContent);
  
  // Find links to add and remove
  const linksToAdd = newLinks.filter(link => !oldLinks.includes(link));
  const linksToRemove = oldLinks.filter(link => !newLinks.includes(link));
  
  // Add current note to backlinks of newly linked notes
  for (const linkTitle of linksToAdd) {
    await Note.updateOne(
      { userId, title: linkTitle },
      { $addToSet: { backlinks: noteId } }
    );
  }
  
  // Remove current note from backlinks of no longer linked notes
  for (const linkTitle of linksToRemove) {
    await Note.updateOne(
      { userId, title: linkTitle },
      { $pull: { backlinks: noteId } }
    );
  }
}

export async function GET(
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

    const note = await Note.findOne({
      _id: params.noteId,
      userId: session.user.id
    }).populate('backlinks', 'title _id');

    if (!note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: note },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Find the existing note
    const existingNote = await Note.findOne({
      _id: params.noteId,
      userId: session.user.id
    });

    if (!existingNote) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, content, folder } = body;

    // Store old content for backlink comparison
    const oldContent = existingNote.content || '';
    const newContent = content || '';

    // Update the note
    const updatedNote = await Note.findByIdAndUpdate(
      params.noteId,
      {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content: content.trim() }),
        ...(folder !== undefined && { folder: folder?.trim() || null }),
        updatedAt: new Date()
      },
      { new: true }
    );

    // Update backlinks if content changed
    if (content !== undefined) {
      await updateBacklinks(params.noteId, session.user.id, oldContent, newContent);
    }

    return NextResponse.json(
      { success: true, data: updatedNote },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Find and delete the note
    const deletedNote = await Note.findOneAndDelete({
      _id: params.noteId,
      userId: session.user.id
    });

    if (!deletedNote) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      );
    }

    // Remove this note's ID from all backlinks arrays
    await Note.updateMany(
      { userId: session.user.id },
      { $pull: { backlinks: params.noteId } }
    );

    return NextResponse.json(
      { success: true, message: 'Note deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 