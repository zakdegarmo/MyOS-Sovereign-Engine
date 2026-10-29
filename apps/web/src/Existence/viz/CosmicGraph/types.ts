export enum FileType {
    TypeScript = 'ts',
    JavaScript = 'js',
    React = 'tsx',
    Style = 'css',
    Config = 'json',
    Asset = 'asset',
    HTML = 'html',
    Markdown = 'md',
    Unknown = 'unknown'
}

export enum NodeGeometry {
    Sphere = 'Sphere',
    Box = 'Box',
    Cone = 'Cone',
    Cylinder = 'Cylinder',
    Dodecahedron = 'Dodecahedron',
    Icosahedron = 'Icosahedron',
    Torus = 'Torus'
}

export interface GraphNode {
    id: string; // Absolute path or relative, depends on backend
    name: string;
    path: string;
    type: FileType | string; // Allow string for generic
    pillar?: string; // RelationEngine categorization

    // Physics Properties
    fileSize?: number; // Raw bytes
    volume?: number;   // Calculated Volume (for visual sizing)
    complexity?: number;
    mass?: number;     // Physics Mass (Inertia/Gravity)
    density?: number;  // Mass / Volume ratio

    val: number; // Visual Radius (derived from Volume)

    linesOfCode?: number;
    color?: string;
    parentDir?: string; // For Cosmic layout grouping
    depth?: number;      // Recursion depth
    deweyCategory?: string; // Dewey Decimal Category

    // Metadata
    lastModified?: number;
    coverage?: number;
    author?: string;
    degree?: number;

    // Visuals
    geometry?: NodeGeometry; // Optional

    // Force graph specific props (managed by d3)
    x?: number;
    y?: number;
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
}

export interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
    type: 'import' | 'dynamic' | 'asset' | string;
    strength?: number;
    color?: string; // Added color
    label?: string; // Added label
    linkDirectionalParticles?: number;
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export type LayoutMode = 'force' | 'timeTunnel' | 'deweySlope' | 'cosmic';

export type ViewMode =
    | 'fileType'
    | 'complexity'
    | 'directory'
    | 'dependency'
    | 'size'
    | 'recency'
    | 'coverage'
    | 'author'
    | 'pillar'
    | 'schema'; // Added schema mode
