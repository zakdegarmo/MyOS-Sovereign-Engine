/**
 * OntologicalContext.tsx
 *
 * Global React context for the active ontological navigation path.
 * This is the connective tissue for Phase 9C — it ties together:
 *   - The background SynergeticGraph (node click → sets path)
 *   - The 3D AvatarScene (path → correct agent/sprite appears)
 *   - The OrchestratorPanel/Tutor (path → lore context in system prompt)
 *   - The LibraryExplorer (path → filters entries by ontological alignment)
 *   - The SpriteLaboratory EXPLORE tab (path → genome explorer prefill)
 *
 * Usage:
 *   Wrap <App> in <OntologicalProvider>.
 *   Anywhere in the tree: const { path, setPath, entry } = useOntologicalContext();
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { getBrainEntryByPath } from '../memory/brainLibraryData';

// Re-export type for convenience
export type { } from '../memory/brainLibraryData';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface OntologicalContextValue {
    /** The currently active ontological path, e.g. "self.identity.ego" */
    activePath: string | null;
    /** Set a new active path */
    setActivePath: (path: string | null) => void;
    /** Navigate one segment deeper */
    drillDown: (segment: string) => void;
    /** Navigate one segment up */
    drillUp: () => void;
    /** Breadcrumb segments of the active path */
    breadcrumbs: string[];
    /** The top-level pillar of the active path */
    activePillar: string | null;
    /** The live brain library entry for the active path (if one exists) */
    activeEntry: ReturnType<typeof getBrainEntryByPath>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const OntologicalContext = createContext<OntologicalContextValue>({
    activePath: null,
    setActivePath: () => { },
    drillDown: () => { },
    drillUp: () => { },
    breadcrumbs: [],
    activePillar: null,
    activeEntry: undefined,
});

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export const OntologicalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activePath, setActivePathState] = useState<string | null>(null);

    const setActivePath = useCallback((path: string | null) => {
        setActivePathState(path ? path.toLowerCase().trim() : null);
    }, []);

    const drillDown = useCallback((segment: string) => {
        setActivePathState(prev => {
            const normalized = segment.toLowerCase().trim();
            return prev ? `${prev}.${normalized}` : normalized;
        });
    }, []);

    const drillUp = useCallback(() => {
        setActivePathState(prev => {
            if (!prev) return null;
            const parts = prev.split('.');
            if (parts.length <= 1) return null;
            return parts.slice(0, -1).join('.');
        });
    }, []);

    const breadcrumbs = useMemo(() => activePath ? activePath.split('.') : [], [activePath]);
    const activePillar = useMemo(() => breadcrumbs[0] ?? null, [breadcrumbs]);
    const activeEntry = useMemo(() => activePath ? getBrainEntryByPath(activePath) : undefined, [activePath]);

    return (
        <OntologicalContext.Provider value={{
            activePath,
            setActivePath,
            drillDown,
            drillUp,
            breadcrumbs,
            activePillar,
            activeEntry,
        }}>
            {children}
        </OntologicalContext.Provider>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export const useOntologicalContext = () => useContext(OntologicalContext);
