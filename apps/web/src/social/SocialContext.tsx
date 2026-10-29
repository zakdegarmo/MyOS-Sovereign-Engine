import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { EconomyInstance } from '../council/EconomySystem';
import { SystemLogger } from '../engine/SystemLogger';

export interface PillarScores {
  self: number;
  thought: number;
  logic: number;
  unity: number;
  existence: number;
  improvement: number;
  mastery: number;
  resonance: number;
  transcendence: number;
  omniscience: number;
}

export type OntoCoin = 
    | 'SelCoin' | 'ThoCoin' | 'LogCoin' | 'UniCoin' | 'ExiCoin' 
    | 'ImpCoin' | 'MasCoin' | 'ResCoin' | 'TraCoin' | 'OmniCoin';

const PILLAR_TO_COIN: Record<keyof PillarScores, OntoCoin> = {
  self: 'SelCoin',
  thought: 'ThoCoin',
  logic: 'LogCoin',
  unity: 'UniCoin',
  existence: 'ExiCoin',
  improvement: 'ImpCoin',
  mastery: 'MasCoin',
  resonance: 'ResCoin',
  transcendence: 'TraCoin',
  omniscience: 'OmniCoin'
};

export type DialogueTurn = 1 | 2 | 3 | 4 | 5;

export interface MephitEntity {
  id: string;
  name: string;
  role: string;
  personality: string;
  assetType: 'sprite' | 'gif' | 'glb';
  assetUrl: string;
  scale: number;
  pillarScores: PillarScores;
  chromaKey?: { similarity: number };
}

interface SocialManifest {
  ontology: {
    pillars: string[];
    relationshipMatrix: Record<string, { out: Record<string, string> }>;
  };
  entities: Record<string, MephitEntity>;
}

interface InteractionState {
  active: boolean;
  partnerId: string | null;
  turn: DialogueTurn;
  topicPillar: string | null;
  relationshipNarrative: string | null;
  history: { role: string; content: string }[];
}

interface SocialContextType {
  manifest: SocialManifest | null;
  registerPosition: (id: string, pos: [number, number, number]) => void;
  unregisterPosition: (id: string) => void;
  startInteraction: (subjectId: string, targetId: string) => void;
  advanceDialogue: (subjectId: string) => void;
  getInteractionState: (id: string) => InteractionState | null;
  updatePillarScore: (entityId: string, pillar: keyof PillarScores, delta: number) => void;
}

const SocialContext = createContext<SocialContextType | null>(null);

// --- CONVERSATION GOVERNOR CONSTANTS ---
const MAX_CONCURRENT = 2;              // House Limitation: Only 2 talks at once
const GLOBAL_COOLDOWN_MS = 10000;      // Staggering: 10s between any new starts
const INDIVIDUAL_REFRACTORY_MS = 30000; // Personal space: 30s pause after talking
const HEARTBEAT_TTL_MS = 10000;         // Stale Position TTL: 10s

/**
 * SocialProvider.tsx
 * 
 * Optimized for 60fps stability with 'Silent Refs'.
 * Implements a Conversation Governor to throttle interaction frequency.
 * PERSISTENT & PURE: No zombie entities allowed in the proximity loop.
 */
