'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from '@/components/ui/badge';
import { FileText, Folder, Link2 } from 'lucide-react';
import { GraphNode } from '@/types/graph';

interface CustomNodeData {
  label: string;
  note: {
    _id: string;
    title: string;
    folder?: string | null;
    createdAt: string;
    updatedAt: string;
    wordCount: number;
  };
  connections: number;
  incomingConnections: number;
  outgoingConnections: number;
  size: number;
  color: string;
}

export const CustomNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  const { label, note, connections, size, color } = data;

  // Determine node style based on connection count
  const getNodeStyle = () => {
    if (connections >= 5) return 'hub'; // Hub node
    if (connections >= 2) return 'connected'; // Well connected
    return 'isolated'; // Isolated or lightly connected
  };

  const nodeStyle = getNodeStyle();

  return (
    <div className="relative group">
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary/60 !border-2 !border-background !opacity-0 group-hover:!opacity-100 transition-all duration-200 !rounded-full"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary/60 !border-2 !border-background !opacity-0 group-hover:!opacity-100 transition-all duration-200 !rounded-full"
      />

      {/* Main Node Container */}
      <div
        className={`
          relative flex flex-col items-center justify-center rounded-2xl shadow-lg transition-all duration-300 cursor-pointer backdrop-blur-sm
          ${selected 
            ? 'ring-4 ring-primary/30 shadow-2xl scale-110 z-10' 
            : 'hover:shadow-xl hover:scale-105 hover:z-10'
          }
          ${nodeStyle === 'hub' ? 'bg-gradient-to-br from-purple-500 to-blue-600' : ''}
          ${nodeStyle === 'connected' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : ''}
          ${nodeStyle === 'isolated' ? 'bg-gradient-to-br from-slate-400 to-slate-500' : ''}
        `}
        style={{
          width: Math.max(size, 60),
          height: Math.max(size, 60),
          border: selected ? '3px solid hsl(var(--primary))' : '2px solid rgba(255,255,255,0.9)',
        }}
      >
        {/* Content */}
        <div className="flex flex-col items-center justify-center p-3 text-center">
          {/* Icon */}
          <div className="mb-2">
            <FileText 
              className="text-white drop-shadow-sm" 
              size={size > 80 ? 24 : size > 60 ? 20 : 16}
            />
          </div>
          
          {/* Title */}
          <div 
            className="text-white font-semibold leading-tight drop-shadow-sm"
            style={{
              fontSize: size > 80 ? '12px' : size > 60 ? '11px' : '10px',
              maxWidth: size - 24,
              lineHeight: '1.2',
            }}
          >
            {label.length > 20 ? label.substring(0, 17) + '...' : label}
          </div>
          
          {/* Word count indicator for larger nodes */}
          {size > 70 && (
            <div className="text-white/80 text-xs mt-1 font-medium">
              {note.wordCount} words
            </div>
          )}
        </div>

        {/* Glow effect for selected nodes */}
        {selected && (
          <div 
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 animate-pulse"
            style={{ filter: 'blur(8px)', zIndex: -1 }}
          />
        )}
      </div>

      {/* Connection Badge */}
      {connections > 0 && (
        <Badge 
          variant="secondary"
          className={`
            absolute -top-2 -right-2 text-xs px-2 py-1 shadow-lg transition-all duration-300 border-2 border-background
            ${selected ? 'bg-primary text-primary-foreground scale-110' : 'bg-background text-foreground hover:bg-accent'}
            ${nodeStyle === 'hub' ? 'bg-purple-100 text-purple-700 border-purple-200' : ''}
          `}
        >
          <Link2 className="h-3 w-3 mr-1" />
          {connections}
        </Badge>
      )}

      {/* Folder Indicator */}
      {note.folder && (
        <div 
          className="absolute -bottom-2 -left-2 bg-background/95 backdrop-blur-sm rounded-full p-1.5 shadow-lg border-2 border-background opacity-80 hover:opacity-100 transition-all duration-200"
          title={`Folder: ${note.folder}`}
        >
          <Folder size={12} className="text-muted-foreground" />
        </div>
      )}

      {/* Enhanced Hover Information */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 px-4 py-3 bg-background/95 backdrop-blur-sm border rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 min-w-max max-w-xs">
        <div className="text-sm font-semibold mb-2 text-foreground">{note.title}</div>
        <div className="text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span>Connections:</span>
            <Badge variant="outline" className="text-xs">
              {connections}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Words:</span>
            <span className="font-medium">{note.wordCount}</span>
          </div>
          {note.folder && (
            <div className="flex items-center justify-between gap-4">
              <span>Folder:</span>
              <span className="font-medium text-xs max-w-24 truncate">{note.folder}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <span>Updated:</span>
            <span className="font-medium">{new Date(note.updatedAt).toLocaleDateString()}</span>
          </div>
          {connections > 0 && (
            <div className="pt-1 border-t border-border/50">
              <div className="flex justify-between text-xs">
                <span className="text-green-600">← {data.incomingConnections}</span>
                <span className="text-blue-600">{data.outgoingConnections} →</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CustomNode.displayName = 'CustomNode'; 