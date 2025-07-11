'use client';

import { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeTypes,
  Connection,
  BackgroundVariant,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { CustomNode } from './CustomNode';
import { GraphData, GraphNode, GraphEdge } from '@/types/graph';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

interface KnowledgeGraphProps {
  graphData: GraphData;
  selectedNodeId?: string | null;
  onNodeSelect?: (node: GraphNode | null) => void;
  onNodeDoubleClick?: (node: GraphNode) => void;
  isLoading?: boolean;
}

export function KnowledgeGraph({
  graphData,
  selectedNodeId,
  onNodeSelect,
  onNodeDoubleClick,
  isLoading = false,
}: KnowledgeGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<GraphNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphEdge>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const { fitView, zoomTo } = useReactFlow();

  // Update nodes and edges when graphData changes
  useEffect(() => {
    if (graphData?.nodes && graphData?.edges) {
      setNodes(graphData.nodes);
      setEdges(graphData.edges);
      
      // Fit view after a small delay to ensure nodes are rendered
      setTimeout(() => {
        fitView({ padding: 0.1, duration: 800 });
      }, 100);
    }
  }, [graphData, setNodes, setEdges, fitView]);

  // Highlight selected node
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      }))
    );
  }, [selectedNodeId, setNodes]);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.stopPropagation();
      onNodeSelect?.(node as GraphNode);
    },
    [onNodeSelect]
  );

  const onNodeDoubleClickHandler = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.stopPropagation();
      onNodeDoubleClick?.(node as GraphNode);
    },
    [onNodeDoubleClick]
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  const onNodeMouseEnter = useCallback((event: React.MouseEvent, node: Node) => {
    setHoveredNodeId(node.id);
    
    // Highlight connected edges
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        style: {
          ...edge.style,
          strokeWidth: edge.source === node.id || edge.target === node.id ? 3 : 1.5,
          stroke: edge.source === node.id || edge.target === node.id ? '#3b82f6' : '#64748b',
        },
        animated: edge.source === node.id || edge.target === node.id,
      }))
    );
  }, [setEdges]);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
    
    // Reset edge styles
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        style: {
          ...edge.style,
          strokeWidth: 1.5,
          stroke: '#64748b',
        },
        animated: false,
      }))
    );
  }, [setEdges]);

  // Focus on a specific node
  const focusNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const x = node.position.x + (node.style?.width || 0) / 2;
      const y = node.position.y + (node.style?.height || 0) / 2;
      
      // Center the view on this node
      const zoom = 1.5;
      zoomTo(zoom);
      
      // We can't directly pan to coordinates in React Flow, so we'll use fitView with the specific node
      setTimeout(() => {
        fitView({ 
          nodes: [node], 
          padding: 0.2,
          duration: 800 
        });
      }, 100);
    }
  }, [nodes, zoomTo, fitView]);

  // Expose focusNode function to parent
  useEffect(() => {
    if (selectedNodeId) {
      focusNode(selectedNodeId);
    }
  }, [selectedNodeId, focusNode]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div>
            <h3 className="text-lg font-medium mb-2">Building Knowledge Graph</h3>
            <p className="text-muted-foreground">
              Analyzing connections between your notes...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!graphData?.nodes?.length) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <div className="w-8 h-8 border-2 border-muted-foreground rounded-full"></div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">No Notes to Visualize</h3>
            <p className="text-muted-foreground">
              Create some notes with [[backlinks]] to see your knowledge graph come to life.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gradient-to-br from-background via-background to-muted/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClickHandler}
        onPaneClick={onPaneClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="knowledge-graph"
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={24} 
          size={1.5}
          className="opacity-20"
          color="hsl(var(--muted-foreground))"
        />
        <Controls 
          position="top-right"
          className="bg-background/90 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl"
        />
        <MiniMap 
          position="bottom-right"
          className="bg-background/90 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl overflow-hidden"
          nodeStrokeWidth={2}
          nodeColor={(node) => {
            const graphNode = node as GraphNode;
            const connections = graphNode.data.connections;
            if (connections >= 5) return '#8b5cf6'; // Purple for hubs
            if (connections >= 2) return '#3b82f6'; // Blue for connected
            return '#64748b'; // Gray for isolated
          }}
          maskColor="rgba(0,0,0,0.05)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
} 