export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [manifest, setManifest] = useState<SocialManifest | null>(null);
  const [interactions, setInteractions] = useState<Record<string, InteractionState>>({});
  
  // SILENT TRACKING
  const entityPositionsRef = useRef<Record<string, [number, number, number]>>({});
  const entityHeartbeatRef = useRef<Record<string, number>>({});
  const interRefs = useRef<Record<string, boolean>>({});
  
  // THROTTLE REFS
  const lastGlobalStartTime = useRef<number>(0);
  const lastEntityInteractionTime = useRef<Record<string, number>>({});

  useEffect(() => {
    fetch('/assets/mephit_manifest.json').then(res => res.json()).then(data => setManifest(data)).catch(() => {});
  }, []);

  const registerPosition = useCallback((id: string, pos: [number, number, number]) => {
    entityPositionsRef.current[id] = pos;
    entityHeartbeatRef.current[id] = Date.now();
  }, []);

  const unregisterPosition = useCallback((id: string) => {
    delete entityPositionsRef.current[id];
    delete entityHeartbeatRef.current[id];
    delete lastEntityInteractionTime.current[id];
    delete interRefs.current[id];
  }, []);

  const startInteraction = useCallback((subjectId: string, targetId: string) => {
    const now = Date.now();
    
    // FINAL THROTTLE CHECK (Double Guard)
    const activeCount = Object.values(interRefs.current).filter(v => v).length / 2;
    if (activeCount >= MAX_CONCURRENT) return;
    if (now - lastGlobalStartTime.current < GLOBAL_COOLDOWN_MS) return;

    const subject = manifest?.entities[subjectId];
    const target = manifest?.entities[targetId];
    
    if (!subject || !target) return;

    const sP = subject.pillarScores || { logic: 50, mastery: 50 };
    const tP = target.pillarScores || { logic: 50, improvement: 50 };
    
    const subDom = Object.entries(sP).sort((a,b) => (b[1] as number) - (a[1] as number))[0][0];
    const tarDom = Object.entries(tP).sort((a,b) => (b[1] as number) - (a[1] as number))[0][0];
    const topicPillar = subDom;
    const narrative = manifest?.ontology.relationshipMatrix[subDom]?.out[tarDom] || "Interacts With";

    lastGlobalStartTime.current = now;
    interRefs.current[subjectId] = true;
    interRefs.current[targetId] = true;

    const initialState: InteractionState = {
      active: true,
      partnerId: targetId,
      turn: 1,
      topicPillar,
      relationshipNarrative: narrative,
      history: []
    };

    setInteractions(prev => ({
      ...prev,
      [subjectId]: initialState,
      [targetId]: { ...initialState, partnerId: subjectId, relationshipNarrative: manifest?.ontology.relationshipMatrix[tarDom]?.out[subDom] || narrative }
    }));
  }, [manifest]);

  const advanceDialogue = useCallback((id: string) => {
    setInteractions(prev => {
        const state = prev[id];
        if (!state || !state.active) return prev;
        const partnerId = state.partnerId!;

        if (state.turn >= 5) {
            const now = Date.now();
            lastEntityInteractionTime.current[id] = now;
            lastEntityInteractionTime.current[partnerId] = now;
            interRefs.current[id] = false;
            interRefs.current[partnerId] = false;

            const nextInteractions = { ...prev };
            delete nextInteractions[id]; delete nextInteractions[partnerId];

            // Completion Bonus
            updatePillarScore(id, state.topicPillar as keyof PillarScores, 50);

            return nextInteractions;
        } else {
            const nextTurn = (state.turn + 1) as DialogueTurn;
            
            // Turn Reward
            updatePillarScore(id, state.topicPillar as keyof PillarScores, 10);

            return { ...prev, [id]: { ...state, turn: nextTurn }, [partnerId]: { ...prev[partnerId], turn: nextTurn } };
        }
    });
  }, []);

  const getInteractionState = useCallback((id: string) => interactions[id] || null, [interactions]);

  const updatePillarScore = useCallback((id: string, pillar: keyof PillarScores, delta: number) => {
    const coin = PILLAR_TO_COIN[pillar];
    if (coin) {
      EconomyInstance.mint('user', coin, delta);
      SystemLogger.log(`User earned ${delta} ${coin} via ${id} interaction.`, { source: 'AXIOM_GAIN', silent: true });
    }
  }, []);

  // Proximity Service (Runs silently)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Heartbeat Pruning (Zombie Purge)
      const heartbeat = entityHeartbeatRef.current;
      const positions = entityPositionsRef.current;
      Object.keys(heartbeat).forEach(id => {
        if (now - heartbeat[id] > HEARTBEAT_TTL_MS) {
            delete positions[id];
            delete heartbeat[id];
        }
      });

      // Global Throttle: Stagger Starts
      if (now - lastGlobalStartTime.current < GLOBAL_COOLDOWN_MS) return;

      // Concurrency Limit: Only allowed N conversations
      const activeConvsCount = Object.values(interRefs.current).filter(v => v).length / 2;
      if (activeConvsCount >= MAX_CONCURRENT) return;

      const ids = Object.keys(positions);
      if (ids.length < 2) return;

      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
            const idA = ids[i], idB = ids[j];
            
            // Check Individual Refractory
            if ((now - (lastEntityInteractionTime.current[idA] || 0)) < INDIVIDUAL_REFRACTORY_MS) continue;
            if ((now - (lastEntityInteractionTime.current[idB] || 0)) < INDIVIDUAL_REFRACTORY_MS) continue;

            // Check if already talking
            if (interRefs.current[idA] || interRefs.current[idB]) continue;

            const pA = positions[idA], pB = positions[idB];
            const d = Math.sqrt((pA[0]-pB[0])**2 + (pA[1]-pB[1])**2 + (pA[2]-pB[2])**2);
            if (d < 5.0) {
              startInteraction(idA, idB);
              return; // Start only one per tick
            }
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [startInteraction]);

  const value = useMemo(() => ({ manifest, registerPosition, unregisterPosition, startInteraction, advanceDialogue, getInteractionState, updatePillarScore }), [manifest, registerPosition, unregisterPosition, startInteraction, advanceDialogue, getInteractionState, updatePillarScore]);
  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
};

export const useSocial = () => useContext(SocialContext)!;

