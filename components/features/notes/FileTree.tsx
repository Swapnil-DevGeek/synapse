'use client';

import { useState, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  FolderPlus,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface Note {
  _id: string;
  title: string;
  content: string;
  folder: string | null;
  backlinks: Array<{ _id: string; title: string; }>;
  createdAt: string;
  updatedAt: string;
}

interface FileTreeProps {
  notes: Note[];
  selectedNote: Note | null;
  onNoteSelect: (noteId: string) => void;
  onCreateNote: (title: string, folder?: string) => Promise<Note | undefined>;
  onDeleteNote: (noteId: string) => void;
  onMoveNote: (noteId: string, targetFolder: string | null) => Promise<boolean>;
  onRefreshNotes?: () => void;
  selectedFolder: string | null;
  onFolderSelect: (folder: string | null) => void;
}

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'note';
  path: string;
  depth: number;
  children: TreeNode[];
  note?: Note;
}

const buildFileTree = (notes: Note[]): TreeNode[] => {
    const root: TreeNode = { id: 'root', name: 'root', type: 'folder', path: '', depth: -1, children: [] };
    const folders = new Map<string, TreeNode>([['', root]]);

    // Create all folder nodes from note paths
    notes.forEach(note => {
        if (note.folder) {
            let currentPath = '';
            note.folder.split('/').forEach(part => {
                const parentPath = currentPath;
                currentPath = currentPath ? `${parentPath}/${part}` : part;
                if (!folders.has(currentPath)) {
                    const parentNode = folders.get(parentPath)!;
                    const newFolder: TreeNode = {
                        id: `folder-${currentPath}`,
                        name: part,
                        type: 'folder',
                        path: currentPath,
                        depth: parentNode.depth + 1,
                        children: [],
                    };
                    folders.set(currentPath, newFolder);
                    parentNode.children.push(newFolder);
                }
            });
        }
    });

    // Add notes to their folders
    notes.forEach(note => {
        const parentPath = note.folder || '';
        const parentNode = folders.get(parentPath);
        if (parentNode) {
            const noteNode: TreeNode = {
                id: `note-${note._id}`,
                name: note.title,
                type: 'note',
                path: parentPath,
                depth: parentNode.depth + 1,
                children: [],
                note: note,
            };
            parentNode.children.push(noteNode);
        }
    });

    // Sort contents of all folders
    folders.forEach(folder => {
        folder.children.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    });

    return root.children;
};

