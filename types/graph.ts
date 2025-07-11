export interface GraphNote {
  _id: string;
  title: string;
  folder?: string | null;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    note: GraphNote;
    connections: number;
    incomingConnections: number;
    outgoingConnections: number;
    size: number;
    color: string;
  };
  style: {
    width: number;
    height: number;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated: boolean;
  style: {
    stroke: string;
    strokeWidth: number;
  };
  markerEnd: {
    type: string;
    color: string;
  };
}

export interface GraphStats {
  totalNotes: number;
  totalConnections: number;
  avgConnections: number;
  maxConnections: number;
  isolatedNodes: number;
  hubNodes: number;
  folderDistribution: { [key: string]: number };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: GraphStats;
} 