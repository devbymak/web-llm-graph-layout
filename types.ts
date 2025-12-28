import React from 'react';

export interface GraphNode {
  id: string;
  type: string;
  label?: string;
  value?: string | number;
  objectType?: string;
  // Position is optional in input, but required for React Flow output
  position?: { x: number; y: number };
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface ReactFlowNode {
  id: string;
  type?: string;
  data: {
    label: string;
    type: string;
    value?: string | number;
    objectType?: string;
  };
  position: { x: number; y: number };
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  type?: string;
  style?: React.CSSProperties;
}