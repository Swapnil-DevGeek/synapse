import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Note from '@/models/Note';

// Rename a folder at a specific path
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { path, newName } = await request.json();

    if (!path || !newName) {
      return NextResponse.json({ success: false, error: 'Folder path and new name are required' }, { status: 400 });
    }

    if (newName.includes('/')) {
        return NextResponse.json({ success: false, error: 'Folder name cannot contain slashes' }, { status: 400 });
    }
    
    const pathParts = path.split('/');
    pathParts.pop();
    const parentPath = pathParts.join('/');
    const newPath = parentPath ? `${parentPath}/${newName}` : newName;
    
    // Check if new path already exists
    const existingFolder = await Note.findOne({ userId: session.user.id, folder: { $regex: `^${newPath}` } });
    if (existingFolder) {
      return NextResponse.json({ success: false, error: `A folder named "${newName}" already exists` }, { status: 409 });
    }

    // Find all notes in the folder and subfolders to rename their paths
    const notesToUpdate = await Note.find({ userId: session.user.id, folder: { $regex: `^${path}` } });

    if (notesToUpdate.length === 0) {
        return NextResponse.json({ success: true, message: 'Folder not found or is empty, nothing to rename.', modifiedCount: 0 });
    }

    const bulkOps = notesToUpdate.map(note => {
        const oldNoteFolder = note.folder || '';
        const restOfPath = oldNoteFolder.substring(path.length);
        const updatedPath = newPath + restOfPath;
        return {
            updateOne: {
                filter: { _id: note._id },
                update: { $set: { folder: updatedPath, updatedAt: new Date() } }
            }
        };
    });

    const result = await Note.bulkWrite(bulkOps);

    return NextResponse.json({
      success: true,
      message: `Renamed folder to "${newName}"`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error renaming folder:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// Delete a folder and all its notes
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (path === null) {
      return NextResponse.json({ success: false, error: 'Folder path is required' }, { status: 400 });
    }

    // Get all notes in this folder before deletion (for backlink cleanup)
    const notesToDelete = await Note.find({
      userId: session.user.id,
      folder: { $regex: `^${path}` }
    });

    if (notesToDelete.length === 0) {
        return NextResponse.json({ success: true, message: 'Folder not found or is empty.', deletedCount: 0 });
    }

    const noteIds = notesToDelete.map(note => note._id);

    // Delete all notes in the folder and subfolders
    const deleteResult = await Note.deleteMany({
      userId: session.user.id,
      folder: { $regex: `^${path}` }
    });

    // Remove these note IDs from all backlinks arrays
    await Note.updateMany(
      { userId: session.user.id },
      { $pull: { backlinks: { $in: noteIds } } }
    );

    return NextResponse.json({
      success: true,
      message: `Deleted folder "${path}" and ${deleteResult.deletedCount} notes`,
      deletedCount: deleteResult.deletedCount
    });

  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 