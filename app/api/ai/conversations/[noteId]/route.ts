import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/dbConnect';
import Note from '@/models/Note';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId } = params;

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Fetch note with AI conversations
    const note = await Note.findOne({
      _id: noteId,
      userId: session.user.id,
    }).select('aiConversations');

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Return conversations, sorted by timestamp ascending (oldest first)
    const sortedConversations = note.aiConversations.sort(
      (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      conversations: sortedConversations,
    });

  } catch (error) {
    console.error('Fetch conversations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 