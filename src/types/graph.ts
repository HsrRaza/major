export interface GraphNodeData extends Record<string, unknown> {
  id: string;
  label: string;
  path: string;
  layer: string;
  color: string;
  complexity: number;
  lines: number;
  isCircular: boolean;
  isHotspot: boolean;
  afferent: number;
  efferent: number;
  instability: number;
  issuesCount: number;
  deps: string[];
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  isCircular: boolean;
  label?: string;
}
