'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { BacklinkExtension } from './BacklinkExtension';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bold, 
  Italic, 
  Strikethrough,
  Code,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Save,
  Bot,
  ImageIcon,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { SummaryDisplay } from './SummaryDisplay';

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

interface EditorProps {
  note: Note | null;
  notes: Note[];
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void;
  onOpenAIChat: () => void;
  onNoteSelect?: (noteId: string) => void;
}

export function Editor({ note, notes, onUpdateNote, onOpenAIChat, onNoteSelect }: EditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingFromPropRef = useRef(false);

  // Debounced values for auto-save (1 second delay)
  const [debouncedTitle] = useDebounce(title, 1000);
  const [debouncedContent] = useDebounce(content, 1000);

  // Handle image paste from clipboard
  const handleImagePaste = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl);
      };
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(file);
    });
  }, []);

  // Function to get current note ID for backlink extension
  const getCurrentNoteId = useCallback(() => {
    return note?._id;
  }, [note?._id]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-sm',
        },
        allowBase64: true,
      }),
      BacklinkExtension({
        notes,
        onNoteSelect,
        getCurrentNoteId,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'What\'s the title?';
          }
          return 'Start writing your note... Use [[Note Title]] to link to other notes.';
        },
      }),
      Typography,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: note?.content || '',
          editorProps: {
        attributes: {
          class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[500px] transition-colors duration-200',
        },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image/'));
        
        if (imageItem) {
          event.preventDefault();
          const file = imageItem.getAsFile();
          if (file) {
            handleImagePaste(file)
              .then(dataUrl => {
                editor?.chain().focus().setImage({ src: dataUrl }).run();
                toast.success('Image pasted successfully');
              })
              .catch(error => {
                console.error('Error pasting image:', error);
                toast.error('Failed to paste image');
              });
          }
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (!isUpdatingFromPropRef.current) {
        const newContent = editor.getHTML();
        setContent(newContent);
      }
    },
    onCreate: ({ editor }) => {
      // Add click handlers for backlinks
      editor.view.dom.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const backlinkElement = target.closest('[data-type="backlink"]');
        
        if (backlinkElement && onNoteSelect) {
          const noteId = backlinkElement.getAttribute('data-id');
          if (noteId) {
            onNoteSelect(noteId);
          }
        }
      });

      // Add drag and drop support for creating backlinks
      editor.view.dom.addEventListener('dragover', (event) => {
        event.preventDefault();
        editor.view.dom.classList.add('drag-over');
      });

      editor.view.dom.addEventListener('dragleave', (event) => {
        if (!editor.view.dom.contains(event.relatedTarget as Node)) {
          editor.view.dom.classList.remove('drag-over');
        }
      });

      editor.view.dom.addEventListener('drop', (event) => {
        event.preventDefault();
        editor.view.dom.classList.remove('drag-over');
        
        try {
          const dragData = event.dataTransfer?.getData('text/plain');
          if (dragData) {
            const data = JSON.parse(dragData);
            if (data.type === 'note' && data.id && data.title) {
              // Don't allow self-backlinking
              if (note && data.id === note._id) {
                toast.error('Cannot link a note to itself');
                return;
              }

              // Insert backlink at cursor position
              const { state } = editor.view;
              const { selection } = state;
              const pos = selection.$anchor.pos;
              
              editor.chain()
                .focus()
                .insertContentAt(pos, {
                  type: 'backlink',
                  attrs: {
                    id: data.id,
                    label: data.title,
                  },
                })
                .run();
              
              toast.success(`Backlink to "${data.title}" created`);
            }
          }
        } catch (error) {
          console.error('Error handling drop:', error);
        }
      });
    },
  }, [note, notes, onNoteSelect, getCurrentNoteId, handleImagePaste]);

  // Initialize editor with note content when editor is first created
  useEffect(() => {
    if (editor && note && !editor.storage.noteId) {
      // First time initialization
      editor.storage.noteId = note._id;
      setTitle(note.title);
      setContent(note.content || '');
      editor.commands.setContent(note.content || '', false);
    }
  }, [editor, note]);

  // Update editor content when note changes
  useEffect(() => {
    if (editor && note) {
      // Only update if we're switching to a completely different note
      const isDifferentNote = note._id !== editor.storage.noteId;
      
      if (isDifferentNote) {
        isUpdatingFromPropRef.current = true;
        editor.storage.noteId = note._id;
        setTitle(note.title);
        setContent(note.content || '');
        editor.commands.setContent(note.content || '', false);
        
        setTimeout(() => {
          isUpdatingFromPropRef.current = false;
        }, 100);
      }
    } else if (editor && !note) {
      // Clear editor if no note is selected
      isUpdatingFromPropRef.current = true;
      setTitle('');
      setContent('');
      editor.commands.clearContent();
      editor.storage.noteId = null;
      setTimeout(() => {
        isUpdatingFromPropRef.current = false;
      }, 100);
    }
  }, [note, editor]);

  // Auto-save functionality (optimized)
  const performSave = useCallback(async (titleToSave: string, contentToSave: string) => {
    if (!note) return;

    const trimmedTitle = titleToSave.trim() || 'Untitled Note';
    
    // Check if there are actually changes to save
    if (trimmedTitle === note.title && contentToSave === note.content) {
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateNote(note._id, {
        title: trimmedTitle,
        content: contentToSave,
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  }, [note, onUpdateNote]);

  // Auto-save when debounced values change
  useEffect(() => {
    if (!note || isUpdatingFromPropRef.current) return;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Only save if there are actual changes
    const hasChanges = debouncedTitle !== note.title || debouncedContent !== note.content;
    
    if (hasChanges) {
      saveTimeoutRef.current = setTimeout(() => {
        performSave(debouncedTitle, debouncedContent);
      }, 100); // Small additional delay to batch rapid changes
    }

    // Cleanup function
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [debouncedTitle, debouncedContent, note, performSave]);


  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Bold className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">No note selected</h3>
            <p className="text-muted-foreground">
              Select a note from the sidebar or create a new one to start writing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleImagePaste(file)
          .then(dataUrl => {
            editor?.chain().focus().setImage({ src: dataUrl }).run();
            toast.success('Image added successfully');
          })
          .catch(error => {
            console.error('Error adding image:', error);
            toast.error('Failed to add image');
          });
      }
    };
    input.click();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4 space-y-4">
          {/* Title Input */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="text-2xl font-semibold border-0 px-0 focus-visible:ring-0 bg-transparent"
          />

          {/* Toolbar */}
          <div className="flex items-center gap-1 flex-wrap">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'bg-muted' : ''}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'bg-muted' : ''}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive('strike') ? 'bg-muted' : ''}
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={editor.isActive('code') ? 'bg-muted' : ''}
              >
                <Code className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
              >
                <Heading3 className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'bg-muted' : ''}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'bg-muted' : ''}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive('blockquote') ? 'bg-muted' : ''}
              >
                <Quote className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={addLink}
                title="Add Link"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={addImage}
                title="Add Image"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenAIChat}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              <Bot className="h-4 w-4 mr-2" />
              Ask AI
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSummary(true)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              disabled={!note || !note.content?.trim()}
              title="Summarize Note"
            >
              <FileText className="h-4 w-4 mr-2" />
              Summarize
            </Button>


            <div className="flex-1" />

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isSaving ? (
                <div className="flex items-center gap-1">
                  <Save className="h-3 w-3 animate-pulse" />
                  Saving...
                </div>
              ) : lastSaved ? (
                <div>Saved at {formatTime(lastSaved)}</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {/* Summary Display */}
            {note && (
              <SummaryDisplay
                noteId={note._id}
                noteContent={content || note.content}
                isVisible={showSummary}
                onClose={() => setShowSummary(false)}
              />
            )}
            
            {/* Editor */}
            <EditorContent editor={editor} className="h-full" />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
} 