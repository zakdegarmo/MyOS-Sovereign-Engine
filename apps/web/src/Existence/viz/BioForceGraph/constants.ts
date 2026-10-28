import { FileType } from './types';
import type { GraphNode, ViewMode } from './types';

// Color palettes exported for Legend
export const TYPE_COLORS: Record<string, string> = {
    [FileType.TypeScript]: '#3178c6',
    [FileType.React]: '#61dafb',
    [FileType.JavaScript]: '#f7df1e',
    [FileType.Style]: '#ec4899',
    [FileType.Config]: '#a1a1aa',
    [FileType.Asset]: '#22c55e',
    [FileType.HTML]: '#e34c26',
    [FileType.Markdown]: '#ffffff',
    [FileType.Unknown]: '#555555'
};

export const AUTHOR_COLORS = [
    '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'
];

export const DIRECTORY_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'
];

export const stringToColor = (str: string, palette: string[]) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
};

export const getNodeColor = (node: GraphNode, mode: ViewMode): string => {
    switch (mode) {
        case 'complexity': {
            const intensity = Math.min(node.complexity * 25, 255);
            return `rgb(${intensity}, ${255 - intensity}, ${Math.max(50, 255 - intensity * 2)})`;
        }
        case 'size': {
            const intensity = Math.min((node.val / 30) * 200, 200);
            return `rgb(${50}, ${255 - intensity}, ${255})`;
        }
        case 'coverage': {
            if (node.coverage < 50) return '#ef4444';
            if (node.coverage < 80) return '#eab308';
            return '#22c55e';
        }
        case 'recency': {
            const now = Date.now();
            const age = now - node.lastModified;
            const twoYears = 63072000000;
            const ratio = 1 - Math.min(age / twoYears, 1);
            const r = Math.floor(ratio * 255);
            const b = Math.floor((1 - ratio) * 255);
            return `rgb(${r}, 50, ${b})`;
        }
        case 'dependency': {
            const deg = node.degree || 0;
            return deg > 5 ? '#f97316' : deg > 2 ? '#fbbf24' : '#94a3b8';
        }
        case 'directory': {
            // Use parentDir for coloring
            return stringToColor(node.parentDir || 'root', DIRECTORY_COLORS);
        }
        case 'author': {
            return stringToColor(node.author, AUTHOR_COLORS);
        }
        case 'pillar': {
            // Map Ontological Pillars to Colors
            if (!node.pillar) return '#888';
            if (node.pillar.includes('Self')) return '#f87171';
            if (node.pillar.includes('Thought')) return '#fbbf24';
            if (node.pillar.includes('Logic')) return '#34d399';
            if (node.pillar.includes('Unity')) return '#60a5fa';
            if (node.pillar.includes('Existence')) return '#a78bfa';
            if (node.pillar.includes('Improvement')) return '#f472b6';
            if (node.pillar.includes('Mastery')) return '#facc15';
            if (node.pillar.includes('Resonance')) return '#ec4899';
            if (node.pillar.includes('Transcendence')) return '#818cf8';
            return '#888';
        }
        case 'fileType':
        default:
            return node.color || TYPE_COLORS[node.type] || '#ffffff';
    }
};
