'use client';

import { useState, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
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
  Folder, 
  FolderOpen, 
  Plus, 
  Edit,
  Trash2,
  FolderPlus,
  ChevronRight,
  ChevronDown
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
  selectedFolder?: string | null;
  onNoteSelect: (noteId: string) => void;
  onFolderSelect?: (folder: string | null) => void;
  onCreateNote: (title: string, folder?: string) => Promise<Note | undefined>;
  onDeleteNote: (noteId: string) => void;
  onMoveNote: (noteId: string, targetFolder: string | null) => Promise<boolean>;
  onRefreshNotes?: () => void;
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
  selectedFolder,
  onNoteSelect,
  onFolderSelect,
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

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleCreate = async () => {
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
  };

  const handleRename = async () => {
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
    } catch (e: any) {
        toast.error('Failed to rename folder: ' + e.message);
    } finally {
        setEditingItem(null);
        setNewName('');
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;

    if (deleteItem.type === 'note') {
      onDeleteNote(deleteItem.id);
    } else {
      try {
        const res = await fetch(`/api/notes/folders?path=${encodeURIComponent(deleteItem.path)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await res.text());
        toast.success('Folder deleted');
        onRefreshNotes?.();
      } catch (e: any) {
        toast.error('Failed to delete folder: ' + e.message);
      }
    }
    setDeleteItem(null);
  };
  
  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination, source } = result;
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
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          toast.success('Folder moved successfully');
          onRefreshNotes?.();
      } catch (e: any) {
          toast.error(`Failed to move folder: ${e.message}`);
      }
    }
  };

  const renderItemCreation = (path: string, type: 'note' | 'folder') => (
    <div style={{ marginLeft: `${(path.split('/').length - (path ? 1: 0)) * 1.25}rem`}} className="p-2 space-y-2">
        <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') setCreatingData(null);
            }}
            placeholder={type === 'folder' ? 'New folder name' : 'New note title'}
            className="h-8 text-sm"
            autoFocus
        />
        <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setCreatingData(null)}>Cancel</Button>
        </div>
    </div>
  )

  const renderNode = useCallback((node: TreeNode) => {
    const isExpanded = expandedFolders.has(node.path);

    if (editingItem?.path === node.path && node.type === 'folder') {
        return (
            <div style={{ marginLeft: `${node.depth * 1.25}rem`}} className="p-2 space-y-2">
                <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename();
                        if (e.key === 'Escape') setEditingItem(null);
                    }}
                    className="h-8 text-sm"
                    autoFocus
                />
                <div className="flex gap-2">
                    <Button size="sm" onClick={handleRename}>Rename</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>Cancel</Button>
                </div>
            </div>
        )
    }

    if (node.type === 'folder') {
      return (
        <Draggable key={node.id} draggableId={node.id} index={0}>
            {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={provided.draggableProps.style}>
                    <ContextMenu>
                        <ContextMenuTrigger>
                            <div className={`flex items-center gap-1 p-2 text-sm cursor-pointer rounded-md transition-colors hover:bg-muted/50 ${snapshot.isDragging ? 'bg-accent' : ''}`}>
                                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 hover:bg-transparent" onClick={() => toggleFolder(node.path)}>
                                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                </Button>
                                {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                                <span className="truncate flex-1" onClick={() => toggleFolder(node.path)}>{node.name}</span>
                                <span className="text-xs text-muted-foreground bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">{node.children.length}</span>
                            </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem onClick={() => { setCreatingData({ type: 'note', path: node.path }); setNewName('Untitled'); }}>
                                <Plus className="h-4 w-4 mr-2" /> New Note
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => { setCreatingData({ type: 'folder', path: node.path }); setNewName('New Folder'); }}>
                                <FolderPlus className="h-4 w-4 mr-2" /> New Folder
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => { setEditingItem({ path: node.path, name: node.name }); setNewName(node.name) }}>
                                <Edit className="h-4 w-4 mr-2" /> Rename
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => setDeleteItem({ type: 'folder', id: node.id, name: node.name, path: node.path })} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                    {isExpanded && (
                        <Droppable droppableId={node.path} type="folder">
                            {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className={`space-y-1 min-h-[8px] rounded-md transition-colors ${snapshot.isDraggingOver ? 'bg-accent/50' : ''}`}>
                                    {node.children.map(child => renderNode(child))}
                                    {provided.placeholder}
                                    {creatingData?.path === node.path && renderItemCreation(node.path, creatingData.type)}
                                </div>
                            )}
                        </Droppable>
                    )}
                </div>
            )}
        </Draggable>
      );
    }

    if (node.type === 'note' && node.note) {
      const note = node.note;
      return (
        <Draggable key={node.id} draggableId={node.id} index={0}>
            {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style, marginLeft: `${node.depth * 1.25}rem` }}>
                    <ContextMenu>
                        <ContextMenuTrigger>
                            <div className={`flex items-center gap-2 p-2 text-sm cursor-pointer rounded-md transition-colors ${selectedNote?._id === note._id ? 'bg-primary text-primary-foreground' : snapshot.isDragging ? 'bg-accent' : 'hover:bg-muted'}`}
                                onClick={() => onNoteSelect(note._id)}>
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate flex-1">{note.title}</span>
                            </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem onClick={() => setDeleteItem({ type: 'note', id: note._id, name: note.title, path: node.path })} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                </div>
            )}
        </Draggable>
      );
    }
    return null;
  }, [expandedFolders, creatingData, editingItem, newName, selectedNote, onNoteSelect, onRefreshNotes]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col border-r bg-background">
        <div className="p-4 border-b">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Files</h2>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setCreatingData({ type: 'note', path: '' }); setNewName('Untitled'); }} className="h-8 w-8 p-0" title="New Note">
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setCreatingData({ type: 'folder', path: '' }); setNewName('New Folder'); }} className="h-8 w-8 p-0" title="New Folder">
                        <FolderPlus className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            {creatingData?.path === '' && renderItemCreation('', creatingData.type)}
        </div>

        <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
                <Droppable droppableId="root-droppable" type="folder">
                    {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className={`p-2 space-y-1 min-h-full ${snapshot.isDraggingOver ? 'bg-accent' : ''}`}>
                            {fileTree.map(node => renderNode(node))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </ScrollArea>
        </div>

        <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete {deleteItem?.type}</AlertDialogTitle>
                    <AlertDialogDescription>
                    Are you sure you want to delete "{deleteItem?.name}"?
                    {deleteItem?.type === 'folder' && ' This will also delete all its content.'} This action is irreversible.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </DragDropContext>
  );
} 