'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable';
import { FileTree } from '@/components/features/notes/FileTree';
import { Editor } from '@/components/features/notes/Editor';
import { AIChatPanel } from '@/components/features/notes/AIChatPanel';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelRightClose, FileText } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// Types
interface Note {
  _id: string;
  title: string;
  content: string;
  folder: string | null;
  backlinks: Array<{
    _id: string;
    title: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// --- Suspense-wrapped SearchParams for CSR-only hooks ---
function SearchParamsHandler(props: {
  isLoading: boolean;
  selectedNote: Note | null;
  createNote: (title: string, folder?: string) => Promise<Note>;
  fetchAndSetNote: (noteId: string) => Promise<void>;
}) {
  // useSearchParams must be inside Suspense boundary
  const { isLoading, selectedNote, createNote, fetchAndSetNote } = props;
  const searchParams = useSearchParams();

  useEffect(() => {
    const action = searchParams.get('action');
    const noteId = searchParams.get('noteId');
    
    if (action === 'new' && !isLoading) {
      // Create a new note when action=new is in URL, but only once
      createNote('Untitled Note');
      // Clear the action parameter to prevent infinite loop
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      window.history.replaceState({}, '', url.toString());
    } else if (noteId && !isLoading) {
      // Load specific note if noteId is provided and it's not already loaded
      if (!selectedNote || selectedNote._id !== noteId) {
        fetchAndSetNote(noteId);
      }
    }
  }, [searchParams, isLoading, selectedNote, createNote, fetchAndSetNote]);

  return null;
}

export default function NotesPage() {
  const router = useRouter();
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [treeNotes, setTreeNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all notes from the server
  const fetchAllNotes = useCallback(async () => {
    try {
      const response = await fetch('/api/notes');
      const data = await response.json();
      if (data.success) {
        setAllNotes(data.data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate unique note title
  const generateUniqueTitle = useCallback((baseTitle: string, folder?: string): string => {
    const existingTitles = allNotes
      .filter(note => folder ? note.folder === folder : !note.folder)
      .map(note => note.title);
    
    if (!existingTitles.includes(baseTitle)) {
      return baseTitle;
    }
    
    let counter = 2;
    while (existingTitles.includes(`${baseTitle} ${counter}`)) {
      counter++;
    }
    
    return `${baseTitle} ${counter}`;
  }, [allNotes]);

  // Create new note
  const createNote = useCallback(async (title: string, folder?: string) => {
    try {
      const uniqueTitle = generateUniqueTitle(title, folder);
      
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: uniqueTitle,
          content: '',
          folder: folder || null
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchAllNotes(); // Refresh all notes
        setSelectedNote(data.data);
        return data.data;
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  }, [fetchAllNotes, generateUniqueTitle]);

  // Fetch individual note with backlinks
  const fetchAndSetNote = useCallback(async (noteId: string) => {
    try {
      setIsLoading(true); // Set loading state while fetching specific note
      const response = await fetch(`/api/notes/${noteId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedNote(data.data);
        // Also fetch all notes to populate the sidebar
        await fetchAllNotes();
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    } finally {
      setIsLoading(false); // Clear loading state after fetching
    }
  }, [fetchAllNotes]);

  // Filter notes for the file tree based on the selected folder
  useEffect(() => {
    if (selectedFolder === null) {
      setTreeNotes(allNotes); // Show all notes
    } else {
      setTreeNotes(allNotes.filter(note => note.folder === selectedFolder));
    }
  }, [selectedFolder, allNotes]);

  // Initial fetch - check URL params first
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get('noteId');
    
    if (noteId) {
      // If there's a noteId in URL, fetch that specific note first
      fetchAndSetNote(noteId);
    } else {
      // Otherwise, just fetch all notes
      fetchAllNotes();
    }
  }, [fetchAllNotes, fetchAndSetNote]);

  // --- Suspense boundary for useSearchParams ---
  // See: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
  // This fixes the error by wrapping useSearchParams in Suspense.
  // The SearchParamsHandler will handle note creation and selection from URL.
  // It is rendered below in the main return.

  const handleNoteSelect = (noteId: string) => {
    router.push(`/notes?noteId=${noteId}`, { scroll: false });
  };

  // Update note
  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (data.success) {
        setSelectedNote(data.data);
        // Update the note in allNotes array instead of refetching everything
        setAllNotes(prevNotes => 
          prevNotes.map(note => 
            note._id === noteId ? data.data : note
          )
        );
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  // Delete note
  const deleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchAllNotes(); // Refresh all notes
        if (selectedNote?._id === noteId) {
          setSelectedNote(null);
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  // Move note to different folder
  const moveNote = async (noteId: string, targetFolder: string | null) => {
    try {
      const response = await fetch(`/api/notes/${noteId}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folder: targetFolder
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchAllNotes(); // Refresh all notes
        // Update selected note if it was moved
        if (selectedNote?._id === noteId) {
          setSelectedNote(data.data);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error moving note:', error);
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Loading notes...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Suspense boundary for useSearchParams */}
      <Suspense fallback={null}>
        <SearchParamsHandler
          isLoading={isLoading}
          selectedNote={selectedNote}
          createNote={createNote}
          fetchAndSetNote={fetchAndSetNote}
        />
      </Suspense>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Notes</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
              className="h-8 w-8 p-0"
            >
              <PanelLeftClose className={`h-4 w-4 transition-transform ${isLeftPanelCollapsed ? 'rotate-180' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
              className="h-8 w-8 p-0"
            >
              <PanelRightClose className={`h-4 w-4 transition-transform ${isRightPanelCollapsed ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>
        <Button
          onClick={() => createNote('Untitled', selectedFolder || undefined)}
          size="sm"
        >
          New Note
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full min-h-0">
          {/* File Tree Panel */}
          {!isLeftPanelCollapsed && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={35} className="min-h-0">
                <FileTree
                  notes={treeNotes}
                  selectedNote={selectedNote}
                  selectedFolder={selectedFolder}
                  onNoteSelect={handleNoteSelect}
                  onFolderSelect={setSelectedFolder}
                  onCreateNote={createNote}
                  onDeleteNote={deleteNote}
                  onMoveNote={moveNote}
                  onRefreshNotes={fetchAllNotes}
                />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          {/* Editor Panel */}
          <ResizablePanel defaultSize={isRightPanelCollapsed ? 80 : 50} minSize={30} className="min-h-0">
            <Editor
              note={selectedNote}
              notes={allNotes}
              onUpdateNote={updateNote}
              onOpenAIChat={() => setIsRightPanelCollapsed(false)}
              onNoteSelect={handleNoteSelect}
            />
          </ResizablePanel>

          {/* AI Chat Panel */}
          {!isRightPanelCollapsed && selectedNote && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={30} minSize={25} maxSize={40} className="min-h-0">
                <AIChatPanel
                  noteId={selectedNote._id}
                  noteTitle={selectedNote.title}
                  noteContent={selectedNote.content}
                  isVisible={!isRightPanelCollapsed}
                  onClose={() => setIsRightPanelCollapsed(true)}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
} 