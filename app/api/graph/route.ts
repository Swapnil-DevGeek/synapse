import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Note from '@/models/Note';
import { GraphNode, GraphEdge } from '@/types/graph';
import mongoose from 'mongoose';

interface NoteFilter {
  userId: string;
  folder?: string | null;
}

interface RawNote {
  _id: mongoose.Types.ObjectId;
  title: string;
  content?: string;
  folder: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');

    // Build filter query
    const filter: NoteFilter = { userId: session.user.id };
    
    if (folder && folder !== 'all') {
      if (folder === 'root') {
        filter.folder = null;
      } else {
        filter.folder = folder;
      }
    }

    // Fetch notes with minimal fields needed for graph processing
    const notes = await Note.find(filter)
      .select('_id title content folder createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    // Build nodes and edges
    const { nodes, edges, stats } = processNotesIntoGraph( notes as unknown as RawNote[] );

    return NextResponse.json({
      success: true,
      data: {
        nodes,
        edges,
        stats: {
          totalNotes: notes.length,
          totalConnections: edges.length,
          ...stats
        }
      }
    });

  } catch (error) {
    console.error('Error fetching graph data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to process notes into graph structure
function processNotesIntoGraph(notes: RawNote[]) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const noteMap = new Map();
  const connectionCounts = new Map();

  // Create a map of note titles to IDs for faster lookup
  const titleToIdMap = new Map();
  notes.forEach(note => {
    titleToIdMap.set(note.title.toLowerCase(), note._id.toString());
    noteMap.set(note._id.toString(), note);
    connectionCounts.set(note._id.toString(), 0);
  });

  // Process each note to find backlinks and create nodes
  notes.forEach(note => {
    const noteId = note._id.toString();
    
    // Extract backlinks from content using [[Note Title]] pattern
    const backlinks = extractBacklinks(note.content || '');
    let outgoingConnections = 0;

    backlinks.forEach(linkedTitle => {
      const linkedNoteId = titleToIdMap.get(linkedTitle.toLowerCase());
      if (linkedNoteId && linkedNoteId !== noteId) {
        // Create edge from current note to linked note
        edges.push({
          id: `${noteId}-${linkedNoteId}`,
          source: noteId,
          target: linkedNoteId,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#64748b',
            strokeWidth: 1.5,
          },
          markerEnd: {
            type: 'arrowclosed',
            color: '#64748b',
          },
        });

        outgoingConnections++;
        connectionCounts.set(linkedNoteId, connectionCounts.get(linkedNoteId) + 1);
      }
    });

    // Create node
    const incomingConnections = connectionCounts.get(noteId);
    const totalConnections = outgoingConnections + incomingConnections;
    
    // Calculate node size based on connections (min 40, max 120)
    const nodeSize = Math.max(40, Math.min(120, 40 + totalConnections * 8));
    
    // Determine node color based on activity and connections
    const nodeColor = getNodeColor(totalConnections, note.folder);
    
    nodes.push({
      id: noteId,
      type: 'custom',
      position: { x: 0, y: 0 }, // Will be positioned by layout algorithm
      data: {
        label: note.title,
        note: {
          _id: note._id.toString(),
          title: note.title,
          folder: note.folder,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
          wordCount: (note.content || '').split(/\s+/).filter(word => word.length > 0).length,
        },
        connections: totalConnections,
        incomingConnections,
        outgoingConnections,
        size: nodeSize,
        color: nodeColor,
      },
      style: {
        width: nodeSize,
        height: nodeSize,
      },
    });
  });

  // Calculate graph statistics
  const stats = calculateGraphStats(nodes);

  // Position nodes using a simple layout algorithm
  positionNodes(nodes, edges);

  return { nodes, edges, stats };
}

// Extract [[Note Title]] patterns from content
function extractBacklinks(content: string): string[] {
  const backlinkPattern = /\[\[([^\]]+)\]\]/g;
  const backlinks: string[] = [];
  let match;

  while ((match = backlinkPattern.exec(content)) !== null) {
    const title = match[1].trim();
    if (title && !backlinks.includes(title)) {
      backlinks.push(title);
    }
  }

  return backlinks;
}

