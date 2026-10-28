import { cyrb53 } from '../hooks/useOntologicalGenome';

export type NodeType = 'entrance' | 'combat' | 'loot' | 'event' | 'boss' | 'exit';

export interface DomainNode {
    id: string;
    type: NodeType;
    name: string;
    description: string;
    connections: string[]; // node IDs
    x: number;
    y: number;
    cleared?: boolean;
    assignedNpcId?: string; // Hexroll NPC ID or slug
}

export interface DomainMap {
    id: string;
    theme: string;
    nodes: Record<string, DomainNode>;
    startNodeId: string;
    exitNodeId: string;
}

const THEMES = ['Neon Cyber-Slums', 'Abandoned Corporate Server', 'Aetherial Matrix Ruins', 'Void Sector', 'Bioluminescent Data Caverns'];

const NODE_NAMES: Record<NodeType, string[]> = {
    entrance: ['Infiltration Point', 'VPN Gateway', 'Drop Zone'],
    combat: ['Security Chokepoint', 'Firewall Grid', 'Ice Construct Alert', 'Rogue Agent Encounter'],
    loot: ['Encrypted Data Cache', 'Forgotten Wallet', 'Weaponized Script Depository'],
    event: ['Glitching Terminal', 'Rogue AI Negotiator', 'Corrupted Logic Puzzle'],
    boss: ['Core Sentinel Area', 'Master Control Program', 'SysAdmin Override'],
    exit: ['Extraction Point', 'Red-Line Exit', 'Physical Uplink']
};

const seededRandom = (seed: number) => {
    let currentSeed = seed;
    return () => {
        currentSeed = (currentSeed * 1664525 + 1013904223) >>> 0;
        return currentSeed / 4294967296;
    };
};

/**
 * Generates a Hexroll-inspired Domain Map of interconnected nodes.
 */
export const generateDomainMap = (domainSeedId: string, depth: number = 1): DomainMap => {
    const seed = cyrb53(domainSeedId);
    const rng = seededRandom(seed);
    const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

    const theme = pick(THEMES);
    const nodeCount = 5 + Math.floor(rng() * (3 + depth * 2)); // Scales with depth
    const nodes: Record<string, DomainNode> = {};

    let currentX = 0;
    let currentY = 0;

    // Create Entrance
    const startId = `node_0`;
    nodes[startId] = {
        id: startId,
        type: 'entrance',
        name: pick(NODE_NAMES.entrance),
        description: `You have bypassed the outer defense rings of the ${theme}. There's no turning back without the payload.`,
        connections: [],
        x: currentX,
        y: currentY
    };

    let previousNodes = [startId];
    let nextNodes: string[] = [];
    
    // Generate middle nodes
    let nodeIdCounter = 1;
    for (let layer = 1; layer < Math.floor(nodeCount / 2); layer++) {
        currentX += 100 + rng() * 50;
        const nodesInLayer = 1 + Math.floor(rng() * 3); // 1 to 3 nodes per layer
        
        const layerYStart = currentY - (nodesInLayer * 50) / 2;
        
        for (let i = 0; i < nodesInLayer; i++) {
            const id = `node_${nodeIdCounter++}`;
            const rand = rng();
            let type: NodeType = 'combat';
            if (rand > 0.8) type = 'loot';
            else if (rand > 0.6) type = 'event';

            nodes[id] = {
                id, type,
                name: pick(NODE_NAMES[type]),
                description: `A ${type} node within the ${theme}.`,
                connections: [],
                x: currentX,
                y: layerYStart + i * 80 + (rng() * 20 - 10),
                assignedNpcId: ['combat', 'event'].includes(type) ? `npc.${theme.replace(/\s+/g, '')}.${id}` : undefined
            };
            nextNodes.push(id);

            // Connect to at least one previous node
            const prev = pick(previousNodes);
            if (!nodes[prev].connections.includes(id)) {
                nodes[prev].connections.push(id);
                nodes[id].connections.push(prev); // bidirecional for graph
            }
        }
        
        // Sometimes cross-connect nodes within the same layer or previous layer
        if (nextNodes.length > 1 && rng() > 0.5) {
            const n1 = nextNodes[0];
            const n2 = nextNodes[1];
            nodes[n1].connections.push(n2);
            nodes[n2].connections.push(n1);
        }

        previousNodes = [...nextNodes];
        nextNodes = [];
    }

    // Boss Node
    currentX += 120;
    const bossId = `node_${nodeIdCounter++}`;
    nodes[bossId] = {
        id: bossId, type: 'boss',
        name: pick(NODE_NAMES.boss),
        description: 'The final security layer. Defeat the guardian to gain extraction clearance.',
        connections: [],
        x: currentX, y: currentY,
        assignedNpcId: `npc.${theme.replace(/\s+/g, '')}.${bossId}`
    };
    
    // Connect all last edges to boss
    previousNodes.forEach(prev => {
        if (!nodes[prev].connections.includes(bossId)) {
            nodes[prev].connections.push(bossId);
            nodes[bossId].connections.push(prev);
        }
    });

    // Exit Node
    currentX += 100;
    const exitId = `node_${nodeIdCounter++}`;
    nodes[exitId] = {
        id: exitId, type: 'exit',
        name: pick(NODE_NAMES.exit),
        description: 'Hardline out. Secure the payload and jack out to the Hub.',
        connections: [bossId],
        x: currentX, y: currentY
    };
    nodes[bossId].connections.push(exitId);

    return {
        id: domainSeedId,
        theme,
        nodes,
        startNodeId: startId,
        exitNodeId: exitId
    };
};
