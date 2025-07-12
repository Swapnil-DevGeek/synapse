import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Note from '@/models/Note';

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

    const { draggedPath, targetPath } = await request.json();

    if (draggedPath === undefined || targetPath === undefined) {
      return NextResponse.json(
        { success: false, error: 'draggedPath and targetPath are required' },
        { status: 400 }
      );
    }
    
    // Prevent moving a folder into itself or a subfolder
    if (targetPath.startsWith(draggedPath) && draggedPath !== '') {
        return NextResponse.json(
            { success: false, error: 'Cannot move a folder into itself.' },
            { status: 400 }
        );
    }

    const draggedFolderName = draggedPath.split('/').pop() || '';
    const newPathPrefix = targetPath ? `${targetPath}/${draggedFolderName}` : draggedFolderName;

    // Check if a folder with the target name already exists in the target path
    const existingFolder = await Note.findOne({
      userId: session.user.id,
      folder: { $regex: `^${newPathPrefix}` },
    });

    if (existingFolder) {
      return NextResponse.json(
        { success: false, error: `A folder named "${draggedFolderName}" already exists in the target location.` },
        { status: 409 }
      );
    }
    
    // Find all notes in the dragged folder and its subfolders
    const notesToMove = await Note.find({
        userId: session.user.id,
        folder: { $regex: `^${draggedPath}` }
    });

    if (notesToMove.length === 0) {
        return NextResponse.json({
            success: true,
            message: 'No notes to move.',
            modifiedCount: 0
        });
    }
    
    const bulkOps = notesToMove.map(note => {
        const oldNoteFolder = note.folder || '';
        const relativePath = oldNoteFolder.substring(draggedPath.length);
        const newNoteFolder = `${newPathPrefix}${relativePath}`;
        
        return {
            updateOne: {
                filter: { _id: note._id },
                update: { $set: { folder: newNoteFolder } }
            }
        };
    });

    const result = await Note.bulkWrite(bulkOps);

    return NextResponse.json({
      success: true,
      message: 'Folder moved successfully.',
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error moving folder:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 