// Get node color based on connections and folder
function getNodeColor(connections: number, folder: string | null): string {
  // Base colors by folder
  const folderColors: { [key: string]: string } = {
    'work': '#3b82f6',
    'personal': '#10b981',
    'projects': '#8b5cf6',
    'research': '#f59e0b',
    'ideas': '#ec4899',
    'notes': '#6b7280',
  };

  // Get base color
  let baseColor = '#6b7280'; // Default gray
  if (folder) {
    const folderKey = folder.toLowerCase().split('/')[0];
    baseColor = folderColors[folderKey] || '#6b7280';
  }

  // Adjust intensity based on connections
  if (connections >= 5) {
    return baseColor; // Full intensity for highly connected nodes
  } else if (connections >= 2) {
    return baseColor + '80'; // Medium intensity
  } else {
    return baseColor + '40'; // Low intensity for isolated nodes
  }
}

// Simple force-directed layout algorithm
function positionNodes(nodes: GraphNode[], _edges: GraphEdge[]) {
  const centerX = 400;
  const centerY = 300;
  const radius = 200;

  if (nodes.length === 0) return;

  if (nodes.length === 1) {
    nodes[0].position = { x: centerX, y: centerY };
    return;
  }

  // Create adjacency list for connected components
  const adjacencyList = new Map();
  nodes.forEach(node => {
    adjacencyList.set(node.id, new Set());
  });

  _edges.forEach(edge => {
    adjacencyList.get(edge.source)?.add(edge.target);
    adjacencyList.get(edge.target)?.add(edge.source);
  });

  // Simple circular layout with clustering
  const positioned = new Set();
  let componentIndex = 0;

  nodes.forEach((node, index) => {
    if (positioned.has(node.id)) return;

    // Find connected component
    const component = getConnectedComponent(node.id, adjacencyList);
    
    if (component.length === 1) {
      // Isolated node - place in outer ring
      const angle = (index / nodes.length) * 2 * Math.PI;
      node.position = {
        x: centerX + radius * 1.5 * Math.cos(angle),
        y: centerY + radius * 1.5 * Math.sin(angle),
      };
    } else {
      // Connected component - place in cluster
      const clusterAngle = (componentIndex / Math.max(1, nodes.length / 4)) * 2 * Math.PI;
      const clusterCenterX = centerX + radius * Math.cos(clusterAngle);
      const clusterCenterY = centerY + radius * Math.sin(clusterAngle);
      const clusterRadius = Math.min(150, Math.max(50, component.length * 20));

      component.forEach((nodeId, i) => {
        const nodeAngle = (i / component.length) * 2 * Math.PI;
        const nodeInComponent = nodes.find(n => n.id === nodeId);
        if (nodeInComponent) {
          nodeInComponent.position = {
            x: clusterCenterX + clusterRadius * Math.cos(nodeAngle),
            y: clusterCenterY + clusterRadius * Math.sin(nodeAngle),
          };
        }
      });

      componentIndex++;
    }

    component.forEach(nodeId => positioned.add(nodeId));
  });
}

// Get connected component starting from a node
function getConnectedComponent(startNodeId: string, adjacencyList: Map<string, Set<string>>): string[] {
  const component: string[] = [];
  const visited = new Set<string>();
  const queue = [startNodeId];
  visited.add(startNodeId);

  while (queue.length > 0) {
    const currentNodeId = queue.shift()!;
    component.push(currentNodeId);

    const neighbors = adjacencyList.get(currentNodeId) || [];
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push(neighborId);
      }
    }
  }
  return component;
}

// Calculate graph statistics based on the processed nodes
function calculateGraphStats(nodes: GraphNode[]) {
  if (nodes.length === 0) {
    return {
      avgConnections: 0,
      maxConnections: 0,
      isolatedNodes: 0,
      hubNodes: 0,
      folderDistribution: {},
    };
  }

  const totalConnections = nodes.reduce((sum, node) => sum + node.data.connections, 0);
  const folderCounts: { [key: string]: number } = {};

  nodes.forEach(node => {
    const folder = node.data.note.folder || 'root';
    folderCounts[folder] = (folderCounts[folder] || 0) + 1;
  });

  return {
    avgConnections: totalConnections / nodes.length,
    maxConnections: Math.max(...nodes.map(node => node.data.connections)),
    isolatedNodes: nodes.filter(node => node.data.connections === 0).length,
    hubNodes: nodes.filter(node => node.data.connections >= 5).length,
    folderDistribution: folderCounts,
  };
} 