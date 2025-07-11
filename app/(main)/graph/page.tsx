'use client';

import { useState, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable';
import { KnowledgeGraph } from '@/components/features/graph/KnowledgeGraph';
import { GraphSidebar } from '@/components/features/graph/GraphSidebar';
import { RefreshCw, Brain, PanelLeftClose, BarChart3 } from 'lucide-react';
import { GraphData, GraphNode } from '@/types/graph';
import { useRouter } from 'next/navigation';

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch graph data');
  }
  return res.json();
};

export default function GraphPage() {
  const router = useRouter();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Build query parameters for API
  const queryParams = new URLSearchParams();
  if (folderFilter !== 'all') {
    queryParams.set('folder', folderFilter);
  }

  // Fetch graph data with SWR
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: GraphData;
  }>(`/api/graph?${queryParams.toString()}`, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
  });

  const handleNodeSelect = useCallback((node: GraphNode | null) => {
    setSelectedNode(node);
  }, []);

  const handleNodeSelectById = useCallback((nodeId: string) => {
    const node = data?.data?.nodes?.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
    }
  }, [data?.data?.nodes]);

  const handleNodeDoubleClick = useCallback((node: GraphNode) => {
    // Navigate to the note page with the specific note selected
    router.push(`/notes?noteId=${node.data.note._id}`);
  }, [router]);

  const handleOpenNote = useCallback((noteId: string) => {
    router.push(`/notes?noteId=${noteId}`);
  }, [router]);

  const handleRefresh = useCallback(() => {
    mutate();
  }, [mutate]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    // Clear selection when searching
    if (query && selectedNode) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  const handleFolderFilterChange = useCallback((folder: string) => {
    setFolderFilter(folder);
    // Clear selection when changing folder filter
    setSelectedNode(null);
  }, []);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load knowledge graph. Please try again.
            </AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const graphData = data?.data || { nodes: [], edges: [], stats: { 
    totalNotes: 0, 
    totalConnections: 0, 
    avgConnections: 0, 
    maxConnections: 0, 
    isolatedNodes: 0, 
    hubNodes: 0, 
    folderDistribution: {} 
  }};

  return (
    <ReactFlowProvider>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Knowledge Graph
                </h1>
                <p className="text-sm text-muted-foreground">
                  Visualize connections between your notes
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="h-8 w-8 p-0"
            >
              <PanelLeftClose className={`h-4 w-4 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {!isLoading && graphData.nodes.length > 0 && (
              <div className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                {graphData.stats.totalNotes} notes • {graphData.stats.totalConnections} connections
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="h-full min-h-0">
            {/* Sidebar */}
            {!isSidebarCollapsed && (
              <>
                <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="min-h-0">
                  <GraphSidebar
                    graphData={graphData}
                    selectedNode={selectedNode}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    folderFilter={folderFilter}
                    onFolderFilterChange={handleFolderFilterChange}
                    onNodeSelect={handleNodeSelectById}
                    onOpenNote={handleOpenNote}
                    isLoading={isLoading}
                  />
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}

            {/* Graph Canvas */}
            <ResizablePanel defaultSize={isSidebarCollapsed ? 100 : 75} className="min-h-0">
              <div className="h-full relative">
                <KnowledgeGraph
                  graphData={graphData}
                  selectedNodeId={selectedNode?.id}
                  onNodeSelect={handleNodeSelect}
                  onNodeDoubleClick={handleNodeDoubleClick}
                  isLoading={isLoading}
                />
                
                {/* Graph Instructions Overlay */}
                {!isLoading && graphData.nodes.length > 0 && (
                  <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-xl max-w-xs">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      Graph Navigation
                    </h3>
                    <div className="text-xs text-muted-foreground space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        <span>Click nodes to view details</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        <span>Double-click to open notes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        <span>Drag to rearrange nodes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        <span>Use controls to zoom & fit</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Legend */}
                {!isLoading && graphData.nodes.length > 0 && (
                  <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-xl">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Node Types
                    </h3>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 shadow-sm"></div>
                        <span className="font-medium">Hub nodes (5+ links)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-sm"></div>
                        <span className="font-medium">Connected (2-4 links)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-slate-400 to-slate-500 shadow-sm"></div>
                        <span className="font-medium">Isolated (0-1 links)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </ReactFlowProvider>
  );
} 