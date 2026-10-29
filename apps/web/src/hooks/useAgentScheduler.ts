import { useState, useEffect, useCallback } from 'react';
import type { AgentOrchestrator } from '@Omni/lib/modules/AgentOrchestrator';
import type { LibraryNode } from '@Omni/types';

interface SchedulerConfig {
    intervalMs?: number;
    enabled?: boolean;
}

export const useAgentScheduler = (
    orchestrator: AgentOrchestrator,
    library: LibraryNode | null,
    graphNodes: any[],
    config: SchedulerConfig = {}
) => {
    const { intervalMs = 5000, enabled = true } = config;
    const [lastTick, setLastTick] = useState<{ category: string, result: any, debug: any } | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const tick = useCallback(async () => {
        if (!orchestrator || !enabled) return;

        // Pass 'null' for library/graph if not ready, or handle inside orchestrator gracefully
        const tickResult = await orchestrator.runFairTick(
            library || { id: 'root', name: 'void', children: {}, books: [] } as any,
            graphNodes || []
        );

        setLastTick(tickResult);

        if (tickResult.category !== 'None' && tickResult.result) {
            const insights = tickResult.result.insights || [];
            if (insights.length > 0) {
                const timestamp = new Date().toLocaleTimeString();
                const newLogs = insights.map((i: string) => `[${timestamp}] [${tickResult.category}] ${i}`);
                setLogs(prev => [...newLogs, ...prev].slice(0, 100)); // Keep last 100
            }
        }
    }, [orchestrator, library, graphNodes, enabled]);

    useEffect(() => {
        if (!enabled) return;

        const timer = setInterval(() => {
            tick();
        }, intervalMs);

        return () => clearInterval(timer);
    }, [intervalMs, enabled, tick]);

    return {
        lastTick,
        logs,
        clearLogs: () => setLogs([])
    };
};