export function FileTree({
  notes,
  selectedNote,
  onNoteSelect,
  onCreateNote,
  onDeleteNote,
  onMoveNote,
  onRefreshNotes
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));
  const [editingItem, setEditingItem] = useState<{ path: string; name: string; } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: 'note' | 'folder'; id: string; name: string; path: string } | null>(null);
  const [creatingData, setCreatingData] = useState<{ type: 'note' | 'folder', path: string } | null>(null);
  const [newName, setNewName] = useState('');

  const fileTree = useMemo(() => buildFileTree(notes), [notes]);

  const handleCreate = useCallback(async () => {
    if (!creatingData || !newName.trim()) {
      setCreatingData(null);
      setNewName('');
      return;
    }

    const { type, path } = creatingData;

    if (type === 'folder') {
        const newFolderPath = path ? `${path}/${newName}` : newName;
        await onCreateNote('Untitled', newFolderPath);
        setExpandedFolders(prev => new Set(prev).add(path).add(newFolderPath));
    } else {
        await onCreateNote(newName, path);
    }
    
    onRefreshNotes?.();
    setCreatingData(null);
    setNewName('');
  }, [creatingData, newName, onCreateNote, onRefreshNotes]);

  const handleRename = useCallback(async () => {
    if (!editingItem || !newName.trim() || newName === editingItem.name) {
        setEditingItem(null);
        setNewName('');
        return;
    }

    const { path } = editingItem;

    try {
        const res = await fetch('/api/notes/folders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, newName: newName.trim() }),
        });
        if (!res.ok) throw new Error(await res.text());
        toast.success('Folder renamed');
        onRefreshNotes?.();
    } catch (e: unknown) {
        toast.error('Failed to rename folder: ' + (e as Error).message);
    } finally {
        setEditingItem(null);
        setNewName('');
    }
  }, [editingItem, newName, onRefreshNotes]);

  const confirmDelete = useCallback(async () => {
    if (!deleteItem) return;

    if (deleteItem.type === 'note') {
      onDeleteNote(deleteItem.id);
    } else {
      try {
        const res = await fetch(`/api/notes/folders?path=${encodeURIComponent(deleteItem.path)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await res.text());
        toast.success('Folder deleted');
        onRefreshNotes?.();
      } catch (e: unknown) {
        toast.error('Failed to delete folder: ' + (e as Error).message);
      }
    }
    setDeleteItem(null);
  }, [deleteItem, onDeleteNote, onRefreshNotes]);
  
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination?.droppableId) return;

    const targetPath = destination.droppableId === 'root-droppable' ? '' : destination.droppableId;
    
    if (draggableId.startsWith('note-')) {
      const noteId = draggableId.substring(5);
      const success = await onMoveNote(noteId, targetPath);
      if (success) toast.success('Note moved');
      else toast.error('Failed to move note');
    } else if (draggableId.startsWith('folder-')) {
      const draggedPath = draggableId.substring(7);
      if (targetPath === draggedPath || (targetPath.startsWith(draggedPath) && targetPath[draggedPath.length] === '/')) {
          toast.error("Cannot move a folder into itself.");
          return;
      }

      try {
          const res = await fetch('/api/notes/folders/move', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ draggedPath, targetPath }),
          });
          if (!res.ok) throw new Error(await res.text());
          toast.success('Folder moved');
          onRefreshNotes?.();
      } catch (e: unknown) {
          toast.error('Failed to move folder: ' + (e as Error).message);
      }
    }
  }, [onMoveNote, onRefreshNotes]);

  const renderItemCreation = useCallback((path: string, type: 'note' | 'folder') => (
    <div className="py-1 flex items-center gap-2" style={{ marginLeft: `${(path.split('/').length - 1) * 1.25}rem` }}>
      <Input
        autoFocus
        value={newName}
        placeholder={type === 'folder' ? 'New folder name' : 'New note title'}
        onChange={(e) => setNewName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (type === 'folder') {
              handleRename();
            } else {
              handleCreate();
            }
          }
          if (e.key === 'Escape') {
            setCreatingData(null);
            setEditingItem(null);
            setNewName('');
          }
        }}
        className="h-7 text-sm"
      />
      <Button 
        size="sm" 
        variant="ghost" 
        className="h-7" 
        onClick={type === 'folder' ? handleRename : handleCreate}
      >
        Save
      </Button>
    </div>
  ), [newName, setNewName, handleRename, handleCreate]);

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  const renderNode = useCallback((node: TreeNode) => {
    const isEditing = editingItem?.path === node.path;
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedNote?._id === node.note?._id;

    if (isEditing) {
      return (
        <div key={node.id} className="py-1">
          {renderItemCreation(node.path, 'folder')}
        </div>
      );
    }

    return (
      <Draggable key={node.id} draggableId={node.id} index={node.depth}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{ 
              ...provided.draggableProps.style, 
              marginLeft: `${node.depth * 1.25}rem` 
            }}
          >
            <ContextMenu>
              <ContextMenuTrigger>
                <div 
                  className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-accent ${
                    isSelected ? 'bg-accent' : ''
                  }`}
                  onClick={() => {
                    if (node.type === 'folder') {
                      toggleFolder(node.path);
                    } else if (node.note) {
                      onNoteSelect(node.note._id);
                    }
                  }}
                >
                  {node.type === 'folder' && (
                    <>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {isExpanded ? (
                        <FolderOpen className="h-4 w-4" />
                      ) : (
                        <Folder className="h-4 w-4" />
                      )}
                    </>
                  )}
                  {node.type === 'note' && (
                    <FileText className="h-4 w-4 ml-5" />
                  )}
                  <span className="text-sm truncate">{node.name}</span>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                {node.type === 'folder' && (
                  <>
                    <ContextMenuItem onClick={() => setCreatingData({ type: 'note', path: node.path })}>
                      New Note
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setCreatingData({ type: 'folder', path: node.path })}>
                      New Folder
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => {
                      setEditingItem({ path: node.path, name: node.name });
                      setNewName(node.name);
                    }}>
                      Rename
                    </ContextMenuItem>
                  </>
                )}
                <ContextMenuItem 
                  onClick={() => setDeleteItem({ 
                    type: node.type, 
                    id: node.note?._id || node.path, 
                    name: node.name, 
                    path: node.path 
                  })}
                  className="text-destructive"
                >
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        )}
      </Draggable>
    );
  }, [expandedFolders, selectedNote, editingItem, onNoteSelect, toggleFolder, renderItemCreation]);

  const renderTree = useCallback((nodes: TreeNode[]) => (
    nodes.map(node => (
      <div key={node.id}>
        {renderNode(node)}
        {creatingData?.path === node.path && (
          <div className="mt-1">
            {renderItemCreation(node.path, creatingData.type)}
          </div>
        )}
        {node.type === 'folder' && expandedFolders.has(node.path) && (
          <Droppable droppableId={node.path} type="ITEM">
            {(provided) => (
              <div 
                ref={provided.innerRef} 
                {...provided.droppableProps} 
                className="pl-4 border-l border-border/50 ml-2"
              >
                {renderTree(node.children)}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
      </div>
    ))
  ), [renderNode, creatingData, renderItemCreation, expandedFolders]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-2 flex items-center justify-between border-b">
        <h2 className="text-sm font-semibold px-2">File Explorer</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setCreatingData({ type: 'note', path: '' })}>
            <FileText className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCreatingData({ type: 'folder', path: '' })}>
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      {/* File Tree */}
      <ScrollArea className="flex-1">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="root-droppable" type="ITEM">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="p-1">
                {renderTree(fileTree)}
                {provided.placeholder}
                {creatingData && !creatingData.path && (
                  <div className="mt-1">
                    {renderItemCreation('', creatingData.type)}
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </ScrollArea>
      
      {/* Delete Confirmation */}
      {deleteItem && (
        <AlertDialog open onOpenChange={() => setDeleteItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{`Are you sure you want to delete "${deleteItem.name}"?`}</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the {deleteItem.type}
                {deleteItem.type === 'folder' && ' and all its contents'}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}