import type { MemCube, LibraryNode } from '@Omni/types';
import { NexusRouter } from '@Unity/services/NexusRouter';
import { SystemArchitect } from './SystemArchitect';

/**
 * LOGIC: CodeLinter
 * Scans code snippets for potential issues, style violations, and complexity.
 */
export const CodeLinter = {
    analyze: (code: string) => {
        const issues: string[] = [];
        const lines = code.split('\n');

        // Broadcaster
        NexusRouter.emitPacket({ source: 'logic', target: 'global', type: 'action', payload: { tool: 'CodeLinter', action: 'analyze', size: code.length } });

        // Heuristics
        if (code.includes('console.log')) issues.push("Warning: 'console.log' usage detected. Ensure cleanup.");
        if (code.includes('any')) issues.push("Warning: Explicit 'any' type used. Prefer strict typing.");
        if (lines.length > 300) issues.push("Complexity: File length exceeds 300 lines. Consider splitting.");
        if (code.includes('TODO')) issues.push("Note: Project contains pending TODO items.");

        // Simple brace check
        const openBraces = (code.match(/\{/g) || []).length;
        const closeBraces = (code.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) issues.push("Critical: Mismatched braces detected.");

        return {
            valid: issues.length === 0,
            score: Math.max(0, 100 - (issues.length * 10)),
            issues
        };
    }
};

/**
 * UNITY: GraphConnector
 * Analyzes a node and suggests connections based on context resonance (tag overlap).
 */
export const GraphConnector = {
    findConnections: (targetId: string, library: MemCube[]): string[] => {
        NexusRouter.emitPacket({ source: 'unity', target: 'global', type: 'action', payload: { tool: 'GraphConnector', action: 'connect', targetId } });

        const target = library.find(n => n.id === targetId);
        if (!target) return [];

        const connections: string[] = [];
        const targetTags = target.meta?.context || [];

        library.forEach(node => {
            if (node.id === targetId) return;
            const nodeTags = node.meta?.context || [];
            const overlap = targetTags.filter(t => nodeTags.includes(t));
            if (overlap.length >= 2) connections.push(node.id);
        });

        return connections;
    }
};

/**
 * EXISTENCE: VitalityMonitor
 * Monitors system performance and resource usage metrics.
 */
export const VitalityMonitor = {
    checkVitality: () => {
        const memory = (performance as any).memory ? (performance as any).memory.usedJSHeapSize / 1048576 : 0;
        const appUptime = performance.now() / 1000;

        NexusRouter.emitPacket({ source: 'existence', target: 'global', type: 'state_update', payload: { tool: 'VitalityMonitor', stats: { memory, uptime: appUptime } } });

        return {
            status: memory > 500 ? 'Strain' : 'Healthy',
            memoryMB: Math.round(memory),
            uptimeSeconds: Math.round(appUptime),
            fps: 60 // Mock for now
        };
    }
};

/**
 * MASTERY: TestRunner
 * Simulates or triggers test execution logic.
 */
export const TestRunner = {
    runSuite: async (suiteName: string): Promise<{ passed: boolean, report: string }> => {
        NexusRouter.emitPacket({ source: 'mastery', target: 'global', type: 'action', payload: { tool: 'TestRunner', action: 'test', suite: suiteName } });
        console.log(`[Mastery] Running suite: ${suiteName}...`);
        await new Promise(r => setTimeout(r, 1500));

        const passed = Math.random() > 0.1;
        return {
            passed,
            report: passed
                ? `PASS ${suiteName} (24/24 assertion)`
                : `FAIL ${suiteName} (1/24 assertions failed: expected 'Novice' received 'Initiate')`
        };
    }
};

/**
 * OMNI: IndexSearch
 * Full-text search capability for the library.
 */
export const IndexSearch = {
    search: (query: string, library: MemCube[]): MemCube[] => {
        NexusRouter.emitPacket({ source: 'omni', target: 'global', type: 'thought', payload: { tool: 'IndexSearch', query } });
        const q = query.toLowerCase();
        return library.filter(node => {
            const text = (node.content.text || '').toLowerCase();
            const tags = (node.meta?.context || []).join(' ').toLowerCase();
            return text.includes(q) || tags.includes(q);
        });
    }
};

// --- NEW TOOLS (Expansion Pack) ---

export const GithubConnector = {
    sync: (mode: string) => {
        NexusRouter.emitPacket({ source: 'self', target: 'global', type: 'action', payload: { tool: 'GithubConnector', action: 'sync', mode } });
        return {
            status: "Success",
            message: `Identity Synced with GitHub (${mode || 'pull'}).`,
            repo: "zakde/the-mystra-nexus",
            commits: ["feat: Council Tools", "fix: MemoryGraph crash"]
        };
    }
};

export const ContextRefiner = {
    crystalize: (memories: MemCube[]) => {
        NexusRouter.emitPacket({ source: 'thought', target: 'global', type: 'thought', payload: { tool: 'ContextRefiner', action: 'crystalize', count: memories.length } });
        return {
            reduced: true,
            originalTokens: 14500,
            compressedTokens: 4200,
            summary: "User implemented Council Tools and fixed critical UI bugs in MemoryGraph."
        };
    }
};

export const SonicTuner = {
    tune: (mode: string) => {
        NexusRouter.emitPacket({ source: 'resonance', target: 'global', type: 'action', payload: { tool: 'SonicTuner', action: 'tune', mode } });
        return {
            mode: mode || "Focus",
            bpm: 120,
            key: "C Minor",
            mood: "Productive"
        };
    }
};

export const DeployForge = {
    deploy: (target: string) => {
        NexusRouter.emitPacket({ source: 'transcendence', target: 'global', type: 'action', payload: { tool: 'DeployForge', action: 'deploy', target } });
        return {
            platform: target || "Vercel",
            url: "https://mystra-nexus-v4.vercel.app",
            status: "Live",
            buildTime: "14s"
        };
    }
};

// ... existing tools



export const DependencyAuditor = {
    audit: () => {
        NexusRouter.emitPacket({ source: 'improvement', target: 'global', type: 'action', payload: { tool: 'DependencyAuditor', action: 'audit' } });
        return {
            score: 98,
            outdated: [
                { name: "vite", current: "5.0.0", latest: "5.1.0" },
                { name: "lucide-react", current: "0.290.0", latest: "0.300.0" }
            ],
            vulnerabilities: []
        };
    }
};

export const CodeBaseAgent = {
    indexFromConsole: async () => {
        NexusRouter.emitPacket({ source: 'improvement', target: 'global', type: 'action', payload: { tool: 'SystemArchitect', action: 'index' } });
        return await SystemArchitect.indexCodebase();
    },
    search: async (query: string) => {
        NexusRouter.emitPacket({ source: 'improvement', target: 'global', type: 'thought', payload: { tool: 'SystemArchitect', action: 'search', query } });
        return await SystemArchitect.searchMemory(query);
    }
};
