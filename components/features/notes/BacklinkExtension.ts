import { Node, mergeAttributes } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';

interface Note {
  _id: string;
  title: string;
  content: string;
  folder: string | null;
}

interface BacklinkOptions {
  HTMLAttributes: Record<string, any>;
  suggestion: any;
}

export interface BacklinkExtensionProps {
  notes: Note[];
  onNoteSelect?: (noteId: string) => void;
  getCurrentNoteId?: () => string | undefined;
}

export const BacklinkPluginKey = new PluginKey('backlink');

export const BacklinkExtension = (props: BacklinkExtensionProps) => {
  return Node.create<BacklinkOptions>({
    name: 'backlink',

    addOptions() {
      return {
        HTMLAttributes: {},
        suggestion: {
          char: '[[',
          allowSpaces: true,
          pluginKey: BacklinkPluginKey,
          command: ({ editor, range, props: suggestionProps }) => {
            // Insert the backlink
            const nodeAfter = editor.view.state.selection.$to.nodeAfter;
            const overrideSpace = nodeAfter?.text?.startsWith(' ');

            if (overrideSpace) {
              range.to += 1;
            }

            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                {
                  type: this.name,
                  attrs: suggestionProps,
                },
                {
                  type: 'text',
                  text: ' ',
                },
              ])
              .run();

            window.getSelection()?.collapseToEnd();
          },
          allow: ({ state, range }) => {
            const $from = state.selection.$from;
            const type = state.schema.nodes[this.name];
            const allow = $from.parent.type.contentMatch.matchType(type);

            if (!allow) {
              return false;
            }

            return true;
          },
          items: ({ query }: { query: string }) => {
            const currentNoteId = props.getCurrentNoteId?.();
            
            return props.notes
              .filter(note => {
                // Don't show the current note in suggestions
                if (currentNoteId && note._id === currentNoteId) {
                  return false;
                }
                // Filter by query
                return note.title.toLowerCase().includes(query.toLowerCase());
              })
              .slice(0, 15) // Show up to 15 options
              .map(note => ({
                id: note._id,
                label: note.title,
                displayLabel: note.folder ? `${note.folder}/${note.title}` : note.title,
              }));
          },
          render: () => {
            let component: HTMLDivElement;
            let popup: HTMLDivElement;
            let selectedIndex = 0;

            return {
              onStart: (suggestionProps: any) => {
                selectedIndex = 0;
                component = document.createElement('div');
                component.className = 'backlink-suggestions';
                
                popup = document.createElement('div');
                popup.className = 'fixed z-50 min-w-[200px] max-w-[350px] bg-popover border border-border rounded-md shadow-md py-1 max-h-[300px] overflow-y-auto';
                
                component.appendChild(popup);

                const { clientRect } = suggestionProps;

                if (clientRect) {
                  popup.style.top = `${clientRect().bottom + 5}px`;
                  popup.style.left = `${clientRect().left}px`;
                }

                document.body.appendChild(component);
              },

              onUpdate(suggestionProps: any) {
                popup.innerHTML = '';
                
                if (suggestionProps.items.length === 0) {
                  const noResults = document.createElement('div');
                  noResults.className = 'px-3 py-2 text-sm text-muted-foreground';
                  noResults.textContent = 'No notes found';
                  popup.appendChild(noResults);
                  return;
                }

                suggestionProps.items.forEach((item: any, index: number) => {
                  const button = document.createElement('button');
                  button.className = `w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                    index === selectedIndex ? 'bg-accent' : ''
                  }`;
                  
                  // Create the display content
                  const titleSpan = document.createElement('span');
                  titleSpan.textContent = item.displayLabel;
                  titleSpan.className = 'block truncate';
                  button.appendChild(titleSpan);
                  
                  button.onclick = () => suggestionProps.command(item);
                  popup.appendChild(button);
                });

                const { clientRect } = suggestionProps;
                if (clientRect) {
                  popup.style.top = `${clientRect().bottom + 5}px`;
                  popup.style.left = `${clientRect().left}px`;
                }
              },

              onKeyDown(suggestionProps: any) {
                if (suggestionProps.event.key === 'Escape') {
                  if (component) {
                    component.remove();
                  }
                  return true;
                }

                if (!suggestionProps.items || suggestionProps.items.length === 0) {
                  return false;
                }

                if (suggestionProps.event.key === 'ArrowUp') {
                  selectedIndex = selectedIndex <= 0 ? suggestionProps.items.length - 1 : selectedIndex - 1;
                  // Re-render to update selection
                  this.onUpdate(suggestionProps);
                  return true;
                }

                if (suggestionProps.event.key === 'ArrowDown') {
                  selectedIndex = selectedIndex >= suggestionProps.items.length - 1 ? 0 : selectedIndex + 1;
                  // Re-render to update selection
                  this.onUpdate(suggestionProps);
                  return true;
                }

                if (suggestionProps.event.key === 'Enter') {
                  if (suggestionProps.items[selectedIndex]) {
                    suggestionProps.command(suggestionProps.items[selectedIndex]);
                  }
                  return true;
                }

                return false;
              },

              onExit() {
                if (component) {
                  component.remove();
                }
              },
            };
          },
        },
      };
    },

    group: 'inline',

    inline: true,

    selectable: false,

    atom: true,

    addAttributes() {
      return {
        id: {
          default: null,
          parseHTML: element => element.getAttribute('data-id'),
          renderHTML: attributes => {
            if (!attributes.id) {
              return {};
            }

            return {
              'data-id': attributes.id,
            };
          },
        },

        label: {
          default: null,
          parseHTML: element => element.getAttribute('data-label'),
          renderHTML: attributes => {
            if (!attributes.label) {
              return {};
            }

            return {
              'data-label': attributes.label,
            };
          },
        },
      };
    },

    parseHTML() {
      return [
        {
          tag: `span[data-type="${this.name}"]`,
        },
      ];
    },

    renderHTML({ node, HTMLAttributes }) {
      return [
        'span',
        mergeAttributes(
          { 'data-type': this.name },
          this.options.HTMLAttributes,
          HTMLAttributes,
          {
            class: 'backlink inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors',
          }
        ),
        `[[${node.attrs.label || node.attrs.id}]]`,
      ];
    },

    renderText({ node }) {
      return `[[${node.attrs.label || node.attrs.id}]]`;
    },

    addKeyboardShortcuts() {
      return {
        Backspace: () =>
          this.editor.commands.command(({ tr, state }) => {
            let isMention = false;
            const { selection } = state;
            const { empty, anchor } = selection;

            if (!empty) {
              return false;
            }

            state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
              if (node.type.name === this.name) {
                isMention = true;
                tr.insertText(this.options.suggestion.char || '', pos, pos + node.nodeSize);

                return false;
              }
            });

            return isMention;
          }),
      };
    },

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
        }),
      ];
    },
  });
}; 