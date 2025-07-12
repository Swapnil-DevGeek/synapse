'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  EyeOff,
  BarChart3,
  FileText,
  ExternalLink,
  Folder,
  GitBranch,
  TrendingUp,
  Zap,
  Link2,
} from 'lucide-react';
import { GraphData, GraphNode } from '@/types/graph';

interface GraphSidebarProps {
  graphData: GraphData;
  selectedNode: GraphNode | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  folderFilter: string;
  onFolderFilterChange: (folder: string) => void;
  onNodeSelect: (nodeId: string) => void;
  onOpenNote: (noteId: string) => void;
  isLoading?: boolean;
}

export function GraphSidebar({
  graphData,
  selectedNode,
  searchQuery,
  onSearchChange,
  folderFilter,
  onFolderFilterChange,
  onNodeSelect,
  onOpenNote,
  isLoading = false,
}: GraphSidebarProps) {
  const [showStats, setShowStats] = useState(true);

  // Get unique folders for filter
  const folders = ['all', ...new Set(
    graphData.nodes
      .map(node => node.data.note.folder)
      .filter(Boolean)
      .sort()
  )];

  // Filter nodes based on search and folder
  const filteredNodes = graphData.nodes.filter(node => {
    const matchesSearch = !searchQuery || 
      node.data.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (node.data.note.folder && node.data.note.folder.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFolder = folderFilter === 'all' || 
      (folderFilter === 'root' && !node.data.note.folder) ||
      node.data.note.folder === folderFilter;
    
    return matchesSearch && matchesFolder;
  });

  const stats = graphData.stats;

  return (
    <div className="h-full flex flex-col border-r bg-background/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-background/80 backdrop-blur-sm">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-background/50 backdrop-blur-sm"
          />
        </div>

        {/* Folder Filter */}
        <Select value={folderFilter} onValueChange={onFolderFilterChange}>
          <SelectTrigger className="w-full bg-background/50 backdrop-blur-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Folders</SelectItem>
            <SelectItem value="root">Root</SelectItem>
            {folders.slice(1).map(folder => (
              <SelectItem key={folder} value={folder!}>
                {folder}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-3 py-2">
            {/* Graph Statistics */}
            {showStats && !isLoading && (
              <Card className="my-4 bg-background/60 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Graph Overview
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowStats(!showStats)}
                      className="h-6 w-6 p-0 hover:bg-accent/50"
                    >
                      <EyeOff className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span className="text-xs">Notes</span>
                      </div>
                      <div className="font-medium">{stats.totalNotes}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <GitBranch className="h-3 w-3" />
                        <span className="text-xs">Links</span>
                      </div>
                      <div className="font-medium">{stats.totalConnections}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-xs">Avg Links</span>
                      </div>
                      <div className="font-medium">{stats.avgConnections}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Zap className="h-3 w-3" />
                        <span className="text-xs">Hubs</span>
                      </div>
                      <div className="font-medium">{stats.hubNodes}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selected Node Details */}
            {selectedNode && (
              <Card className="my-4 bg-background/60 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Selected Note
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div>
                    <h3 className="font-medium mb-2">{selectedNode.data.note.title}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Connections</span>
                        <Badge variant="secondary">
                          {selectedNode.data.connections}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Words</span>
                        <span>{selectedNode.data.note.wordCount}</span>
                      </div>
                      {selectedNode.data.note.folder && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Folder</span>
                          <div className="flex items-center gap-1 text-xs">
                            <Folder className="h-3 w-3" />
                            {selectedNode.data.note.folder}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Updated</span>
                        <span className="text-xs">
                          {new Date(selectedNode.data.note.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Connections</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Incoming: {selectedNode.data.incomingConnections}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Outgoing: {selectedNode.data.outgoingConnections}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => onOpenNote(selectedNode.data.note._id)}
                    size="sm"
                    className="w-full"
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Open Note
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Node List */}
            <Card className="my-4 mb-6 bg-background/60 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Notes ({filteredNodes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {filteredNodes
                    .sort((a, b) => b.data.connections - a.data.connections)
                    .slice(0, 20) // Show top 20 most connected
                    .map((node) => (
                    <div
                      key={node.id}
                      className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:shadow-md ${
                        selectedNode?.id === node.id ? 'bg-accent/70 border-primary shadow-md ring-2 ring-primary/20' : 'border-border/50 bg-background/30'
                      }`}
                      onClick={() => onNodeSelect(node.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate mb-1">
                            {node.data.label}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs px-2 py-0.5 ${
                                node.data.connections >= 5 ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                node.data.connections >= 2 ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                'bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                            >
                              <Link2 className="h-3 w-3 mr-1" />
                              {node.data.connections}
                            </Badge>
                            {node.data.note.folder && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                                <Folder className="h-3 w-3" />
                                <span className="truncate max-w-20">
                                  {node.data.note.folder.split('/').pop()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div 
                          className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm border-2 border-background"
                          style={{ 
                            background: node.data.connections >= 5 
                              ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' 
                              : node.data.connections >= 2 
                                ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' 
                                : 'linear-gradient(135deg, #64748b, #94a3b8)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {filteredNodes.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notes found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
} 