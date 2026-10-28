export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'dir';
  complexity: number; // Represents data points (4=Tetrahedron, 8=Cube, etc.)
  language?: string;
  path: string;
  content?: string;
  ontologyTags?: string[]; // Derived from the Fractal Map
  children?: FileNode[];
  // For Graph
  x?: number;
  y?: number;
  z?: number;
  color?: string;
  geometry?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
}

export interface RepoData {
  nodes: FileNode[];
  links: GraphLink[];
}

export interface OntologyNode {
  concept: string;
  attributes: Record<string, string[]>;
}

export type ViewMode = 'graph' | 'dual' | 'list';

export interface AppState {
  selectedNode: FileNode | null;
  repoData: RepoData;
  viewMode: ViewMode;
  searchQuery: string;
  ontology: Record<string, any>;
  showBenchmark: boolean;
}
